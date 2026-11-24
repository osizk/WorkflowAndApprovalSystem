# Workflow correction status

Issue62 accepts WF-BUG-001 as a Minor error-handling defect. ClassPulse A's independent reproduction is preserved in lab6-partner-confirmation-20261124/wf-confirmation.

Local correction checkout is workflow-lab6-correction, branch codex/lab6-oversized-json. PR #63 was approved and merged into lab5-staging by osizk. Only src/auth.ts and tests/auth-safety.test.mjs changed. The staging branch had an older commit history with the same tree as released main when the branch was prepared.

| Stage | Exact identifier | Actual result |
|---|---|---|
| Original deployed source | 82a4806b5291b57ad7e76a28fb7d40e1e947b9a6 | Bug reproduced locally through live requests and independently by ClassPulse A |
| Regression commit | 0e4897310d8382ec915b6a122ba9121cad22c919 | Build passed,1 test passed,1 intended test failed500 versus 413,0 skipped |
| Correction commit | 84a62c781c730ecf5779c80be0607df7ce0fe74f | Build passed;2/2 safety tests passed;7/7 focused regression checks passed,0 skipped |
| Approved implementation PR | https://github.com/osizk/WorkflowAndApprovalSystem/pull/63 | osizk approved the correction head at 21:45:38 Bangkok and merged at 21:49:18 on 24 November 2026 |
| Staging merge | eee7c7e93ee8d6e458d95bdd358762df9c2c6164 | Merged into lab5-staging; exact GitHub evidence in actual-peer-review-and-merge.json |
| Main release PR | https://github.com/osizk/WorkflowAndApprovalSystem/pull/64 | osizk approved exact head eee7c7e93ee8d6e458d95bdd358762df9c2c6164 at 21:57:40 Bangkok; merged after ClassPulse window confirmation at 22:32:42 |
| Main source | ad2cbef67decf9953219694898327dea0bb66034 | Release merge, passing main CI and deployment run 45426749596 |
| Corrected live release | WF-FIX-001 / scd928edd-00008-9zd | 100% traffic, source-tag/digest mapping and browser marker verified; seven public developer checks pass |
| Independent corrected-live retest | PASS / ClassPulse A, 23:03:13.097–23:03:15.462 Bangkok | Unchanged original reproducer 2/2 and five supplemental checks passed; all 25 package hashes verified; finding closed as fixed/independently verified |

repository-red-output.txt and repository-green-output.txt contain the same repository test with the implementation before/after correction. focused-regression-output.txt contains the7-test selection. The initial missing Prisma client and sandboxed engine-download attempts were setup failures and are excluded from the successful-build RED claim. Prisma was generated before the recorded RED run.

Full database/browser/Docker CI passed. Run https://github.com/osizk/WorkflowAndApprovalSystem/actions/runs/45407729755 completed successfully2026-11-24T13:53:08Z. It ran PostgreSQL 16, Chromium, migrations, build and 17 tests with 17 passed,0 failed,0 skipped, then successfully built the Docker image. Deployment-checks passed in run 45407729713. Actual log is full-ci-output.txt. The pull-request event skipped live deployment by design.

current-serving-version.json preserves the earlier original-release mapping. corrected-serving-version.json contains the new source-tag/revision/digest/100-percent-traffic mapping completed 22:37:46.488 Bangkok on 24 November. corrected-browser-marker.json records the visible ad2cbef67dec marker at 22:38:00.626. CORRECTED-RELEASE-WF-FIX-001.md is the current partner release record. The correction is deployed and the independent retest is accepted PASS. See INDEPENDENT-RETEST-DISPOSITION.md. Whole-product acceptance remains pending.

Actual contribution and AI-use attribution are in LAB-6-AI-USE-AND-CONTRIBUTIONS.md. Peer approvals and merges are recorded from actual GitHub events. The successful corrected deployment, Product Team checks and accepted independent partner retest are recorded separately. WF-BUG-001 is closed; whole-product acceptance remains pending.
