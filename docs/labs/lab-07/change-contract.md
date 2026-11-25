# Lab 7 change contract — proposed, pending approval

**Issue:** [#70 — Change the minimum rejection reason length](https://github.com/osizk/WorkflowAndApprovalSystem/issues/70)  
**Status:** Proposed. Do not implement the production behavior until the TA or instructor approves this precise change.  
**Contract revision:** 0.1-draft  
**Affected feature:** F-03 — Decide and retrieve history

## Change request

The accepted Sprint 1 contract requires a nonblank rejection reason of 1–500 Unicode code points after trimming. Lab 7 proposes changing the rejection minimum to 10 code points after trimming while keeping the 500-code-point maximum. The purpose is to give Requesters more context for the decision. Text quality is outside scope.

### Approval record

| Approver | Date and time ICT | Approval message or reference | Status |
|---|---|---|---|
| TA or instructor | Pending | Pending | Not approved |

The TA's confirmation that Lab 6 and Lab 7 may proceed in parallel does not approve this behavior change.

## Existing and proposed behavior

| Case | Sprint 1 behavior | Proposed Lab 7 behavior |
|---|---|---|
| Reject with omitted or whitespace-only reason | Validation error; no status/history write | Same |
| Reject with 1–9 code points after trimming | Accepted | HTTP 422 field error on `reason`; no status/history write |
| Reject with exactly 10 code points after trimming | Accepted | Accepted |
| Reject with 11–500 code points after trimming | Accepted | Accepted |
| Reject with more than 500 code points | HTTP 422; no status/history write | Same |
| Approve with no reason | Accepted; stored reason is null | Same |
| Approve with 1–500 code points | Accepted | Same |
| Approve with more than 500 code points | HTTP 422; no write | Same |
| Read historical rejection reason shorter than 10 | Returned as stored | Returned unchanged |

Count Unicode code points after trimming, following the existing contract convention. Do not count UTF-16 code units.

## Scope and exclusions

- Change only the minimum reason length for a Reject decision.
- Preserve authentication, assigned-reviewer authorization, requester denial, ownership/data isolation, status-transition guards, one-event history writes, transaction rollback, conflict responses and existing list/detail behavior.
- Apply the new limit when creating a rejection event. Do not rewrite or hide existing history.
- No schema or migration change is expected. Confirm during impact review.
- F-04 Return/revise has a separate contract. This rule applies only to Reject unless an approved contract changes scope.

## Impact analysis

| Requirement or layer | Existing contract location | Impact and planned evidence |
|---|---|---|
| Business rule | SRS BR-05 and delegated decision D-04 | Version BR-05 to say 10–500 trimmed code points for Reject, with approval still optional. Record approval and rationale. |
| Feature/API | F-03, FR-05/06, Sprint 1 contract v0.6 | Update reason validation and HTTP 422 field error. Preserve success shape and decision transaction. Check callers of POST `/api/requests/{id}/decision`. |
| AC and STS | AC-10/11, TEST-10/11 | Keep IDs. Extend AC-11/TEST-11 with rejected 9 and accepted 10 code-point cases and no-write assertions. |
| User interface | F-03 `/reviews/:id` | State the minimum near Reason. Associate accessible validation feedback with the field and retain focus/input after error. Test 9 is blocked without POST, 10 submits. |
| Authorization/state | FR-04–06, BR-02/06–08, AC-09/12/13 | No policy change. Regress assigned/unrelated reviewers, requester denial, terminal/repeated/concurrent decisions and rollback after event failure. |
| Persistence/history | F-03 data, NFR-01, AC-10/11/14 | Reuse nullable `reason` and existing transaction. No migration/backfill. Read a documented short-reason historical fixture. |
| Sprint 2 integration | F-04 Return/revise/resubmit | Keep validation specific to Reject. Rerun Return/resubmit after integration because files and screens may overlap. |

## Proposed AC/STS extension

These become approved contract content only after TA/instructor approval and pair review.

| ID | Level and intended test | Preconditions and input | Action | Expected result |
|---|---|---|---|---|
| AC-11 / TEST-11 API boundary | API/DB, `tests/decisions.test.mjs` | Assigned Reviewer, submitted request, reason of 9 code points after trim | POST Reject | 422 reason field error; request stays SUBMITTED; history unchanged |
| AC-11 / TEST-11 lower boundary | API/DB, `tests/decisions.test.mjs` | Separate submitted request, exactly 10 code points after trim | POST Reject | 200; REJECTED; exactly one durable event with trimmed reason |
| AC-11 / TEST-11 whitespace/maximum | API/DB, `tests/decisions.test.mjs` | Omitted, whitespace-only, 500 and 501 code-point reasons on separate requests | POST Reject | Omitted/whitespace/501 rejected with no writes; 500 accepted with one event |
| AC-11 / TEST-11 unchanged approval | API/DB, `tests/decisions.test.mjs` | Approve without reason and with a valid short reason | POST Approve | Both follow existing behavior; omitted reason is null |
| AC-11 / TEST-11 UI feedback | Browser, `tests/review-ui.test.mjs` | Assigned Reviewer at submitted detail | Enter 9 then 10 on separate requests | 9 yields accessible error and no write; 10 succeeds and appears trimmed in history |
| AC-11 / TEST-11 historical read | API/DB or browser, test name TBD | Existing rejected record with short saved reason | Read authorized detail/history | Existing status and reason returned unchanged |
| AC-09 / TEST-09 authorization regression | API/DB, `tests/decisions.test.mjs` | Unrelated Reviewer and Requester attempt decision | POST Reject | Existing 404/403 behavior remains; no disclosure or write |

## Pair review and revision history

| Revision | Date | Change | Author | Reviewer/feedback |
|---|---|---|---|---|
| 0.1-draft | 25 Nov 2026 | Proposed minimum, impact table and AC/STS before production implementation | Ashira (draft) | Thira review pending |
| Approval | Pending | Record TA/instructor decision on the specific 10–500 Reject rule | Pending | Pending |

The current Sprint 1 contract remains v0.6 and describes the implemented 1–500 rule. Keep that released wording intact until an approved, versioned revision is recorded.
