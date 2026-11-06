# Sprint 1 engineering contracts

Version 0.4 for Issue #4. Applies to F-01 through F-03.

Revision history: v0.1 introduced AC-01–14. v0.2 resolves review findings by specifying session expiry (FR-01, AC-03 / TEST-03), reason bounds (BR-05, AC-11 / TEST-11), and payloads (FR-02–06, AC-04 / TEST-04 and AC-10 / TEST-10). It moves inventory and traceability into dedicated files without renumbering requirements or checks.

v0.3 adds feature scope, UI routes and database constraints for Issue #3. AC and TEST IDs are unchanged.

v0.4 specifies the synthetic seed and isolated test database setup for Issue #4. It changes no AC or TEST IDs. The seed creates two Requesters and two Reviewers with preset one-to-one assignments, reads passwords from private environment variables, and preserves existing users, credentials, assignments, requests and history on rerun. Test migration setup requires an explicit local PostgreSQL URL with a database name ending `_test` and rejects a target matching the development database. See [database setup](../../database.md) for the commands and verification limits.

## F-01 — Identity and session

**Scope and dependencies:** FR-01, BR-01, NFR-02–04. Depends on synthetic users and the session table. Covers login, identity and logout; registration and recovery are out of scope.

**UI routes:** `/login`. Show ready, invalid credentials, submitting and retry states; redirect active sessions to the role-specific list. Expired sessions return to login.

The login page accepts a login and password and shows a generic error for invalid credentials. Successful login leads to the role-specific list. GET /api/session restores the signed-in view on reload; logout returns to login. The API never returns a password hash or session token in JSON.

| Method and path | Input and success |
| --- | --- |
| POST /api/session | login and password; 200 with id and role, and an opaque session cookie |
| GET /api/session | Session cookie; 200 with id and role, 401 if absent/expired |
| DELETE /api/session | Revoke session and clear cookie; 204, including repeated logout |

Verify the password against a salted hash and create a new opaque session. Store its SHA-256 digest with an absolute expiry of eight hours after login, with no renewal in Sprint 1. Reject expired sessions at or after the expiry instant and set the cookie lifetime to match. Use an HttpOnly, SameSite cookie and Secure under HTTPS; check request origin for state-changing calls. Bad credentials return 401 and create no session. Protected requests derive identity from the session only.

## F-02 — Submit and retrieve a purchase request

**Scope and dependencies:** FR-02–03, BR-01, BR-03–04, BR-09, NFR-01–02, NFR-04. Depends on F-01, purchase storage and preset reviewer mapping. Covers submitting and reading owned requests; edits and drafts are out of scope.

**UI routes:** `/requests, /requests/new, /requests/:id`. List and detail show loading, empty or not-found, and retry states as applicable. New request shows editing, validation, submitting and success states; reviewer-unavailable preserves inputs.

The requester list shows owned requests and links to detail. The form accepts title, purpose and amount, shows field errors, and disables duplicate submission while pending. On success open the saved detail. Show a clear retry message if no reviewer is available. Submitted requests are read-only.

| Method and path | Input and success |
| --- | --- |
| POST /api/requests | title, purpose and decimal amount as a string; 201 with saved request |
| GET /api/requests | Session only; 200 with role-scoped list in newest-first order |
| GET /api/requests/{id} | Request ID; 200 with role-scoped detail including status and history |

Trim outer whitespace and count Unicode code points. Accept title 3–120 and purpose 10–2,000 characters, inclusive. Accept plain decimal strings with up to two fractional digits and value THB 0.01–1,000,000.00 inclusive; store in integer satang and return a two-place decimal string. Invalid fields return 422. Ignore no ownership or status claims: reject unexpected input keys with 422. Resolve the preset reviewer server-side. Missing, wrong-role or self reviewer returns 409 REVIEWER_UNAVAILABLE and writes neither a request nor event. Success persists SUBMITTED and its initial event together. No edit operation is exposed in Sprint 1.

## F-03 — Decide and retrieve history

**Scope and dependencies:** FR-04–06, BR-02, BR-05–08, NFR-01–02, NFR-04–05. Depends on F-01, F-02 and atomic transactions. Covers assigned review and history; return and additional stages are out of scope.

**UI routes:** `/reviews, /reviews/:id`. Show loading, empty queue, not-found and retry states. Detail shows ready, validation, submitting, conflict with refresh, and final read-only states.

The reviewer sees only assigned requests. On submitted detail, display Approve and Reject, and a reason field. Require a nonblank trimmed reason for rejection. Approval may omit it. A supplied reason must contain 1–500 Unicode code points after trimming. Omitted approval reason is stored as null. Disable decision controls while submitting and after a terminal decision; refresh detail on conflict. Both authorized roles see persisted history in detail, oldest first with a stable tie-breaker.

POST /api/requests/{id}/decision accepts decision APPROVE or REJECT and optional reason; returns 200 with saved status and history. Invalid fields return 422. Requester callers receive 403 and out-of-scope or missing IDs return 404; all protected routes return 401 without a valid session. A terminal request or a lost concurrent attempt returns 409 DECISION_CONFLICT. Only the first eligible update from SUBMITTED can write the terminal status and one matching event. Transaction failure rolls back both writes. There is one stage and no return transition in Sprint 1.

## Response and storage details

- Session responses contain only `id` and `role` (`REQUESTER` or `REVIEWER`). The cookie is named `session`.
- List returns `{ requests: [...] }`. Submit, detail and decision return `{ request: {...} }`. Request summary fields are `id`, `title`, `amount`, `currency` (THB), `status`, and `createdAt`. Detail adds `purpose`, `requesterId`, `reviewerId`, and `history`; submit and decision return the detail shape. Sort lists by creation time then ID descending.
- Each history entry contains `id`, `type` (SUBMITTED, APPROVED or REJECTED), `actorId`, `createdAt`, and nullable `reason`. History sorts by creation time then ID ascending. Timestamps are ISO 8601 UTC.
- The preset assignment is a table keyed by requester ID with a reviewer ID. Persist request amount as integer satang in [1, 100000000]. Require request and event foreign keys and enforce one terminal event per request. The service validates assigned roles and performs state changes atomically.
- Errors use `{ error: { code, message, fields? } }`; `fields` maps invalid field names to messages. Use AUTH_REQUIRED, INVALID_CREDENTIALS, FORBIDDEN, NOT_FOUND and VALIDATION_ERROR for the corresponding common errors. Malformed JSON returns 400 BAD_REQUEST. Use generic messages for missing or out-of-scope IDs.

## PostgreSQL handoff for Issue #3

| Table | Columns and constraints |
| --- | --- |
| users | id UUID PK; login TEXT NOT NULL UNIQUE; password_hash TEXT NOT NULL; role enum REQUESTER/REVIEWER NOT NULL. Normalize login before lookup and insert. |
| sessions | token_digest CHAR(64) PK (lowercase SHA-256 hex); user_id UUID NOT NULL FK users; expires_at TIMESTAMPTZ NOT NULL; indexes on user_id and expires_at. |
| reviewer_assignments | requester_id UUID PK FK users; reviewer_id UUID NOT NULL FK users; CHECK requester_id <> reviewer_id. Verify both role assignments in the service. |
| purchase_requests | id UUID PK; requester_id and reviewer_id UUID NOT NULL FK users; title VARCHAR(120) and purpose VARCHAR(2000) NOT NULL, with character length checks of 3–120 and 10–2000; amount_satang INTEGER NOT NULL CHECK between 1 and 100000000; status enum SUBMITTED/APPROVED/REJECTED NOT NULL; created_at TIMESTAMPTZ NOT NULL; CHECK requester_id <> reviewer_id. Index (requester_id, created_at, id) and (reviewer_id, created_at, id). |
| request_events | id UUID PK; request_id UUID NOT NULL FK purchase_requests; actor_id UUID NOT NULL FK users; type uses the request status enum; created_at TIMESTAMPTZ NOT NULL; reason VARCHAR(500) nullable. Require a reason on REJECTED, prohibit it on SUBMITTED, and check trimmed nonblank length for any stored reason. Index (request_id, created_at, id); partial unique indexes on request_id for SUBMITTED events and for terminal events. |

Use restricted deletion for request and event references. Derive ownership from the session, validate assigned roles in the service, and keep status and event writes in one transaction. Migration tests should verify the checks, foreign keys and unique indexes on PostgreSQL.

## Acceptance criteria and software test specification

Every row is planned. Use synthetic accounts and isolated deterministic fixtures for API/database checks. Reload from the server to verify persisted results.

| AC / planned test | Level | Setup and action | Expected result |
| --- | --- | --- | --- |
| AC-01 / TEST-01 | API | Seed both roles, log in as each, then get session | Correct identity and role; response excludes credentials |
| AC-02 / TEST-02 | API | Submit bad password, then call a protected route without a session | 401 in both cases; no session created |
| AC-03 / TEST-03 | API | Log in, log out, then reuse that cookie | Logout 204; reuse returns 401. A fresh session works before eight hours and returns 401 at the expiry instant using a controlled clock |
| AC-04 / TEST-04 | API/DB | Requester with eligible mapping submits a valid request, reloads detail | 201, assigned reviewer, persisted SUBMITTED and one submission event |
| AC-05 / TEST-05 | API/DB | Try exact field bounds, adjacent invalid lengths/amounts, whitespace-only text and excess decimal precision | Both bounds accepted, invalid inputs 422, no invalid writes, amount round-trips exactly |
| AC-06 / TEST-06 | API/DB | Try absent, wrong-role and self reviewer mapping | 409 for each; no request or event |
| AC-07 / TEST-07 | API | Two requesters submit, then one lists and reads the other ID; reviewer attempts creation | List contains only own requests; detail 404; creation 403 |
| AC-08 / TEST-08 | API/DB | Attempt to edit a submitted request | No supported edit operation; stored data remains unchanged |
| AC-09 / TEST-09 | API | Two reviewers with different assignments list and read detail/history; requester attempts decision | Assigned rows only; out-of-scope detail/decision 404; requester decision 403 |
| AC-10 / TEST-10 | API/DB | Approve without reason; reject another request with a reason; reload both | Each terminal state has one matching durable decision event |
| AC-11 / TEST-11 | API/DB | Reject without a reason, with whitespace only, or with 501 code points; also reject an oversized approval reason and accept a valid 500-code-point reason on a separate request | Invalid attempts return 422 and write nothing; the valid boundary returns 200 and writes one event |
| AC-12 / TEST-12 | API/DB | Race two decisions on one request and retry the loser | One 200, remaining attempts 409, exactly one terminal event |
| AC-13 / TEST-13 | API/DB | Force decision event insertion failure after status update | Transaction rolls back; still SUBMITTED with original history |
| AC-14 / TEST-14 | Manual and system | Run documented setup/build/test on the release commit; complete the journey by keyboard on desktop and mobile; restart and retrieve; inspect for exposed secrets | Runnable release, reachable and labelled controls, no horizontal overflow, durable data, no secret exposure; record commands and outcomes |

## Product Definition of Done

The reviewed revision identifies all feature, requirement, AC and TEST IDs and resolves open choices for implemented features. A clean setup can run migrations, seed and build/test commands. All required checks have real results, including access boundaries and the persisted journey. The tested commit, evidence and known limitations are recorded, and the linked pull request has substantive teammate review and staging integration.
