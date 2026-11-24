# ClassPulse: Workflow testing checklist

For ClassPulse A/B, testing EN-037_P5's Workflow and Approval System. Updated 24 November 2026, Asia/Bangkok. Use this handoff for the next session. It contains instructions and blank forms, not new execution results or acceptance.

## What to do next

1. Confirm the current release below and record your actual tester, browser and start time.
2. Independently retest WF-BUG-001 using the two exact byte-boundary requests below.
3. Return the actual retest result and evidence, then finish or explicitly disposition the remaining agreed additional coverage.
4. Keep original-release results separate. Decide final acceptance only after the agreed scope and findings are accounted for.

Original UAT-01–06 already have reported original-release behavior observations, with documented qualifications. Do not relabel them as runs on this corrected release. Rerun affected or additionally agreed cases as separate records; this checklist does not demand an automatic repeat of all completed cases.

## Release to confirm before execution

| Field | Product Team verified release record |
|---|---|
| Release ID | WF-FIX-001 |
| App URL | https://scd928edd-4d7hbszvwq-as.a.run.app/login |
| Full source commit | ad2cbef67decf9953219694898327dea0bb66034 |
| Visible footer marker | ad2cbef67dec |
| Serving revision | scd928edd-00008-9zd |
| Image digest | sha256:26459db1d0278afcac49ec298c2c7d0523c7fc6eef75eeb40e7f18561e34ca43 |
| Traffic | 100% to scd928edd-00008-9zd |
| Cloud readback | 24 November 2026, 22:37:40–46 Asia/Bangkok |
| Browser marker readback | 24 November 2026, 22:38:00.626 Asia/Bangkok |

The dates identify the supplied verification, not your test time. Observe the footer at your session start and compare it with this record. If it differs, or a deployment/traffic change is reported, stop the affected execution and request a refreshed full serving record. Do not infer a new source/revision mapping from a footer alone. [Full release evidence](../workflow/WF-BUG-001/CORRECTED-RELEASE-WF-FIX-001.md).

## Before starting

- [ ] Record actual tester/operator, team, run ID, date/time/timezone and browser/version. Record unavailable browser metadata as unavailable.
- [ ] Confirm the release marker and reference the full source/revision/digest/traffic record.
- [ ] Record case allocation and the findings channel actually agreed. The previously reported allocation was A: UAT-01/04/05 and ADD-01/06; B: UAT-02/03/06 and ADD-02–05. Record real contributions rather than assuming allocation means execution.
- [ ] Use only synthetic accounts. Obtain passwords privately; keep them out of reports, GitHub, screenshots and console exports.
- [ ] For authenticated cases verify the role after sign-in. requester1 is assigned to reviewer1; requester2 is assigned to reviewer2. Use the appropriate pair.
- [ ] Record the actual isolation/logout method. Use an isolated session or explicit logout, verified signed-out state and fresh login as agreed. Earlier same-tab role-logouts were accepted for the recorded amount/access observations, not as proof of private contexts or old-cookie rejection.
- [ ] Agree any controlled fixtures, expiry/replay, restart, new-instance or forced-rollback setup before attempting those branches. A new browser tab is not an application restart.
- [ ] Preserve all original A/B synthetic records. Use fresh records for new successful terminal decisions. [Retention registry](../partner-reviews/RETAINED-REQUESTS.json).

## Required next retest: WF-BUG-001

This retest needs no password or database fixture. Start signed out at the Workflow origin. Record the current marker and release record first. Send one request at each size, with Content-Type application/json and the normal same-origin Origin context. Do not use real credentials in either body.

| Retest row | Exact construction | Expected result |
|---|---|---|
| WF-BUG-001/control | JSON.stringify({unexpected: 'x'.repeat(102383)}) — exactly 102400 UTF-8 bytes | HTTP 422, error.code VALIDATION_ERROR |
| WF-BUG-001/oversized | JSON.stringify({unexpected: 'x'.repeat(102384)}) — exactly 102401 UTF-8 bytes | HTTP 413, error.code PAYLOAD_TOO_LARGE, message Request body is too large |

Both requests POST to /api/session. These intentionally invalid inputs must not create a successful login. Record actual byte counts, status and sanitized JSON for each request separately. Keep the original 500 failure unchanged and add this corrected-release retest beside it.

The [bounded Node regression script](../workflow/WF-BUG-001/oversized-login.test.mjs) sends exactly these two requests. With Node 22, from a checkout containing this handoff:

```sh
node --test docs/labs/lab-06/workflow/WF-BUG-001/oversized-login.test.mjs
```

The script targets the Workflow URL above. Confirm the footer/release before running it and retain its real output/exit status with your run metadata. A Product Team developer-check output is not your independent execution result. If either request differs from expectation, preserve the response and report the finding; do not mark the sibling request or whole retest PASS in advance.

## Test files and remaining scope

| File | Use |
|---|---|
| [Original six cases, browser-readable](WORKFLOW-UAT-CASES.md) | Full steps and expectations for UAT-01–06, with the accepted setup/display clarifications |
| [Original Word test sheet](lab06-uat-cases-en037-aligned.docx) | Original handoff preserved unchanged; its old release values are superseded by this release record |
| [Agreed additional cases A2](WORKFLOW-ADDITIONAL-CASES-A2.md) | Authentication, exact text/reason boundaries, competing decisions, backend access, keyboard/mobile and separately controlled durability |
| [Remaining-work inventory](REMAINING-TESTS.md) | What is already observed and which subcases remain incomplete, unrun or setup-dependent |
| [Blank execution rows](EXECUTION-RESULTS-TEMPLATE.csv) | Record one actual outcome per subcase and separate rows for reruns |
| [Finding and acceptance forms](FINDING-AND-ACCEPTANCE-TEMPLATES.md) | Report reproducible findings and your later independent acceptance decision |

For exact title boundaries, omit the normal UAT prefix and put the run marker in a valid purpose/evidence record. Purpose-boundary tests keep the marker in the title. Count Unicode code points with Array.from(value).length. 1000000.00 THB is an acceptable maximum display; the comma in the original example is presentation only.

## Return to EN-037_P5

- [ ] Actual WF-BUG-001 retest rows, real output/evidence and source/revision identifiers.
- [ ] Completed additional subcase rows, including a completed APPROVE-501 outcome and any newly executed API probes. Keep blocked/unrun rows explicit.
- [ ] Request IDs, before/after state/history readbacks and sanitized evidence for each relevant denial or decision.
- [ ] Every finding with reproduction, expected/actual, impact and evidence; preserve original failures separately from retests.
- [ ] Actual participant/review records and any remaining setup/coverage limits.
- [ ] Final acceptance form only when your team has assessed the agreed scope and outstanding findings. No acceptance is prefilled here.

Keep test data for grading and retesting. Do not reset/delete records, change assignments/roles, provision accounts, alter clocks or operate cloud/database infrastructure under this handoff. Controlled setup is separately agreed and operated by the Product Team. Log out when finished.
