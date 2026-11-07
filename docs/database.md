# Database schema and migration

Issue #3 implements the PostgreSQL persistence contract in [Sprint 1 contracts](sprints/sprint-1/contracts.md). It provides the schema for F-01, F-02 and F-03. API enforcement and seed data are separate issues.

Use Node.js 22, PostgreSQL 16 as the project baseline, and the pinned Prisma CLI. Copy the example environment file to a local .env and set DATABASE_URL to the intended database. Then run:

```sh
npm ci
npm run db:validate
npm run db:generate
npm run db:migrate
```

Run the SQL verification only on a fresh disposable database whose name ends in _test, after applying the migration:

```sh
psql -X -d "$DATABASE_URL" -f tests/schema.sql
```

The script inserts deterministic fixtures inside a transaction and rolls them back. It checks ownership references, self-review, amount limits, blank rejection reasons, transaction rollback and duplicate terminal events. It is not a substitute for the session, API authorization or concurrent decision tests in the feature contracts.

The requester and assigned reviewer are retained on every purchase request. The preset assignment is consulted during submission; later changes to that mapping do not change existing ownership. The API must check roles and use one transaction for submission plus event or for a conditional terminal update plus event. Restricted foreign keys preserve history, and partial unique indexes prevent duplicate submission and terminal events.

## Synthetic seed and test database (Issue #4)

After migration, set `SEED_REQUESTER1_PASSWORD`, `SEED_REQUESTER2_PASSWORD`, `SEED_REVIEWER1_PASSWORD`, and `SEED_REVIEWER2_PASSWORD` privately to values of at least 12 characters, then run `npm run db:seed`. The seed creates `requester1`, `requester2`, `reviewer1`, and `reviewer2`; each requester has the matching reviewer assigned. Passwords are salted with Node's scrypt and stored as `scrypt:<salt hex>:<hash hex>`. The login implementation must verify this format. Repeating the seed preserves existing passwords, roles, assignments, requests and history. It never prints passwords. Do not commit the password values or a local environment file.

For migration tests, set `TEST_DATABASE_URL` explicitly to a separate, disposable **local** PostgreSQL database whose name ends in `_test`, then run `npm run db:test:setup`. This command refuses missing, remote, or non-`_test` targets, URL routing options, and a target matching the development database even across loopback aliases or an omitted default port. It reads the development URL from the process or local `.env`; it never falls back to that URL for tests. Run `npm run test:db-guard` to check these guards. The SQL fixture verification still uses `psql -X -d "$TEST_DATABASE_URL" -f tests/schema.sql` after setup. Never point the test URL at development or production data.

## Authentication API (Issue #5)

After generating the Prisma client and seeding, set `PUBLIC_ORIGIN` to the exact browser origin (for example `http://localhost:3000`), run `npm run build` then `npm start`. `POST /api/session` and `DELETE /api/session` require a matching `Origin` header. Login accepts JSON `login` and `password`; `GET /api/session` returns the current id and role; logout revokes the cookie. Set `PORT` if the API should listen somewhere other than 3000. Under HTTPS, the session cookie is Secure.

For real API/database verification, set `TEST_DATABASE_URL` to a disposable local PostgreSQL `_test` database, run `npm run db:test:setup`, then `npm run test:auth`. The test creates and removes its own synthetic users and sessions. It does not use the development database. `TEST-01`–`TEST-03`, the exact expiry instant using a controlled clock, and the protected-role boundary are covered.

`npm run test:auth-safety` runs the generic-error logging regression without a database. It confirms that a forced database error neither reaches the client nor prints sensitive error details.

## Run the login UI

After generating the client, migrating, and seeding the local database, set DATABASE_URL and PUBLIC_ORIGIN in the process environment. For port 3000, use PUBLIC_ORIGIN=http://localhost:3000 and open that exact origin at /login.

```sh
npm run build
npm start
```

The browser and API share the same origin. The server derives the destination from the authenticated role. Reviewer decisions are added in a later feature issue.

Requester pages are `/requests`, `/requests/new`, and `/requests/{id}`. The form shows validation and reviewer-unavailable errors without clearing entered values; a successful submission opens the saved read-only detail. `npm run test:request-ui` checks the browser journey against the isolated `TEST_DATABASE_URL` after `npm run db:test:setup`. The test creates and removes its own synthetic users and request.

## Reviewer decision API (Issue #9)

An assigned Reviewer sends `POST /api/requests/{id}/decision` with JSON `{"decision":"APPROVE"}` or `{"decision":"REJECT","reason":"..."}`. The server derives identity from the session, rejects requester and unrelated reviewer calls, and writes the terminal state and history event in one transaction. Repeated or lost concurrent decisions return 409. Run `npm run test:decisions` only against the explicit disposable `TEST_DATABASE_URL` after test migration setup. The test covers role scope, reason bounds, concurrent decisions, and rollback after a forced event insert failure.

## Sprint 1 integration checks (Issue #11)

Set `TEST_DATABASE_URL` to a separate disposable local PostgreSQL 16 database ending in `_test`, then run `npm run db:test:setup` and `npm run test:sprint1`. Set `WORKFLOW_BROWSER_CHANNEL=msedge` if using an installed Edge browser. The suite runs the database guard, authentication, request, decision and browser tests in one sequence. Its final browser test submits a request, approves it as the assigned reviewer, stops and restarts the application server, then retrieves the saved status and history. Record the exact tested staging commit, command output, pass/fail/skip counts and any environmental difference from the Node 22/PostgreSQL 16 baseline.

For the real browser check, migrate a separate local database using TEST_DATABASE_URL and run npm run test:auth-ui. Use WORKFLOW_BROWSER_CHANNEL=msedge for an installed Edge browser, or install the Playwright Chromium browser and leave the channel unset. The test starts a local server on port 55476 and cleans up its synthetic accounts and sessions.
