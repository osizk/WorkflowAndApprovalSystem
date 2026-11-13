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

## Google Cloud release

The first deployment in Issue #40 creates the Artifact Registry repository,
Cloud Run service and migration job, and connects the service and job to Cloud
SQL. Configure the service's public URL as `PUBLIC_ORIGIN`. Configure both
the service and migration job to receive `DATABASE_URL` from Secret Manager.
Set the migration job command to `npm run db:migrate`. Seed synthetic demo
accounts during initial setup using the team's private seed configuration.

Before enabling the release workflow, configure a Google Cloud Workload
Identity Federation provider to trust this GitHub repository on
`refs/heads/main` and allow its deploy service account to authenticate. That
account needs permission to push the image and update the existing Cloud Run
service and migration job, direct service traffic to the new revision, run the
job, and act as the Cloud Run runtime identities where required. The runtime
identities need access to Cloud SQL and the database secret they use.

Set these GitHub Actions repository variables from the provisioned resources.

| Variable | Value |
| --- | --- |
| `GCP_PROJECT_ID` | Shared Google Cloud project ID |
| `GCP_REGION` | Region containing Artifact Registry and Cloud Run |
| `GCP_ARTIFACT_REPOSITORY` | Docker repository name in Artifact Registry |
| `GCP_RUN_SERVICE` | Existing public Cloud Run service name |
| `GCP_MIGRATION_JOB` | Existing Cloud Run migration job name |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full resource name of the Workload Identity Federation provider |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Deploy service account email |
| `GCP_DEPLOY_ENABLED` | Set to `true` once the resources and access are verified |

Merge a teammate-reviewed feature PR into `lab5-staging`. Open and review a
release PR from `lab5-staging` into `main`, then merge it after the required
check passes. The workflow verifies the resulting `main` commit, publishes the
image tagged with its commit SHA, and runs migrations using the image digest.
After migration succeeds, it updates the existing service and checks that the
new revision receives all traffic, serves the expected digest, and responds at
`/login`. The workflow can also be dispatched from `main` in Actions.

For C-06, record the staging PR, release PR, Actions run, and Cloud Run revision.
The Actions run summary lists the commit, image digest, serving revision, and
public URL. Compare the summary with the revision shown in Cloud Run.
