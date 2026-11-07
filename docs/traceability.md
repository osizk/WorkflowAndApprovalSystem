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

[tests/request-ui.test.mjs](../tests/request-ui.test.mjs), test "F-02: browser submits and retrieves a saved request", covers the real UI → API → PostgreSQL journey and retry states. Kane reported that this test passed on d6690fc with PostgreSQL 16.15, with no skips, in his PR #22 approval; pex independently ran a mocked browser smoke, not this database test. The API checks above remain separate evidence. See the release verification below.

## Issue #9 — decision API verification

[tests/decisions.test.mjs](../tests/decisions.test.mjs) covers TEST-09–13 for role isolation, reason bounds, durable decision history, concurrent attempts, and rollback after event failure. Kane ran test-first commit c6a51aa on fresh PostgreSQL 16.15: migration and build passed, and all 3 decision tests failed with 404 because the route was absent (0 skipped). On exact implementation commit 1410169, he reported migration and build passing and `npm run test:decisions` passing 3/3, with 0 failures and 0 skips. These are branch results, not a release retest.

## Issue #10 — F-03 browser verification

[tests/review-ui.test.mjs](../tests/review-ui.test.mjs) exercises AC-09–11 with Edge and PostgreSQL 16.15. On exact 24183a3, npm run test:review-ui passed 1/1 with zero failures or skips. It verified that a submitted request assigned to another reviewer is absent from the queue and cannot be opened, and checked reason validation, approval, rejection and persisted history after reload. AC-12–13 remain covered by the separate decision API suite. This is branch evidence.

## Sprint 1 AC result map before release retest

The results below are issue-level results reported by kane on disposable PostgreSQL 16.15, unless a row says pending. Pex wrote or reviewed tests and ran the local build and database-independent checks; pex could not rerun PostgreSQL checks on this computer. These rows preserve issue-level results from before release verification.

| AC / planned test | Actual test file and name | Current result and limit |
| --- | --- | --- |
| AC-01 / TEST-01 | [auth.test.mjs](../tests/auth.test.mjs), “TEST-01 to TEST-03: login, current identity, role isolation and logout” | Reported pass on b6d2413; both roles and current identity. |
| AC-02 / TEST-02 | `auth.test.mjs`, same test | Reported pass on b6d2413; wrong password and anonymous request. |
| AC-03 / TEST-03 | `auth.test.mjs`, same test plus “TEST-03: expired session and wrong origin are refused” | Reported pass on b6d2413; logout and controlled expiry boundary. |
| AC-04 / TEST-04 | [requests.test.mjs](../tests/requests.test.mjs), “F-02: guarded submission, scoped retrieval and durable history”; [request-ui.test.mjs](../tests/request-ui.test.mjs), “F-02: browser submits and retrieves a saved request” | API reported pass on c139ca9; browser reported pass on d6690fc. |
| AC-05 / TEST-05 | `requests.test.mjs`, same API test | Reported pass on c139ca9; amount and text bounds. |
| AC-06 / TEST-06 | `requests.test.mjs`, same API test; [schema.sql](../tests/schema.sql), reviewer self-assignment check | Absent and wrong-role mapping return 409. Contract v0.6 clarifies that the database rejects self mapping before submission; the explicit constraint assertion passed and rolled back on PostgreSQL 16.15 at 055892d. |
| AC-07 / TEST-07 | `requests.test.mjs`, same API test | On c139ca9, the owner could list and retrieve their request; a second requester without a saved request was denied, and reviewer creation returned 403. The follow-up test adds a second saved request and verifies list isolation and reciprocal detail denial for both requesters and their assigned reviewers. |
| AC-08 / TEST-08 | `requests.test.mjs`, same API test | Reported pass on c139ca9; edit route unsupported and saved detail unchanged. |
| AC-09 / TEST-09 | [decisions.test.mjs](../tests/decisions.test.mjs), “TEST-09–11: assigned review, reason bounds, durable history and role isolation”; [review-ui.test.mjs](../tests/review-ui.test.mjs), “F-03: reviewer rejects an assigned request and reads persisted history” | API reported pass on 1410169; browser reported pass on 24183a3. |
| AC-10 / TEST-10 | `decisions.test.mjs`, same first test; `review-ui.test.mjs`, same browser test | Reported pass on those commits; approval and rejection history. |
| AC-11 / TEST-11 | `decisions.test.mjs`, same first test; `review-ui.test.mjs`, same browser test | Reported pass on those commits; rejection reason required, 500 accepted and 501 rejected. |
| AC-12 / TEST-12 | `decisions.test.mjs`, “TEST-12: concurrent and repeated decisions create one terminal event” | Reported pass on 1410169. |
| AC-13 / TEST-13 | `decisions.test.mjs`, “TEST-13: failed event insert rolls back the status update” | Reported pass on 1410169. |
| AC-14 / TEST-14 | [journey.test.mjs](../tests/journey.test.mjs), “Sprint 1: requester to reviewer decision survives application restart”; manual keyboard, mobile, setup and secret inspection | Journey passed in the full suite on 055892d with PostgreSQL 16.15 and Edge. Pex's local keyboard/mobile and bundle checks are described below. See the release verification below. |

Issue #11 local checks on 055892d (pex, Node 24.14.0): `npm run build` passed; `npm run test:auth-safety` passed 1/1; `npm run test:db-guard` passed 2/2; `git diff --check` passed. Only `.env.example` matched the tracked environment-file check, and a scan of the browser bundle found no `DATABASE_URL`, `SEED_`, `X-API-Key` or PostgreSQL connection-string markers. Pex also drove login, request navigation, form entry and a reviewer-unavailable retry by keyboard at 390px width in Edge, with mocked API responses; controls remained reachable and no horizontal overflow appeared. This is a local UI check, not the PostgreSQL 16 journey or full release acceptance.

Kane reported the full Issue #11 run on exact 055892d: migration, Prisma client generation and build passed; `npm run test:sprint1` passed 13 tests with 0 failures and 0 skips on Edge and PostgreSQL 16.15. The suite includes the real browser requester → assigned reviewer approval and retrieval after an application server restart. `tests/schema.sql` also passed and rolled back its fixtures, including the new self-assignment assertion. These are staging-branch results reported by kane, not a retest of a tagged main release or a direct observation by pex.

## Sprint 1 release verification

The release at [7c3f8a7](https://github.com/osizk/WorkflowAndApprovalSystem/commit/7c3f8a73f424dc8d5e1f27cb6ff38db8af562a8c) passed all 13 Sprint 1 tests with zero failures or skips. PostgreSQL schema checks rolled back their fixtures. A second seed run preserved the stored rows. Both npm audit modes reported zero vulnerabilities at verification time.

AC-14 keyboard replay on the released app used Edge at 1440 px and 390 px. At both widths Tab and Enter reached the labeled controls for sign-in, submission, approval, sign-out and retrieval. Visible focus and the field-associated title error were checked. The checked views had no horizontal overflow. The Requester retrieved the approved request with both history events. The automated journey independently verified persistence across application restart.