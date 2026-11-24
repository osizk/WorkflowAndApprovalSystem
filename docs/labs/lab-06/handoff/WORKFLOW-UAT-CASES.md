# Workflow original UAT-01–06

Browser-readable companion to the unchanged original Word handoff. Apply the [current release/setup checklist](TESTER-START-HERE.md) before any new execution. The same case IDs and core expectations are retained; the accepted amount-display and session-setup clarifications are identified below. Do not transfer old outcomes to a new release without actual execution.

Reference: [Sprint 1 contract v0.6 at corrected source](https://github.com/osizk/WorkflowAndApprovalSystem/blob/ad2cbef67decf9953219694898327dea0bb66034/docs/sprints/sprint-1/contracts.md). Normal titles use UAT-<case>-<initials>-<HHmmss> plus a description. Passwords are shared privately.

## UAT-01: submit and approve

Refs F-01/F-02/F-03, FR-01–06, AC-01/03/04/09/10. Roles requester1 and reviewer1. Use fresh data.

1. Sign in as requester1. Open Create request. Enter a unique prefixed title ending Desk supplies, purpose Purchase stationery for the team, amount 125.50. Submit.
2. Record the saved ID/detail URL. Expect 125.50 THB, SUBMITTED and exactly one SUBMITTED history entry.
3. Sign out and confirm the login page. Sign in as reviewer1. Open that exact ID from the Review queue and approve with Reason blank.
4. Expect APPROVED and exactly SUBMITTED then APPROVED. Sign out, sign in as requester1 and reopen the same ID; amount/status/history must match. Retain the ID for UAT-04. Where API reason data is observed, omitted approval reason is null.

Evidence: saved submission, reviewer decision, requester readback, actual times/release and shared request ID. Do UAT-04 before any terminal-repeat probe on this comparison record.

## UAT-02: amount boundaries

Refs F-02, FR-02/03, AC-04/05. Role requester1. Valid purpose: Purchase a synthetic test item. Keep unrelated fields valid; use unique titles to distinguish attempts.

1. Try 0.00 and 0.001 separately. Expect an Amount error and form retained; My requests must contain no saved record for each invalid attempt's title.
2. Submit 0.01. Expect saved 0.01 THB, SUBMITTED and one initial event. Reopen it from My requests and retain the ID.
3. On fresh data submit 1000000.00. Expect that exact numeric maximum, two decimal places, SUBMITTED and one initial event. The accepted display clarification permits 1000000.00 THB without a thousands separator.
4. On fresh data try 1000000.01. Expect Amount validation and no saved record for its title. Record all inputs/actual outcomes separately; do not infer backend status codes solely from UI errors.

## UAT-03: account-scoped access

Refs F-02/F-03, FR-03–06, BR-01/02, AC-07/09. Roles requester1, requester2, reviewer2.

1. As requester1 create fresh Access isolation data, purpose Synthetic access check for a purchase, amount 89.00. Retain ID, /requests/<id>, SUBMITTED and one initial event.
2. Sign out; sign in as requester2. The record must be absent from My requests. Open the retained /requests/<id>. Expect Request not found. with no details/history.
3. Sign out; sign in as reviewer2. The record must be absent from its queue. Open /reviews/<id>. Expect Request not found. with no details/history/decision controls.
4. Sign back in as requester1. Reopen the ID and compare amount, status and single history entry against the baseline.

Preserve denied views and the unchanged authorized readback. Record the actual account-switch/logout method; the earlier accepted same-tab variation does not establish private-window or old-cookie properties.

## UAT-04: retrieve saved status/history across sessions

Refs F-01/F-03, FR-01/05/06, BR-06–08, NFR-01, AC-03/10 and the session-retrieval part of AC-14. Use UAT-01's exact APPROVED request ID and original evidence.

1. Sign out and close the prior tab/window. Open an isolated fresh session, or use the accepted logout/closed-tab/replacement-tab variation. Before login visit the retained Requester URL. Expect login redirect with no request data. Preserve that signed-out observation.
2. Sign in as requester1. Retrieve the same ID. Expect 125.50 THB, APPROVED and the same two original events/timestamps.
3. Switch to reviewer1, open the same ID and reload. Expect the same saved state/history, with no Approve or Reject controls.
4. Optional durability operation is separate. Agree an actual same-release application restart or separately scoped new-instance retrieval before execution. Retain operator/resource/time and proof of which process/instance handled readback. Without that setup/evidence, record the durability assertion as NOT RUN/BLOCKED; browser-session retrieval does not establish it.

The original Word step referring to a new Cloud Run instance does not itself prove an actual process restart. Apply the separate restart/new-instance scope agreed in additional case 06.

## UAT-05: rejection reason

Refs F-03, FR-05/06, BR-05/06, AC-10/11. Roles requester1/reviewer1. Fresh request: prefixed Reject reason title, purpose Synthetic request to verify rejection reason, amount 300.00.

1. As requester1 submit and record the ID/baseline. Sign out; sign in as reviewer1 and open that ID.
2. Reject with Reason blank. Expect A rejection reason is required. Reload; expect SUBMITTED and exactly the original initial event.
3. Enter Budget unavailable for this purchase and reject. Expect REJECTED, the exact reason and SUBMITTED then REJECTED.
4. Sign out; sign in as requester1 and retrieve the same ID. Status/reason/history count must match. Keep this separate from UAT-01's approved record.

UI-only error evidence does not establish an HTTP 422 measurement.

## UAT-06: requester cannot decide

Refs F-03, FR-04, BR-02, AC-09. Sign in as requester1 on a fresh owned SUBMITTED request; record its ID, amount and one initial event.

1. In a supported same-origin browser Console, GET /api/session. Expect 200 and role REQUESTER before proceeding. Retain sanitized id/role; no cookies or credentials.
2. GET /api/requests/<actual-id>. Expect 200 and the recorded SUBMITTED baseline. Stop if identity/state differs.
3. POST /api/requests/<actual-id>/decision with JSON {"decision":"APPROVE"}, Content-Type application/json and the normal browser origin/session context.
4. Expect HTTP 403 with error.code FORBIDDEN. GET the same detail again; expect 200, unchanged amount, SUBMITTED and the same single original event. Record actual execution time, not createdAt.

Capture current release marker, identity metadata, actual response and before/after readbacks where available. B's earlier screenshot has a qualified original-release disposition; it is not a result on WF-FIX-001. If a decision unexpectedly succeeds, preserve the changed state and report it; do not undo or repeat the successful decision.

## Record results

Use the [blank execution template](EXECUTION-RESULTS-TEMPLATE.csv), adding rows for real reruns. Record expected and actual separately. Select PASS/FAIL/BLOCKED/NOT RUN only from real observations; include the blocker where applicable. Keep each measured sibling subcase distinct. Use the [finding/acceptance templates](FINDING-AND-ACCEPTANCE-TEMPLATES.md) for reporting and your later decision.
