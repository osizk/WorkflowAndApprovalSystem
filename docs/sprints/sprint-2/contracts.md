# Sprint 2 contracts

**v0.1 · 27 November 2026 · Before RED.** Records the pair's agreement on Return, Resubmit, conflicts, list defaults and ownership. The API field names, endpoint paths and detailed test design below are implementation decisions for review. No implementation or test execution is recorded here.

Baseline is remote main containing [Lab 7 PR #77](https://github.com/osizk/WorkflowAndApprovalSystem/pull/77). Preserve Lab 7 AC/TEST 15–21, FR-11 and BR-10. See the [SRS](../../srs.md), [traceability](../../traceability.md) and [work allocation](plan.md#work-packages).

## F-04 · Return, revise and resubmit

**Owner and dependencies.** Ashira owns Return and shared transition/version work (S2-01). Thira owns Resubmit (S2-02). Each reviews the other's PR. F-04 implements FR-07 and extends the submission, decision and history behavior in FR-02–06, BR-04–07, BR-09 and BR-10. Apply NFR-01, NFR-02, NFR-04 and NFR-05.

| Operation | Role and required status | Result |
| --- | --- | --- |
| Return | Assigned Reviewer, `SUBMITTED` | Transition to `RETURNED`, increment version once, and append one `RETURNED` event with the reviewer and trimmed reason. The reason must be a string of 1–500 Unicode code points after trimming. |
| Edit & Resubmit | Owner, `RETURNED` | Save validated title, purpose and amount, transition to `SUBMITTED`, increment version once, and append one `RESUBMITTED` event. Preserve the request ID, ownership, Reviewer assignment and prior history. Repeat return/resubmit cycles are allowed. |
| Approve / Reject | Assigned Reviewer, `SUBMITTED` | Require the version shown on the Reviewer's detail page. Apply the existing decision rules and append one final event. |
| Withdraw | Owner, `SUBMITTED` | Preserve Lab 7 behavior, including the reason and one terminal event. The Sprint 2 UI supplies its displayed version. For compatibility, an older client may omit the version only on the initial submission (version 1). |

`APPROVED`, `REJECTED` and `WITHDRAWN` are terminal. Authorized users can read the saved request and history. Draft saves and changes to requester or reviewer assignment are outside F-04.

### API and data

- Detail responses include a positive integer `version`. Existing and newly submitted requests start at 1. Every successful Return and Resubmit increments it by one. Approve, Reject and Withdraw keep that version and use the terminal status to guard further actions.
- `POST /api/requests/{id}/return` accepts `{ reason, version }`. `POST /api/requests/{id}/resubmit` accepts `{ title, purpose, amount, version }`. Existing `/decision` accepts `{ decision, reason?, version }` and requires `version` for both Approve and Reject. Existing `/withdraw` accepts `{ reason, version? }` with the version-1 compatibility rule above. Each successful transition returns **HTTP 200** with the saved request, status, version and history. Identity comes from the session.
- Keep the existing JSON error envelope `{ error: { code, message, fields? } }`. Return **401** for an unauthenticated call, **403** for the wrong role, and **404** for an unknown request or one outside the caller's scope. A missing required, non-integer or nonpositive version, and invalid purchase or reason fields, return **422 `VALIDATION_ERROR`** with field errors. For a valid action whose version or status is stale, return **409** with `REQUEST_CONFLICT` for Return/Resubmit, `DECISION_CONFLICT` for Approve/Reject, or `WITHDRAWAL_CONFLICT` for Withdraw. An omitted Withdraw version can match only version 1. Check role and record scope before revealing a conflict.
- Apply a forward migration from the released Lab 7 schema. Preserve saved requests and their history. Permit one initial `SUBMITTED` event and multiple `RETURNED`/`RESUBMITTED` events. `RESUBMITTED` is a history event only. Preserve at most one terminal event per request across `APPROVED`, `REJECTED` and `WITHDRAWN`.
- Match actor scope, expected version and required status in the database write itself. Commit changes to fields, status, version and one matching history event in the same transaction. If the conditional write loses a race or the event insert fails, commit no changes for that attempt.

### UI

Use the existing Requester and Reviewer detail routes. Show Return and its required reason control only to the assigned Reviewer on a submitted request. Show Edit & Resubmit only to its owner on a returned request. Prefill the form with the current fields and keep the return reason and prior history visible. Keep the Lab 7 Withdraw control for eligible submitted requests only. Show loading and submitting states, disable duplicate submission, associate validation with fields and show the saved result on success. On 409, disable the stale action, reload the current detail and require the actor to review the refreshed state before retrying. Never auto-retry a mutation. If reload fails, keep the action disabled and show a retry control for the reload.

### Acceptance criteria and software test specification

| AC / TEST | Level and owner | Action and expected result |
| --- | --- | --- |
| AC-22 / TEST-22 | API/DB · Ashira | Assigned Reviewer returns a submitted request with its current version. Expect 200, `RETURNED`, version +1, and exactly one matching event with the trimmed reason. |
| AC-23 / TEST-23 | API/DB · Ashira | Send trimmed reason lengths 1 and 500 and accept both. Send missing, whitespace-only or 501 code points and expect 422 with `fields.reason`. Include a supplementary Unicode character to distinguish code points from UTF-16 code units. Invalid cases leave data and history unchanged. |
| AC-24 / TEST-24 | API/DB · Both | Try both new endpoints while signed out, with the wrong role and with the correct role but wrong request scope. Expect 401, 403 and 404 respectively, with no writes or history events. |
| AC-25 / TEST-25 | API/DB · Ashira | Race an assigned Reviewer's Return and the owner's Withdraw from the same submitted version. Exactly one returns 200. The loser returns 409 with its endpoint's conflict code. Confirm one transition and one additional history event, matching the winning action. |
| AC-26 / TEST-26 | API/DB · Thira | Owner resubmits valid changes from `RETURNED` with the current version. Expect 200, `SUBMITTED`, version +1, the same request ID and Reviewer, all older events intact and one new `RESUBMITTED` event. Repeat the cycle and verify both pairs of history entries remain. |
| AC-27 / TEST-27 | API/DB · Thira | For Resubmit, trim title and purpose and count Unicode code points. Title accepts 3–120 inclusive (reject 2 and 121). Purchase purpose accepts 10–2,000 inclusive (reject 9 and 2,001). Amount is a decimal string in THB from `0.01` to `1000000.00` inclusive with up to two decimal places, stored exactly in satang. Reject a numeric JSON value, zero, an amount above the maximum, and extra decimal digits such as `12.345`. Return 422 `VALIDATION_ERROR` with `fields.title`, `fields.purpose` or `fields.amount` as applicable. Missing fields fail validation. On any invalid payload, all fields, status, version and history remain unchanged. |
| AC-28 / TEST-28 | API/DB · Ashira | Open a submitted request as Reviewer, return it, then resubmit as owner. With the original version try Approve and Reject. Each returns 409 `DECISION_CONFLICT` without writes or events. Omitting the decision version returns 422 with `fields.version`. Repeating with the fresh version on an eligible request succeeds. |
| AC-29 / TEST-29 | API/DB · Both | Return or resubmit from an ineligible status and retry a previously applied action. Expect 409 and no writes or events. Include a withdrawn record and verify it stays terminal with readable history. |
| AC-30 / TEST-30 | DB integration · Ashira | Upgrade a database containing preexisting Lab 7 data and verify fields/history survive with version 1. In separate cases, force the Return and Resubmit event inserts to fail and verify that state, version and fields roll back. |
| AC-31 / TEST-31 | Browser/E2E · Thira | Run Return → Edit & Resubmit → final decision across both roles and verify saved history on reload. In a separate stale-page case, verify the conflict message, required reload before another action and absence of an automatic decision. |

**Done when** the agreed contract is versioned, focused rule tests have meaningful RED/GREEN evidence, migration and Sprint 1/Lab 7 regressions pass, browser flows are verified with both roles, and both work packages are reviewed and traced to the accepted Sprint 2 release.

## F-05 · Filter My Requests and Review Queue

**Owners and dependencies.** Ashira owns the shared query and My Requests controls (S2-03). Thira owns the Review Queue controls (S2-04). F-05 implements FR-09 while preserving FR-03/04 visibility rules, NFR-02 and NFR-04. It consumes the statuses established by F-04 and Lab 7. No F-05 schema change is planned.

- Extend the existing scoped list endpoint `GET /api/requests` with an optional `status` parameter. Accept `SUBMITTED`, `RETURNED`, `APPROVED`, `REJECTED` and `WITHDRAWN`. Omit the parameter for **All statuses**. An invalid, empty or repeated parameter returns **422 `VALIDATION_ERROR`** with `fields.status`. A successful response preserves the existing list shape and order. Scope by requester ownership or assigned Reviewer on the backend before returning any result.
- On fresh entry, My Requests shows **All statuses** and Review Queue shows **Submitted**. **Clear filter** selects **All statuses** on both. Keep the selected value visible and support loading, empty results with Clear filter, and errors with retry. Verify these controls using the actual running UI as both roles before UI sign-off.

| AC / TEST | Level and owner | Action and expected result |
| --- | --- | --- |
| AC-32 / TEST-32 | API/DB · Ashira | Query each permitted status and omit the parameter as both roles. Only the matching owned or assigned requests appear, in existing order. An unrelated request never appears. Invalid, empty and repeated filters return 422 with `fields.status`. |
| AC-33 / TEST-33 | Browser/E2E · Ashira | Open My Requests. Verify All statuses, filter to Returned or Withdrawn, verify empty behavior with another status and clear back to All statuses. |
| AC-34 / TEST-34 | Browser/E2E · Thira | Open Review Queue. Verify Submitted is selected. Confirm a returned request leaves that result set, a resubmitted one reappears and a withdrawn one is visible via its filter. Clear back to All statuses and verify unrelated requests stay hidden. |

**Done when** both list views and the API match the agreed defaults and scope, the planned tests are executed, and the PRs are reviewed and integrated into the accepted Sprint 2 release.
