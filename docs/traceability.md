# Requirements traceability — v0.3

| Feature | Sprint | SRS coverage | Depends on | Verification / gap |
| --- | --- | --- | --- | --- |
| F-01 Identity and session | 1 | FR-01; BR-01; NFR-02–04 | Seed users | AC-01–03 / TEST-01–03 |
| F-02 Submit and retrieve | 1 | FR-02–03; BR-01, BR-03–04, BR-09; NFR-01–02, NFR-04 | F-01, schema, reviewer mapping | AC-04–08 / TEST-04–08 |
| F-03 Review and history | 1 | FR-04–06; BR-02, BR-05–08; NFR-01–02, NFR-04–05 | F-01, F-02, transaction support | AC-09–13 / TEST-09–13 |
| F-04 Return/revise/resubmit | 2 | FR-07 | F-02, F-03 | Later contract |
| F-05 Filter work lists | 2 | FR-09 | F-02, F-03 | Later contract |
| F-06 Decision summaries | 3 | FR-10 | F-03 | Later contract |
| Release checks | 1 | NFR-06; cross-feature NFR-01, NFR-03–04 | F-01–03 | AC-14 / TEST-14 |
| Additional approval stages | Unscheduled | FR-08 candidate | Scope approval | Outside baseline |

No SRS requirement IDs were added or changed. The inventory table tracks planned verification. Issue-level evidence is recorded below as it becomes available; the tested release commit and release results will be recorded separately.

## Issue #7 — actual F-02 verification

AC-04–08 / TEST-04–08 are exercised by [tests/requests.test.mjs](../tests/requests.test.mjs), test "F-02: guarded submission, scoped retrieval and durable history". The command npm run test:requests passed 1 test with 0 failures and 0 skips on PostgreSQL 16.15, on exact commit c139ca9, including the two-character title regression. The database rejects self-assignment at schema level; the API suite exercises absent and wrong-role assignments. This is branch evidence, not the release retest.

## Issue #8 — requester browser journey

[tests/request-ui.test.mjs](../tests/request-ui.test.mjs), test "F-02: browser submits and retrieves a saved request", covers the real UI → API → PostgreSQL journey and retry states. Kane reported that this test passed on d6690fc with PostgreSQL 16.15, with no skips, in his PR #22 approval; pex independently ran a mocked browser smoke, not this database test. The API checks above remain separate evidence. Release retesting is still pending.

## Issue #9 — decision API verification

[tests/decisions.test.mjs](../tests/decisions.test.mjs) covers TEST-09–13 for role isolation, reason bounds, durable decision history, concurrent attempts, and rollback after event failure. Kane ran test-first commit c6a51aa on fresh PostgreSQL 16.15: migration and build passed, and all 3 decision tests failed with 404 because the route was absent (0 skipped). On exact implementation commit 1410169, he reported migration and build passing and `npm run test:decisions` passing 3/3, with 0 failures and 0 skips. These are branch results, not a release retest.
