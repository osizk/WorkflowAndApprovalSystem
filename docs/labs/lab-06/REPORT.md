# Lab 6 working report

Team EN-037_P5: Thira Rungruangkaset, 67070503419 (D / HolyThiccDaddy), and Ashira Sansoda, 67070503445 (C / osizk). Checkpoint: 24 November 2026, Asia/Bangkok.

Our product is Workflow and Approval System. We independently test ClassPulse; ClassPulse independently tests Workflow. This is the repository working report. The final assessed PDF, independent corrected-live retest and final acceptance are not complete.

## Part A: preparation and handoff

The prepared Workflow handoff contains six original cases covering submission/approval, exact amount boundaries, account-scoped access, persisted history, rejection reasons and forbidden requester decisions. The handoff, contract scope and release identifiers are retained. A/B additional coverage revision A2 was technically accepted. Cases requiring shared state retain the same request ID; other decisions use separate synthetic records.

ClassPulse original UAT-01–12 and eight proposed CD coverage groups were reviewed against the pinned contracts. Fixture-dependent or controlled-environment branches remain identified explicitly. The exact remaining appointments/private findings channel are still for agreement; no booked slot is implied by the availability dates.

See [the plan](PLAN.md), [coverage review](classpulse/R11-coverage-review.md), [prepared handoff](handoff/lab06-uat-cases-en037-aligned.docx) and [current status](STATUS.md).

## Part B: our independent ClassPulse observations

The R1 execution and continuation recorded expected behavior across the twelve original ClassPulse cases. Results include account/role restrictions, valid/invalid authoring, eligibility, single response enforcement, privacy, legal state transitions and response summaries. UAT-08/10/11 used documented API fixture setup; preserve those deviations rather than describing those paths as entirely UI-driven.

The agreed guarded missing-ID request and original missing-ID request both returned 404 in a verified RESPONDENT session. These are external branch observations; they do not establish a database inspection. Additional authoring, answer-validation, concurrency, stale-state and signed-out route observations are retained in the accumulated log.

ClassPulse CD-07 needs the new third enrolled respondent. CD-01 needs the inactive-account and agreed controlled-session setup. Those branches remain pending actual partner provisioning evidence/private access. The partner reports C3 contract approval, but that does not make the accounts ready. The completed observations do not establish comprehensive no-defect coverage or our final acceptance.

The ClassPulse CP-V01 release basis is partner-reported source 1fe3e3b82dfb0537be30223c9b598b3479b4affe, revision classpulse-00006-6w6 and digest sha256:60f61ccccbc559e6c060383ad9acafc6918e1202ec1e7e5e43aa107c35707795. No fresh ClassPulse cloud mapping is claimed by this report.

See [initial report](classpulse/R1/INITIAL-REPORT.md), [continuation](classpulse/R1/CONTINUATION-REPORT.md), [accumulated log](classpulse/R1/continuation-results.json), [CD-08 result](classpulse/R1/CD08-missing-ID-result.json) and the PNG evidence in that directory.

## Part C: Workflow findings and partner evidence

WF-BUG-001 is a genuine Minor error-handling finding: a valid 102401-byte JSON body was mapped to 500 INTERNAL_ERROR instead of preserving the parser's 413 classification; the 102400-byte control returned 422. The full Sprint contract did not explicitly specify 413 or the body-size limit; the recorded triage retains that distinction. ClassPulse A independently reproduced the original failure.

ClassPulse A observed the expected UAT-01/04/05 paths. B supplied 48 timestamped UI observations, not 48 cases, for the amount/access paths and supplemental boundaries, followed by a separate UAT-06 decision probe at 21:57:46.326 Bangkok. Its console screenshot shows 403/FORBIDDEN, unchanged:true and before/after 200 readbacks. The original-release provenance is corroborated by the before-deployment mapping; the collapsed identity object and missing fresh marker remain stated limitations.

The Product Team accepted the documented role-logout setup for the scoped amount/access checks and clarified that 1000000.00 is an acceptable two-decimal display of the numeric maximum. A private-window assertion is not inferred. Incomplete APPROVE-501 response capture and unexecuted additional API cases remain open. The partner owns its independent case records and final acceptance.

See [original finding](workflow/WF-BUG-001/ORIGINAL-FINDING.md), [A disposition](partner-reviews/A3-SETUP-DISPOSITION.md), [B disposition](partner-reviews/B-V2-DISPOSITION.md) and [retention registry](partner-reviews/RETAINED-REQUESTS.json).

## Part D: correction, review, CI and release

| Stage | Recorded result |
|---|---|
| Regression before fix | Same meaningful repository test: build succeeded, one test passed and one failed on 500 versus expected 413 |
| Correction | One specific entity.too.large mapping to 413 PAYLOAD_TOO_LARGE; malformed JSON and other error paths retained |
| Focused regression | Two safety tests and seven focused checks passed |
| Implementation review | osizk approved exact head 84a62c781c730ecf5779c80be0607df7ce0fe74f in PR #63 and merged it into the prior staging branch |
| Release review | osizk approved exact staging head eee7c7e93ee8d6e458d95bdd358762df9c2c6164 in PR #64 |
| Deployment coordination | ClassPulse confirmed no active A/B run and authorized deployment, holding new starts for the serving record |
| Main release | PR #64 merged at 22:32:42 Bangkok as ad2cbef67decf9953219694898327dea0bb66034 |
| Main CI and deployment | Run 45426749596 succeeded: 17 tests passed, zero failed/skipped, Docker built, migration/release and required smoke checks passed |
| Corrected live record | WF-FIX-001, marker ad2cbef67dec, revision scd928edd-00008-9zd, digest sha256:26459db1d0278afcac49ec298c2c7d0523c7fc6eef75eeb40e7f18561e34ca43, 100% traffic |
| Fresh verification | Cloud mapping completed 22:37:46.488 Bangkok; browser marker observed 22:38:00.626; seven developer checks passed, including 102401 bytes returning 413 |
| Independent corrected-live retest | Pending actual ClassPulse execution and evidence |

The release uses the existing database with no seed or record cleanup. Individual A/B records have not all received a new authenticated readback in the public smoke checks. Preserve them for partner comparison. The optional restart and other unexecuted controlled checks remain unexecuted.

See [correction status](workflow/WF-BUG-001/CORRECTION-STATUS.md), [RED](workflow/WF-BUG-001/repository-red-output.txt), [GREEN](workflow/WF-BUG-001/repository-green-output.txt), [focused output](workflow/WF-BUG-001/focused-regression-output.txt), [corrected release](workflow/WF-BUG-001/CORRECTED-RELEASE-WF-FIX-001.md) and [developer checks](workflow/WF-BUG-001/corrected-live-developer-checks.json).

Repository evidence: [Issue #62](https://github.com/osizk/WorkflowAndApprovalSystem/issues/62), [implementation PR #63](https://github.com/osizk/WorkflowAndApprovalSystem/pull/63), [release PR #64](https://github.com/osizk/WorkflowAndApprovalSystem/pull/64), [deployment run](https://github.com/osizk/WorkflowAndApprovalSystem/actions/runs/45426749596).

## Remaining assessed work

Receive the independent corrected-live retest, complete or disposition all agreed additional branches, finish the fixture-dependent ClassPulse tests, reconcile findings and record both products' actual acceptance decisions. If thorough ClassPulse coverage yields no genuine defect, follow the instructor's applicable controlled exercise process; do not invent a natural bug. Assemble and visually inspect the self-contained PDF, confirm the course deadline and retain the actual submission receipt.

The required actual contribution and tool-use declaration is in [CONTRIBUTIONS.md](CONTRIBUTIONS.md). It accompanies the recorded evidence and will be included once in the final PDF.
