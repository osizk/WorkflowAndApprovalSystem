# Workflow and Approval System

CPE 334 Theme 5, Team EN-037 (DoubleP). Sprint 1 supports internal purchase requests: a Requester submits a request, an assigned Reviewer approves or rejects it, and authorized users can retrieve its saved status and history.

Read the [SRS](docs/srs.md), [system design](docs/system-sds.md), [feature inventory](docs/features.md), [traceability](docs/traceability.md), and [Sprint 1 contracts](docs/sprints/sprint-1/contracts.md).

## Run locally

Use Node.js 22.12 or newer in the 22 series, npm, and PostgreSQL 16 with the psql client. Create a development database and a user that can apply migrations. Copy .env.example to a local .env and set DATABASE_URL and PUBLIC_ORIGIN. Use the same host and port in PUBLIC_ORIGIN and the browser. Keep .env private.

```sh
npm ci
npm run db:validate
npm run db:generate
npm run db:migrate
```

Set SEED_REQUESTER1_PASSWORD, SEED_REQUESTER2_PASSWORD, SEED_REVIEWER1_PASSWORD, and SEED_REVIEWER2_PASSWORD privately in the current shell. Each synthetic password must be at least 12 characters. Then run:

```sh
npm run db:seed
npm run build
node --env-file=.env dist/server.js
```

If the environment variables are already exported, npm start runs the same server. PORT defaults to 3000. With the example origin, open http://localhost:3000/login. Sign in as requester1 or reviewer1 for one assigned pair, or requester2 or reviewer2 for the other. Seed reruns preserve existing synthetic credentials and assignments.

Submit a purchase request as a Requester, then sign out and sign in as their assigned Reviewer. Open the saved request, approve it or reject it with a reason, and reload to see the saved decision. The Requester can sign in again and read the same status and history.

## Verify Sprint 1

Create a separate disposable local PostgreSQL database with a name ending in _test. Set TEST_DATABASE_URL in the current shell. The guard rejects remote targets, routing options, and a target matching the development database. Use installed Edge by setting WORKFLOW_BROWSER_CHANNEL=msedge, or install Playwright Chromium with npx playwright install chromium and leave the channel unset.

```sh
npm run db:test:setup
npm run test:sprint1
psql -X -d "$TEST_DATABASE_URL" -f tests/schema.sql
```

The integrated suite builds the server and browser bundle, then runs guard, authentication, request, decision, and browser tests sequentially. The SQL checks use a transaction and roll back their fixtures. Record the tested Git commit, runtime versions, and actual counts. See [database notes](docs/database.md) for focused commands and constraints.

## Release and scope

The Sprint 1 release is identified by its immutable commit on main and the reference recorded in the Deliverable 1 report. This increment covers one approval stage and local execution. Return/revise, richer filtering, reports and hosted deployment are later work. Dependency audit findings in the pinned Prisma CLI tree require a separate reviewed tooling update.
