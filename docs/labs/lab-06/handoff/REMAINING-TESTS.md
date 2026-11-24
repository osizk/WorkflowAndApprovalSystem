# Workflow inventory and remaining testing

Checkpoint: after WF-FIX-001 deployment, 24 November 2026. This is a Product Team inventory from received evidence. It does not fill your new test results or sign your acceptance. [Start here](TESTER-START-HERE.md).

## Priority for the corrected release

- [x] ClassPulse A independently completed WF-BUG-001/control (102400 bytes -> 422 VALIDATION_ERROR).
- [x] ClassPulse A independently completed WF-BUG-001/oversized (102401 bytes -> 413 PAYLOAD_TOO_LARGE).
- [x] Received and verified WF-FIX-001 full version, actual run metadata/responses and original failure. See [closed finding disposition](../workflow/WF-BUG-001/INDEPENDENT-RETEST-DISPOSITION.md).
- [ ] Complete or explicitly disposition remaining agreed additional coverage below.
- [ ] Agree affected regression/repeat scope for the new release and keep every new run separate from original-release observations.
- [x] Scoped WF-BUG-001 finding disposition: fixed and independently verified, closed as completed.
- [ ] Return the later whole-product acceptance decision when the remaining agreed scope supports it.

## Original six-case evidence already received

| Case | Supplied original-release observations | Preserved qualification |
|---|---|---|
| UAT-01 | A: submit, assigned approval and requester readback | Setup variation accepted; not a corrected-release run |
| UAT-02 | B: amount rejects, minimum/maximum saved and reopened | Same-tab logout setup accepted for scoped observations; ungrouped maximum display accepted; API statuses not inferred |
| UAT-03 | B: unrelated requester/reviewer list/detail restrictions and original-owner readback | Scoped UI evidence; backend additions remain separate |
| UAT-04 | A: signed-out redirect, fresh login, same saved state/history and absent terminal controls | Logout/closed-tab/replacement-tab setup accepted; optional restart NOT RUN |
| UAT-05 | A: blank-reason denial, unchanged readback, valid rejection and requester retrieval | UI-only error does not establish HTTP status |
| UAT-06 | Later B probe at 21:57:46.326: 403/FORBIDDEN and unchanged before/after 200 readbacks | Original-release provenance corroborated; screenshot identity object collapsed and fresh marker absent; no repeat needed solely for those capture qualifications |

Read [A's setup disposition](../partner-reviews/A3-SETUP-DISPOSITION.md) and [B's detailed disposition](../partner-reviews/B-V2-DISPOSITION.md). Historical A3 correction-state paragraphs are superseded by the [current corrected release](../workflow/WF-BUG-001/CORRECTED-RELEASE-WF-FIX-001.md).

## Additional A2 inventory

| Case | Evidence in the received checkpoint | Next action |
|---|---|---|
| PARTNER-ADD-01 | No completed full independent case established by the reviewed A/B package | Supply actual generic-login, identity/reload/logout, protected signed-out and masked cookie-attribute results; retain controlled expiry/replay setup limits |
| PARTNER-ADD-02 | B supplied supplemental UI title/purpose/trim/Unicode observations | Complete API-only 02e/02f and any required unmeasured API expectations; map each subcase to its actual evidence |
| PARTNER-ADD-03 | B supplied rejection-reason UI boundaries and requester readbacks | APPROVE-501 immediate capture was incomplete; rerun with completed response and unchanged readback. Do not infer unmeasured 422 statuses. Retain exploratory padded-storage scope |
| PARTNER-ADD-04 | Competing/repeated-decision API probes NOT RUN in reviewed package | Execute the agreed bounded calls after preserving UAT-04 comparison, or record blocker/disposition |
| PARTNER-ADD-05 | Backend role/assignment/PUT probes NOT RUN in reviewed package | Execute actual backend checks and unchanged readbacks; record actual unsupported-PUT status without inventing a contract promise |
| PARTNER-ADD-06 | Keyboard/mobile and separately controlled durability not established as complete | Record keyboard/mobile evidence; arrange restart/new-instance scope/evidence separately or retain an explicit blocker/limit |

Controlled reviewer-mapping, self-assignment, transaction rollback, exact session expiry/replay and durability assertions need their separately agreed methods or explicit residual-limit dispositions. Final acceptance must account for the agreed scope; do not convert an unavailable setup into PASS.

## Records to keep

A's shared UAT-01/04 request: e1cc8f10-ccb4-49b1-a391-3d44fd4e3f67. A's rejection request: b1f4b385-04b4-4e7a-905f-7f9091e65db2. Keep B's minimum/maximum/access/UAT-06/reason-boundary data and the other referenced synthetic records. [Full retention registry](../partner-reviews/RETAINED-REQUESTS.json).

Use fresh data for new successful terminal decisions. Original terminal-repeat checks are bounded negative probes permitted by the agreed additional scope after dependency readback. Stop/report unexpected writes; do not undo them. No cleanup/reset is requested.

## What is separate from your Workflow tests

ClassPulse CD-07 third-respondent and CD-01 inactive-account provisioning are ClassPulse-owned setup for EN037's tests of ClassPulse. Their readiness does not establish completion of any Workflow test. Keep those two products and their acceptance decisions separate.
