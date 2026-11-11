# Lab 5 local Docker deployment

This guide runs WorkflowAndApprovalSystem with Docker Compose. The application
container serves the built React UI and Express API. PostgreSQL stores the
database in the `pgdata` volume. The `migrate` service uses the application
image to apply the Prisma schema.

## Run from a fresh checkout

Start Docker Desktop, open PowerShell at the repository root, and check that
port `18080` is free. Run these commands from the branch or commit under test.

```powershell
git status --short --branch
git rev-parse --short HEAD
Copy-Item .env.example .env
```

Replace the `POSTGRES_PASSWORD` placeholder in the local `.env` file with a
throwaway password using letters, digits, and hyphens. Compose inserts this
value into the PostgreSQL connection URL. Choose the password before the first
run on a fresh volume. The `.env` file is ignored by Git and excluded from the
Docker build context.

```powershell
docker compose build --no-cache app
docker compose run --rm migrate
docker compose up -d app
docker compose ps
```

The build should report that the image was built. The migration should apply
the schema on a fresh database. In `docker compose ps`, the `app` service
should be `Up` and `db` should be `healthy`. Open
[the local login page](http://localhost:18080/login).

To run a second copy for a clean-clone check, add
`-p workflow-lab5-check` immediately after `docker compose` in each command.
This gives the check its own network and database volume. Stop the first
copy's `app` service before starting the second copy on port `18080`.

## Seed and try the local workflow

In PowerShell 7, choose a local test password at least 12 characters long.
Use the synthetic accounts for local checks only.

```powershell
$demoPassword = Read-Host 'Local demo password' -MaskInput
$env:SEED_REQUESTER1_PASSWORD = $demoPassword
$env:SEED_REQUESTER2_PASSWORD = $demoPassword
$env:SEED_REVIEWER1_PASSWORD = $demoPassword
$env:SEED_REVIEWER2_PASSWORD = $demoPassword
docker compose run --rm -e SEED_REQUESTER1_PASSWORD -e SEED_REQUESTER2_PASSWORD -e SEED_REVIEWER1_PASSWORD -e SEED_REVIEWER2_PASSWORD migrate npm run db:seed
```

The seed pairs `requester1` with `reviewer1` and `requester2` with
`reviewer2`. Existing account passwords are preserved on a repeat seed.
Sign in as `requester1`, submit a request, and keep its detail URL. Run
`docker compose restart app`, reload the URL, and check that the same
request and history remain.

## Environment variables

| Variable | Purpose | Secret | Value for local runs |
| --- | --- | --- | --- |
| `POSTGRES_PASSWORD` | Initializes PostgreSQL and supplies the password used in the Compose database URL. | Yes | Set in the local `.env` file or the current shell. |
| `DATABASE_URL` | Connects Prisma and the API to PostgreSQL. | Yes | Compose assembles this value for `app` and `migrate`. Set it separately when running outside Compose. |
| `PUBLIC_ORIGIN` | Sets the browser origin accepted by the API. | No | Compose sets `http://localhost:18080`. |
| `PORT` | Selects the server's listening port. | No | The server defaults to `3000` inside the container. |
| `SEED_REQUESTER1_PASSWORD`, `SEED_REQUESTER2_PASSWORD`, `SEED_REVIEWER1_PASSWORD`, `SEED_REVIEWER2_PASSWORD` | Create the four synthetic accounts. | Yes | Supply them to the seed command from the current shell. |
| `TEST_DATABASE_URL` | Points automated tests at a separate disposable database. | Yes | Set a local PostgreSQL URL whose database name ends in `_test`. |
| `WORKFLOW_BROWSER_CHANNEL` | Selects the browser used by Playwright tests. | No | Set to `msedge` for Edge, or leave unset when using Playwright Chromium. |

## C-03 evidence

The local clean-clone check at commit `8629b96` built the application image,
applied migration `20261107000000_initial_schema`, and ran the application
with a healthy PostgreSQL container. The login page returned HTTP 200.
Record the commit, build and migration output, and both service states from
`docker compose ps` when repeating the check.
