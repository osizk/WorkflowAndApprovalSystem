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

For migration tests, set `TEST_DATABASE_URL` explicitly to a separate, disposable **local** PostgreSQL database whose name ends in `_test`, then run `npm run db:test:setup`. This command refuses missing, remote, or non-`_test` targets and a URL matching `DATABASE_URL`; it does not fall back to the development database. Run `npm run test:db-guard` to check these guards. The SQL fixture verification still uses `psql -X -d "$TEST_DATABASE_URL" -f tests/schema.sql` after setup. Never point the test URL at development or production data.
