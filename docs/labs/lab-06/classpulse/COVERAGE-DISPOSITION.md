# ClassPulse Lab 6 coverage disposition

**EN-037 · Tester D · 25 November 2026, Asia/Bangkok.** Review copy for Ashira (C) and ClassPulse (A/B). This covers independent testing of ClassPulse Sprint 1 identified surveys. No genuine ClassPulse defect was established in the observed scope. Independent live expiry and final acceptance remain open. ClassPulse has confirmed the two R2 paths and the exact-command TEST-05 record within their stated scopes.

## Version and evidence basis

| Record | Scope and provenance |
|---|---|
| CP-V01 | Source `1fe3e3b82dfb0537be30223c9b598b3479b4affe`, Cloud Run revision `classpulse-00006-6w6`, 100% traffic per ClassPulse A's last mapping on 25 November at 00:36:54 Bangkok. This report uses that historical mapping. |
| R1 | `UAT6-20261124-CodexD-R1`, 24 November, 17:31–17:40 and 17:57–18:03, with the CD-08 follow-up at 20:45:30. The accumulated log has 95 observation records. The original and additional case counts are listed below. [R1 report and accumulated log](R1/CONTINUATION-REPORT.md) · [Raw observations](R1/continuation-results.json) |
| R2 | `UAT6-20261125-CodexD-R2`, 25 November, 17:49:22–17:52:43. Live origin and asset path observed. Release mapping supplied by ClassPulse. Test-start notice delivery was unverified. ClassPulse reviewed the already-shared `fixture-case-results.json` and `CD07-summary.png` and accepted the two scoped results below. |
| Operator | Codex under Thira (D) operated the recorded R1/R2 runs. The exact-command local record names Codex GPT-6.2 Sol under D. Ashira's review of this disposition remains pending. |

## Original UAT, 12 cases

ClassPulse A acknowledged passing observations for all 12 behaviors. A accepted API-created fixture setup for UAT-08, UAT-10 and UAT-11 with the method recorded. The results below retain those setup variations.

| Case | Disposition and actual observation |
|---|---|
| UAT-01 | **PASS.** An eligible respondent submitted 4/Online to survey 6. Response 3 was readable and the owner saw count 1 and average 4.00. |
| UAT-02 | **PASS.** Untouched blank title showed inline validation and left the inventory unchanged. Missing answers and out-of-range, fractional and string ratings were rejected with count 0. Valid endpoint ratings 1 and 5 saved on survey 23 and gave count 2 and average 3.00. |
| UAT-03 | **PASS.** Respondent requests for owner detail and summary returned 403. Owner B received 404 for detail, summary and close. Owner A read back the unchanged state. |
| UAT-04 | **PASS.** Duplicate submission returned 409. The original response retained its values and count 1. |
| UAT-05 | **PASS.** Owner A closed survey 6 from the UI. It disappeared from the eligible respondent's list, detail returned 404 and a late submission returned 409. Response 3 and the aggregate were preserved. |
| UAT-06 | **PASS.** The CPE231-only respondent could neither list nor view the CPE334 survey. Submission returned 403 `NOT_ELIGIBLE`. The count stayed at 1. |
| UAT-07 | **PASS.** The UI showed invalid-login feedback. Owner identity and landing page survived reload, then logout redirected to sign-in and identity returned 401. Respondent sign-in and role were observed elsewhere in R1/R2. A dedicated reload for every role was outside the recorded sequence. |
| UAT-08 | **PASS with fixture variation.** Survey 7 showed count 0, the empty summary message, an em dash for the unrated average, zero buckets and no respondent identities. |
| UAT-09 | **PASS.** Individual response readback was denied for the owner with 403 and another respondent with 404. Authenticated respondent PUT and DELETE gave 404. The saved answer stayed the same when reloaded. |
| UAT-10 | **PASS with fixture variation.** Draft survey 22 was hidden from respondents, detail returned 404 and submission returned 409. Legal publishing succeeded. Invalid transitions returned 409 and preserved the state. |
| UAT-11 | **PASS with fixture variation.** Survey 24 responses 11 and 12 produced count 2, averages 4.50 and 1.00 and the expected choice counts. The first response omitted the optional answer. Summary reload was consistent and exposed only aggregates. |
| UAT-12 | **PASS.** Owned-course and survey lists respected scope. Foreign-course creation with valid and blank titles and foreign-owner publishing returned 404. The owner readback was unchanged. |

The first UAT-02 form-fill attempt left a populated title in the control. The successful create in that attempt used the populated value. The untouched-field repeat supplied the valid blank-title observation.

## Additional cases and branches

| Case or branch | Disposition and actual evidence |
|---|---|
| CD-01 invalid sign-in | **PASS for observed paths.** Eight requests exercised wrong credentials, the designated unknown account value, malformed bodies and unsupported content type. The requests returned the expected 401 or 400, and identity returned 401 after each. The designated unknown account was checked through the public sign-in response only. R1. |
| CD-01 inactive sign-in | **PASS.** The stored credential verified by ClassPulse produced generic 401 `INVALID_CREDENTIALS`; identity returned 401 before and after. R2 JSON accepted by ClassPulse. |
| CD-01 isolated expiry | **Supporting automated PASS.** On pinned CP-V01 source, `npm test -- tests/api/auth.test.ts` ran the full file in an isolated local PostgreSQL instance on 25 November, 20:30:14–20:30:18. Total 8 passed, 0 failed, 0 skipped, exit 0. TEST-05 asserted identity 200 before fixture expiry and 401 `UNAUTHENTICATED` afterward. Serving revision N/A. [Exact-command report and run evidence](https://github.com/osizk/WorkflowAndApprovalSystem/blob/04e4906e200bf3567154854aad7e202beab6e15d/docs/labs/lab-06/classpulse/CP-V01-TEST-05/exact-command/REPORT.md) |
| CD-01 independent live expiry | **OPEN.** No observed passage through the deployed eight-hour TTL. The local assertion sets fixture expiry in the past. ClassPulse accepted it as supporting evidence and kept the live branch open. |
| CD-01 server-side post-logout invalidation and session controls | **Partial.** Normal UI logout and subsequent identity denial were observed, and the local auth file passed. Independent invalidation of the prior live session, deployed cookie attributes, storage properties and secret-log checks lack independent live evidence. Password-at-rest was outside the exact-command auth file. |
| CD-02 authoring | **PASS for the exercised matrix.** 30 probes covered field boundaries and payload structure, with expected 201/400. Ten valid Drafts, IDs 8–17, have persisted-detail readbacks. R1. |
| CD-03 invalid answers and no write | **PASS.** Survey 18 rejected missing choice, foreign question, foreign option, duplicate question, object-shaped answers and null answer. Owner count remained 0 during rejection checks. A subsequent valid submission returned 201 and saved response 5. R1. |
| CD-04 simultaneous duplicate | **PASS.** Two submissions produced one 201 and one 409 `ALREADY_RESPONDED`. Survey 19 retained one response, ID 6. External evidence establishes the outcome. The exact database transaction interleaving was outside observation. R1. |
| CD-05 stale open form | **PASS.** After the owner closed survey 20, a stale form submit yielded 409 `SURVEY_NOT_OPEN`; UI showed the error and owner readback stayed at count 0. R1. |
| CD-05 UI double click | **PASS for observed behavior.** The submit control was disabled while submitting. Survey 21 had one successful submission, response 8, and count 1. R1. |
| CD-06 signed-out protected routes | **PASS for 13 GET/POST probes.** Each returned 401 and the recorded readbacks found no data changes. R1. |
| CD-06 response PUT and DELETE | **Authenticated branch PASS, anonymous branch OPEN.** UAT-09 observed authenticated respondent 404 for both. The agreed anonymous expectation is 401. The execution evidence contains 13 signed-out GET/POST probes and provides no result for these two anonymous methods. |
| CD-07 three-person aggregate and privacy | **PASS.** Survey 26 retained responses 13–15 for ratings 4, 4 and 5, all Online. Owner UI and API showed count 3, average 4.33, buckets 0/0/0/2/1, and Online 3 followed by In person 0. The summary exposed aggregates only. This checks the specified 4.33 example. A separate rounding-tie boundary remains untested. R2 JSON and screenshot accepted by ClassPulse. |
| CD-08 permission/state validation order | **PASS.** Non-enrolled submission to a Draft returned 403 `NOT_ELIGIBLE`. Enrolled submission with empty answers to a Closed survey returned 409 `SURVEY_NOT_OPEN`. Readbacks retained the Draft/Closed states and count 0. R1. |
| CD-08 missing resource | **PASS for the agreed external branch.** Both guarded and original missing-resource checks returned 404 `NOT_FOUND` in the authenticated respondent session. The result records observed service behavior. [R1 follow-up evidence](R1/CD08-missing-ID-result.json) |

## Review and coordination

1. **C/D and ClassPulse agree the remaining coverage.** Record C's actual review and disposition for independent live expiry, the remaining session controls, the anonymous PUT/DELETE observations and any further agreed role reload or rounding checks. For live expiry, prefer an agreed observation window on a verified release using a dedicated synthetic session under the unchanged TTL. If that window is unavailable for the lab, record the limitation and retain the local TEST-05 result at supporting scope.
2. **Coordinate blind staging if the baseline review finds no genuine ClassPulse defect.** Proposed initial window **26 November, 19:00–20:00 Bangkok**, with a provisional corrected-build retest **27 November, 19:00–20:00 Bangkok**. Both are proposals pending C/D and A/B confirmation, coverage disposition and staging readiness. Before any version change, agree the window and use a separate staging release with verified source, revision and traffic, dedicated synthetic data and privately shared access. ClassPulse retains the exercise details until independent discovery. Preserve survey 26, responses 13–15, and existing accounts and enrollments.
3. **Keep decisions scoped.** Final ClassPulse acceptance and ClassPulse Part D remain pending. The separate Workflow finding [WF-BUG-001](https://github.com/osizk/WorkflowAndApprovalSystem/issues/62) is closed after independent corrected-live retest. The remaining Workflow cases and A/B's whole-product decision are still tracked separately.
