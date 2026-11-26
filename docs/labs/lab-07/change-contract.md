# Lab 7 change contract — proposed requester withdrawal

**Issue:** [#70 — Allow a Requester to withdraw a submitted purchase request](https://github.com/osizk/WorkflowAndApprovalSystem/issues/70)  
**Status:** Proposed for pair agreement. The 25 November instructor announcement says Lab 7 change requests do not require prior instructor or TA approval.  
**Contract revision:** 0.3-draft  
**Affected features:** F-02 Submit/retrieve and F-03 Review/history

## Baseline and pre-change reference

- **Sprint 1 release reference for the original behavior:** [7c3f8a7](https://github.com/osizk/WorkflowAndApprovalSystem/commit/7c3f8a73f424dc8d5e1f27cb6ff38db8af562a8c), the immutable release cited in the Deliverable 1 README/report. This identifies the original behavior; it does not claim independent whole-product UAT acceptance, which remains pending in the available record. The original F-02/F-03 rules and tests are in [Sprint 1 contracts](../../sprints/sprint-1/contracts.md), especially AC-04–08 / TEST-04–08 and AC-09–13 / TEST-09–13.
- **Lab 7 pre-change source SHA:** `ad2cbef67decf9953219694898327dea0bb66034`. GitHub `main` and `lab7-staging` were both at this SHA when the contract review began; it includes the Lab 6 release merged by PR #64. This is the source revision against which the test-only RED commit is based, unless a later verified branch update changes the implementation base. Record the actual RED parent SHA and commit again when tests are run.
- **RED reference:** Run the route and browser behavior tests (AC-15–19) against the unchanged implementation at `ad2cbef...` from a test-only commit; the expected failures must be assertion failures caused by the unsupported withdrawal behavior, not test setup errors. AC-20 migration/constraint assertions and AC-21 event-write rollback require the new schema/route, so record their execution during implementation verification; do not present them as baseline RED unless a meaningful pre-change assertion is specifically designed and observed. No RED run is claimed yet.

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
| Schema and migration | `RequestStatus`, `PurchaseRequest.status`, `RequestEvent.type`, terminal-event uniqueness and reason constraints | Add WITHDRAWN through a forward migration. Preserve the REJECTED reason rule. Require WITHDRAWN events to have a non-null, trimmed nonblank reason of 1–500 code points; keep APPROVED reason optional and SUBMITTED reason absent. Extend terminal-event uniqueness to APPROVED, REJECTED and WITHDRAWN. TEST-20 separately checks NULL and whitespace-only WITHDRAWN reasons are rejected, a valid reason is accepted, and a duplicate terminal event is rejected. Verify the migration on empty and existing-data databases; existing rows/history remain intact. |
| Return/resubmit integration | F-04 Sprint 2 | A withdrawn request cannot be revised or resubmitted. Verify F-04 transition guards against WITHDRAWN and coordinate shared files and migration order. |

## Proposed acceptance criteria and STS

| ID | Level and intended test | Preconditions and input | Action | Expected result |
|---|---|---|---|---|
| AC-15 / TEST-15 | API/DB, `tests/requests.test.mjs` | Owner, assigned Reviewer and SUBMITTED request; valid trimmed reason | Owner POSTs `/api/requests/{id}/withdraw` | 200; status WITHDRAWN; one event with owner actor and trimmed reason; saved detail/history returned |
| AC-16 / TEST-16 | API/DB, `tests/requests.test.mjs` | SUBMITTED request; omitted, whitespace-only, 501-code-point, 1-code-point and 500-code-point reasons | Owner attempts each case on isolated requests | Invalid inputs return 422 and write nothing; 1 and 500 boundaries succeed |
| AC-17 / TEST-17 | API/DB, `tests/requests.test.mjs` | Anonymous caller, Reviewer and unrelated Requester | POST withdrawal | 401, 403 and 404 respectively; no state/history writes or disclosure |
| AC-18 / TEST-18 | API/DB, intended in `tests/requests.test.mjs` or a focused transition test | SUBMITTED request and concurrent owner withdrawal plus assigned Reviewer decision | Submit both transitions concurrently, then retry loser | Exactly one 200 transition; loser/retry gets 409; one terminal event matches stored status |
| AC-19 / TEST-19 | Browser, `tests/request-ui.test.mjs` | Signed-in owner with submitted request | Withdraw with valid reason, reload, then open as assigned Reviewer | Owner and Reviewer see WITHDRAWN and saved reason; controls disappear; persisted history contains one withdrawal event |
| AC-20 / TEST-20 | API/DB and migration, `tests/schema.sql` or focused migration test | Existing Sprint 1 requests/history before migration | Apply the forward migration, read existing rows, and separately attempt WITHDRAWN events with NULL reason, whitespace-only reason, a valid 1–500 code-point reason, and a duplicate terminal event; also rerun the REJECTED reason constraint case | Existing data remains intact; NULL/whitespace-only and duplicate terminal events are rejected; valid WITHDRAWN reason succeeds; prior REJECTED reason constraint remains enforced |

## Preserved-behavior regression mapping

| Existing check | Behavior retained and required regression |
|---|---|
| AC-07 / TEST-07 | Requester list/detail ownership isolation remains unchanged after adding the withdrawal route. |
| AC-09 / TEST-09 | Assigned Reviewer scope, out-of-scope denial and Requester decision denial remain unchanged; add Reviewer-withdrawal denial under AC-17 / TEST-17. |
| AC-10 / TEST-10 | Approval without a reason and rejection with a valid reason still persist exactly one matching event. |
| AC-11 / TEST-11 | Existing rejection-reason validation and the 500-code-point boundary remain unchanged after adding the WITHDRAWN reason constraint. |
| AC-12 / TEST-12 | Concurrent/repeated approval or rejection still permits only one terminal transition/event; AC-18 / TEST-18 adds the withdrawal race. |
| AC-13 / TEST-13 | Existing decision event-write failure still rolls back. **AC-21 / TEST-21** additionally injects a withdrawal event-write failure and verifies the request remains SUBMITTED with its original history and no WITHDRAWN event. |

### AC-21 / TEST-21 — withdrawal event-write rollback

| Level and intended test | Preconditions and input | Action | Expected result |
|---|---|---|---|
| API/DB, `tests/requests.test.mjs` | Owner and SUBMITTED request; force the WITHDRAWN event insert to fail after the conditional status update | Owner POSTs a valid withdrawal reason | Transaction rolls back: status remains SUBMITTED and no new history event is stored |

## Pair review and revision history

| Revision | Date | Change | Author | Reviewer and feedback |
|---|---|---|---|---|
| 0.1-draft | 25 Nov 2026 | Previous proposal to raise the minimum rejection reason length; superseded after the instructor's Spec Sheet Change announcement | Ashira | Superseded |
| 0.2-draft | 25 Nov 2026 | Proposed requester withdrawal, cross-layer impact, migration and new AC/STS. No TA approval required under the announcement. | Ashira (draft) | Thira pair review pending |
| 0.3-draft | 25 Nov 2026 | Addressed Kane's technical review and baseline/scoping re-review: clarified the Sprint 1 release reference and pending UAT acceptance, retained the pinned pre-change SHA, specified withdrawal reason database invariants and TEST-20 cases, and mapped regressions plus withdrawal rollback. | Pex | Re-review requested |

The current Sprint 1 contract remains v0.6 until the pair agrees and the versioned change is accepted into the Lab 7 branch. No implementation or test result is claimed by this contract.
