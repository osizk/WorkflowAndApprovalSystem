# CP-V01 local session-expiry evidence

**TEST-05 PASS.** The test asserted HTTP 200 from `/api/auth/me` with the valid fixture session. It then set the fixture's `expiresAt` one minute in the past in the isolated database. The next request returned HTTP 401 with code `UNAUTHENTICATED`. The full auth file finished with **8 passed, 0 failed, 0 skipped** across one file. Exit code **0**.

| Field | Recorded value |
|---|---|
| Test window | 25 November 2026, 20:20:17–20:20:22 Asia/Bangkok |
| Operator/model | Codex (GPT-6.2 Sol) under Thira Rungruangkaset, tester D / EN-037_P5 |
| Exact source | `1fe3e3b82dfb0537be30223c9b598b3479b4affe` (CP-V01) |
| Checkout proof | `git rev-parse HEAD` returned the exact commit before and after. `git rev-parse --abbrev-ref HEAD` returned `HEAD` for detached checkout. `git status --porcelain=v1 --untracked-files=all` was empty before and after. |
| Runtime | Windows x64, Node v24.14.0, npm 11.9.0, Vitest 2.1.9, Prisma 5.22.0, PostgreSQL 16.16 |
| Database | Fresh standalone local cluster, `classpulse_test`, listener `127.0.0.1:60758`. The live SQL check matched its data directory to the new run directory and found zero public tables before migrations. No other sessions were connected immediately before testing. |
| Preparation | `npx --no-install prisma migrate deploy` applied the pinned migration successfully. The existing test fixture managed its own synthetic data. |
| Test command | `npm test -- tests/api/auth.test.ts --reporter=verbose` from `server/`. The verbose reporter lists each case and does not filter the suite. |
| Serving revision | N/A, local automated evidence |

Docker Desktop did not become ready during setup. PostgreSQL ran from a vendor-verified standalone binary archive. The first scratch server started but its launcher timed out before migrations or tests. I stopped that scratch server and ran the suite in a fresh cluster with corrected launch handling. The runner stopped the verified cluster after the run and its listener is gone. The repository code, schema and guards were used as checked out.

This is supporting automated evidence for the server's expiry check. Independent live TTL coverage, final acceptance and ClassPulse Part D remain open. The local test exercised the expired fixture state directly. There was no deployment or live configuration or data change.

- [Full sanitized auth output](auth-test-output.txt)
- [Checkout and database checks](run-proof.json)
- [Local migration output](migration-output.txt)
- [F-01 authentication contract at CP-V01](https://github.com/Punge089/classpulse/blob/1fe3e3b82dfb0537be30223c9b598b3479b4affe/docs/sprints/sprint-1/F-01-authentication.md)
