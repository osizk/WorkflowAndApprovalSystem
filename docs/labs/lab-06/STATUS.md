# Lab 6 current status after corrected Workflow deployment

Latest independent-retest checkpoint: ClassPulse A independently retested WF-BUG-001 on WF-FIX-001 at 23:03:13.097–23:03:15.462 Bangkok on 24 November. The unchanged original reproducer passed 2/2 (102400 bytes -> 422; 102401 bytes -> 413), and five supplemental checks passed. All 25 package hashes verified. WF-BUG-001 is fixed and independently verified, closed as completed. This is scoped defect closure; remaining agreed Workflow coverage, whole-product acceptance and ClassPulse CD-01/CD-07 fixtures remain pending. See [independent retest disposition](workflow/WF-BUG-001/INDEPENDENT-RETEST-DISPOSITION.md).

24 November 2026, Asia/Bangkok. No final acceptance or submission is recorded.

Latest ClassPulse fixture update: read-only preflight is complete, but no accounts have been created. The additive fixture tool needs a concurrency correction/review before authorized human execution. CD-01/CD-07 wait for actual setup evidence and private access.

| Direction | Completed evidence | Remaining work |
|---|---|---|
| Our team tests ClassPulse | Original UAT-01–12 behavior observations, agreed CD-08 missing-ID checks, additional coverage recorded with setup deviations | Partner provisions CD-07 third respondent and CD-01 inactive account; complete remaining agreed branches and coverage assessment; final independent acceptance |
| ClassPulse tests our Workflow | A original UAT-01/04/05 and B original UAT-02/03 plus later UAT-06 denial have observed outcomes; documented setup/presentation/version qualifications accepted; WF-BUG-001 independently reproduced | Remaining agreed additional coverage, including incomplete APPROVE-501 capture; whole-product acceptance |
| Our team fixes Workflow | Issue #62, meaningful RED/GREEN, peer-approved PR #63, peer-approved release PR #64, main CI 17/17 and successful deployment, fresh corrected serving mapping and seven passing developer checks | Finding closed after accepted independent retest; overall lab completion remains pending |

PR #63 was approved by osizk at 21:45:38 and merged by osizk at 21:49:18 on 24 November, Asia/Bangkok. Merge commit: eee7c7e93ee8d6e458d95bdd358762df9c2c6164. The reviewed head was 84a62c781c730ecf5779c80be0607df7ce0fe74f. Actual GitHub review and merge evidence is saved in lab6-evidence/workflow/WF-BUG-001/actual-peer-review-and-merge.json.

Release PR #64 was approved by osizk at 21:57:40 Bangkok on 24 November, on exact staging head eee7c7e93ee8d6e458d95bdd358762df9c2c6164. ClassPulse then explicitly confirmed no active A/B run and authorized deployment now, holding new test starts for the serving record. After checking approval and CI, the release was merged using HolyThiccDaddy at 22:32:42 Bangkok. Main release commit: ad2cbef67decf9953219694898327dea0bb66034. Deployment run 45426749596 succeeded, with 17/17 tests, Docker build, migration/release and required public smoke checks. No seed operation was requested. PRs #63 and #64 are Done on Kanban.

https://github.com/osizk/WorkflowAndApprovalSystem/pull/64

Corrected release WF-FIX-001 is verified: source ad2cbef67decf9953219694898327dea0bb66034, marker ad2cbef67dec, revision scd928edd-00008-9zd, digest sha256:26459db1d0278afcac49ec298c2c7d0523c7fc6eef75eeb40e7f18561e34ca43, 100% traffic. Fresh cloud mapping completed 22:37:46.488 Bangkok; browser marker observed 22:38:00.626. Seven developer checks passed, including 102400 bytes -> 422 and 102401 bytes -> 413. Independent ClassPulse corrected-live retest is accepted as PASS; final whole-product acceptance remains pending. See CORRECTED-RELEASE-WF-FIX-001.md and raw evidence under lab6-evidence/workflow/WF-BUG-001.

Preserve Workflow request IDs e1cc8f10-ccb4-49b1-a391-3d44fd4e3f67 and b1f4b385-04b4-4e7a-905f-7f9091e65db2. The optional restart remains NOT RUN. Browser setup acceptance covers the observed session retrieval checks only.

Next external reply: Lab6_Corrected_Workflow_and_B_Dispositions_20261124.zip. It supersedes older preparation-time reply packages for current Workflow status. Sending remains the student's action. ClassPulse CD-07 third respondent and CD-01 inactive-account fixture branches remain pending actual provisioning/private access. A reports the C3 contract approval has now happened; fixture readiness is still not established. Exact future appointments and the private findings channel remain for discussion on 25 November. Actual contributions, course-required declaration, final PDF and submission receipt remain to be completed from real events.
