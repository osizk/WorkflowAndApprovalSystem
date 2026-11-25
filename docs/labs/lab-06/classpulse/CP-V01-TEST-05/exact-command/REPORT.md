# ClassPulse CP-V01 expiry rerun

**TEST-05 passed.** It asserted HTTP 200 from `/api/auth/me` with the active fixture session. After the test set that session's `expiresAt` one minute in the past, it asserted HTTP 401 with code `UNAUTHENTICATED`. The pinned file contains eight tests, and the exact-command run reported **8 passed, 0 failed, 0 skipped** across one file. The default reporter reports the file total and only lists individual tests that cross its duration threshold. The earlier run with the verbose reporter names TEST-05 explicitly. [Pinned TEST-05 assertions](https://github.com/Punge089/classpulse/blob/1fe3e3b82dfb0537be30223c9b598b3479b4affe/server/tests/api/auth.test.ts#L96-L104)

| Field | Recorded value |
|---|---|
| Test time | 25 November 2026, 20:30:14–20:30:18 Asia/Bangkok |
| Actual operator and model | Codex (GPT-6.2 Sol) under Thira Rungruangkaset, tester D / EN-037_P5 |
| Checkout | Detached at CP-V01 `1fe3e3b82dfb0537be30223c9b598b3479b4affe`. `git rev-parse HEAD` matched before and after. `git status --porcelain=v1 --untracked-files=all` returned empty before and after. |
| Runtime | Windows x64, Node v24.14.0, npm 11.9.0, Vitest 2.1.9, Prisma 5.22.0, PostgreSQL 16.16 |
| Database | Fresh standalone `classpulse_test` cluster listening only at `127.0.0.1:61063`. Its data directory matched the new run directory, the public schema had zero tables before migrations, and no other sessions were connected just before testing. The cluster was stopped after the run. |
| Preparation | `npx --no-install prisma migrate deploy` applied the pinned schema migration with exit code 0. The existing fixtures used synthetic secrets in this local cluster. |
| Command | `npm test -- tests/api/auth.test.ts` from `server/`, with the default reporter and no test-name filter |
| Exit code | `0` |
| Serving revision | N/A. This run used the exact CP-V01 source locally. |

This run supplies supporting automated evidence for the expired-session assertion. Independent live expiry remains open because the fixture was expired directly in the test database. Final acceptance and ClassPulse Part D remain open. Checkout code, schema and guards were used as committed.

- [Full sanitized test output](auth-test-output.txt)
- [Checkout and database proof](run-proof.json)
- [Migration output](migration-output.txt)
