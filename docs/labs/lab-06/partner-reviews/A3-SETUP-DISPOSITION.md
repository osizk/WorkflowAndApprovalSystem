> Historical A3 setup disposition. Its correction-state paragraph predates approval, merge and deployment. STATUS.md and the WF-FIX-001 release record supersede that paragraph.

# EN037 disposition of ClassPulse A3 Workflow observations

Prepared 24 November 2026 under Thira's delegated technical review. Actual contribution and tool-use attribution remain in the required declaration and original partner records. The original A3 evidence is preserved unchanged.

## Evidence reviewed

Verified the 46 listed SHA256 checksums, parsed the run metadata and case-observation files, and inspected the signed-out redirect snapshot and final control-count record. Visually inspected the reviewer reload and requester rejection readback screenshots. Their visible amounts, terminal statuses, histories and release marker match the accompanying observations.

Product: Workflow and Approval System. Partner run UAT6-20261124-A-210340, 24 November 2026 from 21:03:40 to 21:09:45 Asia/Bangkok. Release source 82a4806b5291b57ad7e76a28fb7d40e1e947b9a6, marker 82a4806b5291. Source/revision/digest/traffic mapping is the supplied EN037 read-only record at 20:51:51–58. The matching browser marker was observed by A during the run.

## Browser setup variation accepted

Disposition: accepted for the recorded signed-out/new-login persistence and terminal-state checks in UAT-01, UAT-04 and UAT-05.

The method used explicit logout, closure of the old temporary tab, a replacement tab, an observed signed-out redirect without request data, and fresh login before retrieval. Those steps provide a suitable reset for the recorded requirement to retrieve persisted data across login sessions. Preserve this actual method in the case record. A literal private-window repeat is unnecessary for these specific observations.

The original handoff's private-window instruction is broadened by this addendum for this scope. For later runs, an isolated private session or explicit logout plus verified signed-out state in a replacement tab is acceptable. Record the method used and preserve the signed-out observation. An existing authenticated tab alone does not establish this setup variation.

Literal creation of a new private browser context, cookie-attribute inspection, server rejection of a replayed old cookie, session expiry, and application restart remain separate untested or setup-dependent assertions. The optional UAT-04 restart remains NOT RUN. No HTTP result is inferred from a UI-only validation message.

## Recorded case dispositions

| Case | Technical disposition | Preserved record |
|---|---|---|
| UAT-01 | PASS observed UI path, setup variation accepted | e1cc8f10-ccb4-49b1-a391-3d44fd4e3f67, 125.50 THB, APPROVED, SUBMITTED then APPROVED |
| UAT-04 | PASS signed-out/new-login retrieval and final-state controls, setup variation accepted | Same request ID, amount and two original history events. Reviewer reload shows Approve count 0 and Reject count 0. Optional restart NOT RUN. |
| UAT-05 | PASS observed blank-reason rejection and successful reasoned rejection, setup variation accepted | b1f4b385-04b4-4e7a-905f-7f9091e65db2, 300.00 THB, REJECTED, SUBMITTED then REJECTED, reason: Budget unavailable for this purchase |

Both requests are registered as retained comparison evidence. Future corrections and retests should retrieve these IDs and use fresh records for tests requiring new terminal decisions. Preserve original records and later results as separate observations.

This accepts the Product Team setup variation and corroborates the observed outcomes. The independent UAT Team owns its final whole-product acceptance record. B's execution and additional case outcomes remain to be supplied by the actual participants.

## Workflow correction state

PR https://github.com/osizk/WorkflowAndApprovalSystem/pull/63

Head 84a62c781c730ecf5779c80be0607df7ce0fe74f, target lab5-staging. Marked ready for review after local RED/GREEN, 17/17 full CI tests, successful Docker build and successful deployment-checks. Review has been requested from osizk. There were no submitted reviews at the latest check. Actual teammate review, staging/release integration, corrected deployment mapping and partner independent retest remain pending.

The currently served original release remains the version identified in the prior mapping. A fresh corrected serving record is required after reviewed deployment. Preserve the original WF-BUG-001 failure and independent confirmation alongside that later retest.

ClassPulse CD-07 third respondent and CD-01 inactive-account fixtures remain pending the partner's reviewed provisioning and private access. CP-V01 remains the partner's latest verified release basis. Actual participant contributions and the 25 November appointment/channel discussion remain pending as described in A3.
