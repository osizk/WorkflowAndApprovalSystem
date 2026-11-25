# Lab 7 change contract — proposed requester withdrawal

**Issue:** [#70 — Allow a Requester to withdraw a submitted purchase request](https://github.com/osizk/WorkflowAndApprovalSystem/issues/70)  
**Status:** Proposed for pair agreement. The 25 November instructor announcement says Lab 7 change requests do not require prior instructor or TA approval.  
**Contract revision:** 0.2-draft  
**Affected features:** F-02 Submit/retrieve and F-03 Review/history

## Change request

Change the Sprint 1 rule that a submitted purchase request cannot be edited and has no requester-initiated withdrawal. A Requester may withdraw their own request while its status is `SUBMITTED`, with a required reason of 1–500 Unicode code points after trimming. The withdrawal changes the status to `WITHDRAWN` and records one durable event atomically. Once an approval, rejection or withdrawal wins, competing transitions leave the status and history unchanged.

The change gives requesters a controlled way to stop a purchase request that is no longer needed while preserving an auditable record. It adds a state transition, backend ownership checks, persistence/migration, concurrency handling, and requester/reviewer UI behavior.

## Existing and proposed behavior

| Case | Sprint 1 behavior | Proposed Lab 7 behavior |
|---|---|---|
| Requester opens own submitted request | Read status/history; no edit or withdrawal action | May choose Withdraw request and enter a reason |
| Requester withdraws own SUBMITTED request with valid reason | No supported operation | HTTP 200; status becomes WITHDRAWN; one event stores the trimmed reason |
| Missing, whitespace-only or over-500 withdrawal reason | No supported operation | HTTP 422 with a reason-field error; status/history unchanged |
| Requester tries to withdraw another user's request | No supported operation | HTTP 404; no data disclosure or writes |
| Reviewer attempts withdrawal | No supported operation | HTTP 403; no writes |
| Withdraw an already APPROVED, REJECTED or WITHDRAWN request | No supported operation | HTTP 409; no additional event |
| Reviewer decision races with owner withdrawal | Decision may win from SUBMITTED | Exactly one transition wins; loser receives HTTP 409; exactly one terminal event is persisted |
| Read a withdrawn request | Not applicable | Owner and assigned Reviewer can read WITHDRAWN status and ordered history; unrelated users remain denied |

## Scope and exclusions

- Add one requester-owned transition from SUBMITTED to WITHDRAWN.
- Require the authenticated owner and a 1–500 code-point reason after trimming.
- Preserve request fields and the initial submission event. Do not delete records or rewrite history.
- Preserve existing approval/rejection behavior and backend Reviewer assignment checks.
- Reviewers can read the withdrawn request and history under existing assigned-reviewer access. They cannot decide a withdrawn request.
- Keep the current assigned review list behavior for terminal records unless a separate contract changes it. A withdrawn record has no decision controls.
- Do not add editing, resubmission, external notifications, file uploads, payment effects or additional approval stages.
- Add the WITHDRAWN status and event type through a forward migration. Existing records and events need no data backfill.
- Coordinate the migration and request-detail UI changes with Sprint 2 F-04 and any concurrent edits to shared request files.

## Requirement and traceability changes

- Add **FR-11**: A Requester can withdraw their own submitted request with a reason, and authorized users can retrieve its resulting status and history.
- Add **BR-10**: Only the authenticated owner may withdraw a request while SUBMITTED. A nonblank reason of 1–500 Unicode code points after trimming is required. Withdrawal and one matching event are committed atomically. Withdrawal competes with Reviewer approval/rejection through the same SUBMITTED precondition.
- Revise **BR-04** to keep submitted purchase fields read-only while explicitly allowing the separate withdrawal action under BR-10.
- Extend **BR-06/BR-07** to include withdrawal as a terminal state transition with one winning update and an atomic history event.
- Keep existing FR/BR/AC/TEST IDs unchanged and add the new IDs below. Update the SRS, F-02/F-03 feature contracts, System SDS and traceability in a versioned change. Record the Lab 7 change as a baseline revision for Deliverable 2.

## Impact analysis

| Area | Existing contract | Impact and planned verification |
|---|---|---|
| Request detail UI | F-02 `/requests/:id` | Add Withdraw request controls only for owner-owned SUBMITTED detail. Provide reason input, accessible validation, submitting, saved, conflict and retry feedback. Keep request fields read-only. |
| Reviewer UI | F-03 `/reviews/:id` | Render WITHDRAWN status and event reason in history; hide Approve/Reject for this terminal status. Preserve read access for the assigned Reviewer. |
| API and permissions | FR-02–06, F-02/F-03 routes | Add `POST /api/requests/{id}/withdraw` with `{reason}`. Identity comes from the session. Owner-only. Anonymous 401, Reviewer 403, another owner's or missing ID 404, invalid input 422, non-SUBMITTED/lost race 409. Success 200 with saved request detail. |
| Transaction and concurrency | BR-06/07, AC-12/13 | Conditional update from SUBMITTED and matching WITHDRAWN event in one database transaction. Race withdrawal against approve/reject and prove exactly one transition/event succeeds. |
| Schema and migration | `RequestStatus`, `PurchaseRequest.status`, `RequestEvent.type`, partial unique terminal-event index and reason constraint | Add enum value WITHDRAWN. Extend terminal uniqueness to APPROVED, REJECTED and WITHDRAWN. Require a nonblank reason for WITHDRAWN. Verify forward migration on an empty database and an isolated database containing Sprint 1 requests/history. Existing history stays readable. |
| Return/resubmit integration | F-04 Sprint 2 | A withdrawn request cannot be revised or resubmitted. Verify F-04 transition guards against WITHDRAWN and coordinate shared files and migration order. |

## Proposed acceptance criteria and STS

| ID | Level and intended test | Preconditions and input | Action | Expected result |
|---|---|---|---|---|
| AC-15 / TEST-15 | API/DB, `tests/requests.test.mjs` | Owner, assigned Reviewer and SUBMITTED request; valid trimmed reason | Owner POSTs `/api/requests/{id}/withdraw` | 200; status WITHDRAWN; one event with owner actor and trimmed reason; saved detail/history returned |
| AC-16 / TEST-16 | API/DB, `tests/requests.test.mjs` | SUBMITTED request; omitted, whitespace-only, 501-code-point, 1-code-point and 500-code-point reasons | Owner attempts each case on isolated requests | Invalid inputs return 422 and write nothing; 1 and 500 boundaries succeed |
| AC-17 / TEST-17 | API/DB, `tests/requests.test.mjs` | Anonymous caller, Reviewer and unrelated Requester | POST withdrawal | 401, 403 and 404 respectively; no state/history writes or disclosure |
| AC-18 / TEST-18 | API/DB, intended in `tests/requests.test.mjs` or a focused transition test | SUBMITTED request and concurrent owner withdrawal plus assigned Reviewer decision | Submit both transitions concurrently, then retry loser | Exactly one 200 transition; loser/retry gets 409; one terminal event matches stored status |
| AC-19 / TEST-19 | Browser, `tests/request-ui.test.mjs` | Signed-in owner with submitted request | Withdraw with valid reason, reload, then open as assigned Reviewer | Owner and Reviewer see WITHDRAWN and saved reason; controls disappear; persisted history contains one withdrawal event |
| AC-20 / TEST-20 | API/DB and migration | Existing Sprint 1 request/history before migration | Apply forward migration, read existing records and attempt a WITHDRAWN write | Existing data remains intact; valid new state/event is accepted; invalid reason or duplicate terminal event is rejected |

## Pair review and revision history

| Revision | Date | Change | Author | Reviewer and feedback |
|---|---|---|---|---|
| 0.1-draft | 25 Nov 2026 | Previous proposal to raise the minimum rejection reason length; superseded after the instructor's Spec Sheet Change announcement | Ashira | Superseded |
| 0.2-draft | 25 Nov 2026 | Proposed requester withdrawal, cross-layer impact, migration and new AC/STS. No TA approval required under the announcement. | Ashira (draft) | Thira pair review pending |

The current Sprint 1 contract remains v0.6 until the pair agrees and the versioned change is accepted into the Lab 7 branch. No implementation or test result is claimed by this contract.
