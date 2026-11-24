# WF-BUG-001: fixed and independently verified

Product Team disposition after review of ClassPulse A's received independent retest, 24 November 2026. Finding severity remains Minor. Finding status: closed as completed. Whole-product acceptance remains pending.

## Evidence reviewed

Source package: ClassPulse_WF_BUG_001_Independent_Retest_20261124.zip. ZIP SHA256: 5b3a7f3806679aab2147eb32de4eb20c2f2d21f7b7e81e1bb1075b22fd17131f. All 25 listed SHA256 entries verified. The supplied reproducer is byte-identical to the prior independent original-failure reproducer; its SHA256 is 13adcb704d406d0580a49d77b222a90d9a25fed3a691f7df852c507735c93be4. The original failing output matches the previously received evidence byte-for-byte. Logs, result metadata, before/after served-source evidence and the rendered marker screenshot were reviewed. Supplied scripts were inspected as evidence and were not executed during this review.

## Actual independent result

ClassPulse A's run began 23:03:13.097 and ended 23:03:15.462 Asia/Bangkok on 24 November 2026. Actual operator/contribution attribution remains unchanged in the original partner evidence and required declaration.

| Probe | Observed result | Disposition |
|---|---|---|
| 102400-byte JSON POST /api/session | 422 VALIDATION_ERROR | PASS |
| 102401-byte JSON POST /api/session | 413 PAYLOAD_TOO_LARGE with the expected safe message | PASS |
| Unchanged original reproducer | 2 passed, 0 failed, 0 skipped, exit 0 | Independent defect retest PASS |
| Supplemental health/readiness/signed-out/malformed-JSON/health checks | 5 passed, 0 failed, 0 skipped, exit 0 | Scoped supplemental regression PASS |

These are seven checks, not seven complete UAT cases or a full repository test suite. They are separate from the Product Team's earlier developer checks. The original 102401-byte 500 failure is preserved, not replaced by the corrected result.

## Version and limits

Tested release WF-FIX-001: source ad2cbef67decf9953219694898327dea0bb66034, marker ad2cbef67dec, revision scd928edd-00008-9zd, digest sha256:26459db1d0278afcac49ec298c2c7d0523c7fc6eef75eeb40e7f18561e34ca43, 100% traffic in EN037's supplied cloud mapping.

A separately observed the matching full source/marker in the same-origin served application bundle before and after the run, with unchanged asset hash, and the rendered marker screenshot. A also checked the merged release PR and successful deployment remotely. The Cloud Run/Artifact Registry mapping remains attributed to EN037, not an independent A cloud readback. The initial SPA-bootstrap marker lookup stopped before API tests; its corrected harness method and original checkpoint are retained as a tooling limitation, not an app defect or hidden PASS.

No credentials or successful business mutation were used. The run did not freshly authenticate to reread every retained A/B request. Preservation here means the retest did not modify them; individual record readback is a separate observation.

## Final finding disposition and remaining lab work

Accept the independent corrected-live retest and close WF-BUG-001 as fixed and independently verified on WF-FIX-001. The chain is genuine original discovery, independent reproduction, meaningful repository RED/GREEN, peer review, CI, reviewed release/deployment, verified serving mapping and independent corrected-live retest.

Remaining agreed additional Workflow coverage and the partner's whole-product acceptance remain open. ClassPulse CD-01/CD-07 fixtures are still not ready. A reports read-only preflight complete and no new accounts created; B's additive fixture tool needs concurrency correction/review before an authorized human executes it. Wait for actual fixture-ready evidence/private access before those tests. A preflight or approved contract is not proof of provisioning.
