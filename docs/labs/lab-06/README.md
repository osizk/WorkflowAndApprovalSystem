# Lab 6: independent UAT and defect management

Working report and evidence checkpoint, 24 November 2026. WF-BUG-001 independent corrected-live retest passed and the finding is closed. Remaining agreed coverage, whole-product acceptance and the self-contained PDF remain pending.

**ClassPulse testers: begin with the [testing checklist and handoff](handoff/TESTER-START-HERE.md).** It links the current release, original cases, agreed additional cases, remaining tests and blank result/finding/acceptance forms. REPORT.md and PLAN.md describe our work; the handoff gives your execution instructions.

| Document | Purpose |
|---|---|
| [Report](REPORT.md) | Current assessed work in both testing directions, results, limitations and remaining work |
| [End-to-end plan](PLAN.md) | Preparation through submission, with current next steps and a clearly marked historical preparation snapshot |
| [Current status](STATUS.md) | Latest Workflow release, peer reviews, ClassPulse coverage and open dependencies |
| [Contributions and required declaration](CONTRIBUTIONS.md) | Actual contribution, operator attribution and limits required by the labsheet |
| [Workflow handoff](handoff/lab06-uat-cases-en037-aligned.docx) | Prepared six-case handoff; Word visual layout verification remains pending |
| [ClassPulse coverage disposition](classpulse/COVERAGE-DISPOSITION.md) | Consolidated independent coverage, open branches and proposed Part D coordination |
| [ClassPulse coverage review](classpulse/R11-coverage-review.md) | Original eight proposed additional coverage groups |
| [ClassPulse execution continuation](classpulse/R1/CONTINUATION-REPORT.md) | Original case behavior observations, fixture-setup deviations and limitations |
| [ClassPulse accumulated evidence](classpulse/R1/continuation-results.json) | Recorded browser/API observations |
| [ClassPulse CD-08 evidence](classpulse/R1/CD08-missing-ID-result.json) | Completed guarded and original missing-ID observations |
| [Workflow original finding](workflow/WF-BUG-001/ORIGINAL-FINDING.md) | Original WF-BUG-001 reproduction and impact |
| [Workflow correction status](workflow/WF-BUG-001/CORRECTION-STATUS.md) | RED/GREEN, regression, review, CI, release and independent-retest state |
| [Independent retest disposition](workflow/WF-BUG-001/INDEPENDENT-RETEST-DISPOSITION.md) | Accepted 2/2 original boundary retest plus five supplemental checks; scoped finding closure |
| [Corrected release WF-FIX-001](workflow/WF-BUG-001/CORRECTED-RELEASE-WF-FIX-001.md) | Verified full source, browser marker, serving revision, digest, traffic and time |
| [Partner A setup disposition](partner-reviews/A3-SETUP-DISPOSITION.md) | Accepted A3 setup variation; its historical correction status is superseded |
| [Partner B evidence disposition](partner-reviews/B-V2-DISPOSITION.md) | Same-tab setup, amount display and later UAT-06 provenance qualifications |

## Branch workflow

The shared integration branch is **lab6**. Start Lab 6 fixes and documentation work from lab6 using a codex/lab6-* working branch, and target lab6 in the PR. Review and test the exact proposed head. Both CI and offline deployment checks include PRs targeting lab6.

Release reviewed changes from lab6 into main through a separate release PR. main remains the deployment branch. Coordinate the deployment window with ClassPulse before merging a release that affects their tests. Earlier PRs #63 and #64 used lab5-staging before this branch instruction was supplied; their reviewed and deployed evidence remains intact.

This documentation PR targets lab6. Merging it there does not deploy the app.

## Reading evidence

STATUS.md and the WF-FIX-001 record supersede earlier checkpoint statuses. Historical reports preserve the results and limitations known at their execution time. Product Team developer checks are separate from ClassPulse's independent retest. A completed deployment does not establish final acceptance.

SHA256SUMS.json lists the evidence and report hashes in this directory, excluding the manifest itself. The scoped .gitattributes preserves original bytes, including raw test-output whitespace and line endings. Passwords, session cookies and private access channels are excluded.
