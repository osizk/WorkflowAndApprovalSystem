# Sprint 1 engineering contracts

Version 0.1 — initial review draft for Issue #2. Applies to F-01 through F-03. Changes after review must name the changed requirement, reason, version and affected acceptance criteria and tests. Exact framework, session lifetime, and decision-reason maximum are open for review; the affected work must use the accepted values.

## F-01 — Identity and session

The login page accepts a login and password and shows a generic error for invalid credentials. Successful login leads to the role-specific list. GET /api/session restores the signed-in view on reload; logout returns to login. The API never returns a password hash or session token in JSON.

| Method and path | Input and success |
| --- | --- |
| POST /api/session | login and password; 200 with id and role, and an opaque session cookie |
| GET /api/session | Session cookie; 200 with id and role, 401 if absent/expired |
| DELETE /api/session | Revoke session and clear cookie; 204, including repeated logout |

Verify the password against a salted hash and create a new opaque session. Store its digest with expiry server-side. Use an HttpOnly, SameSite cookie and Secure under HTTPS; check request origin for state-changing calls. Bad credentials return 401 and create no session. Protected requests derive identity from the session only.

## F-02 — Submit and retrieve a purchase request

The requester list shows owned requests and links to detail. The form accepts title, purpose and amount, shows field errors, and disables duplicate submission while pending. On success open the saved detail. Show a clear retry message if no reviewer is available. Submitted requests are read-only.

| Method and path | Input and success |
| --- | --- |
| POST /api/requests | title, purpose and decimal amount as a string; 201 with saved request |
| GET /api/requests | Session only; 200 with role-scoped list in newest-first order |
| GET /api/requests/{id} | Request ID; 200 with role-scoped detail including status and history |

Trim outer whitespace and count Unicode code points. Accept title 3–120 and purpose 10–2,000 characters, inclusive. Accept plain decimal strings with up to two fractional digits and value THB 0.01–1,000,000.00 inclusive; store in integer satang and return a two-place decimal string. Invalid fields return 422. Ignore no ownership or status claims: reject unexpected input keys with 422. Resolve the preset reviewer server-side. Missing, wrong-role or self reviewer returns 409 REVIEWER_UNAVAILABLE and writes neither a request nor event. Success persists SUBMITTED and its initial event together. No edit operation is exposed in Sprint 1.

## F-03 — Decide and retrieve history

The reviewer sees only assigned requests. On submitted detail, display Approve and Reject, and a reason field. Require a nonblank trimmed reason for rejection. Approval may omit it. Disable decision controls while submitting and after a terminal decision; refresh detail on conflict. Both authorized roles see persisted history in detail, oldest first with a stable tie-breaker.

POST /api/requests/{id}/decision accepts decision APPROVE or REJECT and optional reason; returns 200 with saved status and history. Invalid fields return 422. Requester callers receive 403 and out-of-scope or missing IDs return 404; all protected routes return 401 without a valid session. A terminal request or a lost concurrent attempt returns 409 DECISION_CONFLICT. Only the first eligible update from SUBMITTED can write the terminal status and one matching event. Transaction failure rolls back both writes. There is one stage and no return transition in Sprint 1.

## Acceptance criteria and software test specification

Every row is planned. Use synthetic accounts and isolated deterministic fixtures for API/database checks. Reload from the server to verify persisted results.

| AC / planned test | Level | Setup and action | Expected result |
| --- | --- | --- | --- |
| AC-01 / TEST-01 | API | Seed both roles, log in as each, then get session | Correct identity and role; response excludes credentials |
| AC-02 / TEST-02 | API | Submit bad password, then call a protected route without a session | 401 in both cases; no session created |
| AC-03 / TEST-03 | API | Log in, log out, then reuse that cookie | Logout 204; reuse returns 401 |
| AC-04 / TEST-04 | API/DB | Requester with eligible mapping submits a valid request, reloads detail | 201, assigned reviewer, persisted SUBMITTED and one submission event |
| AC-05 / TEST-05 | API/DB | Try exact field bounds, adjacent invalid lengths/amounts, whitespace-only text and excess decimal precision | Both bounds accepted, invalid inputs 422, no invalid writes, amount round-trips exactly |
| AC-06 / TEST-06 | API/DB | Try absent, wrong-role and self reviewer mapping | 409 for each; no request or event |
| AC-07 / TEST-07 | API | Two requesters submit, then one lists and reads the other ID; reviewer attempts creation | List contains only own requests; detail 404; creation 403 |
| AC-08 / TEST-08 | API/DB | Attempt to edit a submitted request | No supported edit operation; stored data remains unchanged |
| AC-09 / TEST-09 | API | Two reviewers with different assignments list and read detail/history; requester attempts decision | Assigned rows only; out-of-scope detail/decision 404; requester decision 403 |
| AC-10 / TEST-10 | API/DB | Approve without reason; reject another request with a reason; reload both | Each terminal state has one matching durable decision event |
| AC-11 / TEST-11 | API/DB | Reject without a reason or with whitespace only | 422; no status change or event |
| AC-12 / TEST-12 | API/DB | Race two decisions on one request and retry the loser | One 200, remaining attempts 409, exactly one terminal event |
| AC-13 / TEST-13 | API/DB | Force decision event insertion failure after status update | Transaction rolls back; still SUBMITTED with original history |
| AC-14 / TEST-14 | Manual and system | Run documented setup/build/test on the release commit; complete the journey by keyboard on desktop and mobile; restart and retrieve; inspect for exposed secrets | Runnable release, reachable and labelled controls, no horizontal overflow, durable data, no secret exposure; record commands and outcomes |

## Product Definition of Done

The reviewed revision identifies all feature, requirement, AC and TEST IDs and resolves open choices for implemented features. A clean setup can run migrations, seed and build/test commands. All required checks have real results, including access boundaries and the persisted journey. The tested commit, evidence and known limitations are recorded, and the linked pull request has substantive teammate review and staging integration.
