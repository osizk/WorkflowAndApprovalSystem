# Database schema and migration

Issue #3 implements the PostgreSQL persistence contract in [Sprint 1 contracts](sprints/sprint-1/contracts.md). It provides the schema for F-01, F-02 and F-03. API enforcement and seed data are separate issues.

Use Node.js 22, PostgreSQL 16 as the project baseline, and the pinned Prisma CLI. Copy the example environment file to a local .env and set DATABASE_URL to the intended database. Then run:

```sh
npm ci
npm run db:validate
npm run db:migrate
```

Run the SQL verification only on a fresh disposable database whose name ends in _test, after applying the migration:

```sh
psql -X -d "$DATABASE_URL" -f tests/schema.sql
```

The script inserts deterministic fixtures inside a transaction and rolls them back. It checks ownership references, self-review, amount limits, blank rejection reasons, transaction rollback and duplicate terminal events. It is not a substitute for the session, API authorization or concurrent decision tests in the feature contracts.

The requester and assigned reviewer are retained on every purchase request. The preset assignment is consulted during submission; later changes to that mapping do not change existing ownership. The API must check roles and use one transaction for submission plus event or for a conditional terminal update plus event. Restricted foreign keys preserve history, and partial unique indexes prevent duplicate submission and terminal events.
