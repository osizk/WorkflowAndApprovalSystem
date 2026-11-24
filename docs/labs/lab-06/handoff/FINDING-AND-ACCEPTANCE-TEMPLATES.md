# Blank tester records

For ClassPulse's independent testing of Workflow. Copy a form per real report/run. Blank fields are intentionally not completed. Record the actual tester/operator and contribution attribution in your required declaration; do not infer participation from allocation. [Start here](TESTER-START-HERE.md).

## Session record

| Field | Actual entry |
|---|---|
| Run ID and date/time/timezone | |
| Actual testers/operators and student IDs | |
| Browser/version/viewport and isolation method | |
| App URL and release ID | |
| Full source commit, visible marker and serving revision | |
| Image digest, traffic, mapping verifier/time and source | |
| Marker observed at session start / evidence | |
| Actual case allocation and shared request dependencies | |
| Actual findings channel and session agreement | |
| Setup deviations, unavailable tooling/fixtures and agreed disposition | |

## Execution/retest record

| Field | Actual entry |
|---|---|
| Case/subcase ID and requirement/AC | |
| Run ID; initial run or retest; related finding | |
| Actual tester/operator, time and release identifiers | |
| Preconditions, verified role and retained baseline | |
| Exact inputs and actual request ID(s) | |
| Expected behavior | |
| Steps actually performed | |
| Actual response/UI result and state/history readback | |
| PASS / FAIL / BLOCKED / NOT RUN with reason | |
| Sanitized evidence IDs/paths | |
| Limits/deviations, next action and actual reviewer if performed | |

Use separate rows for measured sibling inputs and for reruns. The [CSV template](EXECUTION-RESULTS-TEMPLATE.csv) supplies common rows; add others for actual work. Store original failures and later retests separately.

## Defect report

| Field | Actual entry |
|---|---|
| Finding ID/title and related case/subcase | |
| Reporter/team and actual date/time/timezone | |
| URL, release ID, full commit, marker, revision and mapping evidence | |
| Requirement/AC or explicitly qualified expected-behavior basis | |
| Preconditions, role, synthetic data and setup | |
| Minimal repeatable steps and exact inputs | |
| Expected result | |
| Actual result, HTTP/code or UI observation | |
| Before/after saved state and affected request IDs | |
| Proposed severity, demonstrated user impact and limits | |
| Sanitized evidence and issue link | |
| Product Team triage/disposition when actually received | |
| Corrected release and independent retest when actually performed | |

Send findings through the actual agreed channel as discovered. Never include passwords, raw session cookies, tokens or connection strings. Preserve unexpected results without attempting a reset/undo.

## Independent acceptance record

Complete only after your team assesses the agreed scope and retests. A developer-check PASS or one corrected bug retest does not automatically decide the whole product.

| Field | Actual entry |
|---|---|
| UAT team, actual participants/reviewers and date/time/timezone | |
| Tested URL, exact release ID/full commit/revision/digest | |
| Agreed scope/inventory revision and result/evidence index | |
| Findings and each triage/correction/retest disposition | |
| Remaining failed/blocked/unrun subcases and their agreed treatment | |
| Specific minor limitations explicitly accepted by your team | |
| Decision: Accepted / Accepted with minor limitations / Not Accepted | |
| Reasons supporting the decision and any conditions | |
| Actual approval/acknowledgement evidence | |

Leave the decision blank until actually made. Retain unresolved required scope and any critical/major findings consistently with the decision. Keep a decision for Workflow separate from EN037's decision for ClassPulse.
