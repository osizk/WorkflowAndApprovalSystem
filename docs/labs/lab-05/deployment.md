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

`.env.example` lists the local runtime, Compose, seed and test variables with
placeholders. Replace them only in the ignored local `.env` file or current
shell. The deployment build receives the reviewed commit SHA as `APP_COMMIT`;
the UI displays its first 12 characters so a grader can identify the release.
The full SHA remains available in the deployment workflow summary.

## C-03 evidence

The local clean-clone check at commit `8629b96` built the application image,
applied migration `20261107000000_initial_schema`, and ran the application
with a healthy PostgreSQL container. The login page returned HTTP 200.
Record the commit, build and migration output, and both service states from
`docker compose ps` when repeating the check.

## Course shared Google Cloud

The course announcement replaces personal Free Trial setup with the shared
project `cpe-se-course-2026`, region `asia-southeast1`, and team `scd928edd`.
The portal and TA provision infrastructure and identity permissions. Do not
create another project, Cloud SQL instance, IAM provider or service account.
Do not run an older teardown script. Request pause/cleanup from the TA.

The portal repository-check page offers an adapted Starter Kit when it cannot
patch the app automatically. That page alone does not show whether resources
are ready or whether GitHub access is configured. Check the group's resources
page for the actual state; only complete setup that it reports missing.

| Resource | Assigned name |
| --- | --- |
| Cloud Run service | `scd928edd` |
| Migration job | `scd928edd-migrate` |
| Artifact Registry repository and image | `scd928edd/scd928edd` |
| Cloud SQL instance | `scd928edd-pg` |
| Database and database user | `scd928edd` |
| Runtime service account | `scd928edd-runner@cpe-se-course-2026.iam.gserviceaccount.com` |
| Database URL secret | `scd928edd-database-url` |

Use the existing database secret; never print or commit its value. It must
contain a Prisma-compatible PostgreSQL URL for the assigned database, with the
Cloud SQL connection matching
`cpe-se-course-2026:asia-southeast1:scd928edd-pg`. If the portal-provided format
is incompatible, report it to the TA rather than exposing credentials in logs.
Both the migration job and service receive `DATABASE_URL` from that secret.
The application listens on port 3000, and the release sets `PUBLIC_ORIGIN` to
the assigned HTTPS service URL. Updates preserve unrelated environment
variables and secret bindings. Scaling is 0–1 instances, 512Mi memory, 1 CPU.

### GitHub configuration

Inspect the values supplied by the portal before changing GitHub settings.
Use these names from the course Kit in the GitHub environment **demo** (or
repository variables where the portal instructs). Do not create another WIF
provider or grant project-wide roles.

| Variable | Expected value/source |
| --- | --- |
| `GCP_PROJECT_ID` | `cpe-se-course-2026` |
| `GCP_REGION` | `asia-southeast1` |
| `WIF_PROVIDER` | Exact provider resource name supplied by the portal |
| `WIF_SERVICE_ACCOUNT` | Exact deploy identity supplied by the portal |
| `SMOKE_LOGIN` | Optional synthetic account login, paired with secret `SMOKE_PASSWORD` |

The old draft's `GCP_WORKLOAD_IDENTITY_PROVIDER`,
`GCP_DEPLOY_SERVICE_ACCOUNT` and `GCP_DEPLOY_ENABLED` are no longer used.
Cloud deployment is restricted to `main`, validates the assigned project and
region, and authenticates without a service-account key. A PR runs offline
checks only. Missing deployment configuration causes validation to fail before
authentication or resource changes.

### Initial migration and demo accounts

The course Kit's `npm run prisma:seed` and `ADMIN_PASSWORD` belong to the
example app. This repository uses `npm run db:migrate` and `npm run db:seed`.
The latter needs four passwords, each at least 12 characters long.

| Pre-created secret slot | Seed environment variable | Synthetic login |
| --- | --- | --- |
| `scd928edd-app-secret-1` | `SEED_REQUESTER1_PASSWORD` | `requester1` |
| `scd928edd-app-secret-2` | `SEED_REQUESTER2_PASSWORD` | `requester2` |
| `scd928edd-app-secret-3` | `SEED_REVIEWER1_PASSWORD` | `reviewer1` |
| `scd928edd-app-secret-4` | `SEED_REVIEWER2_PASSWORD` | `reviewer2` |

Populate these existing slots privately using the course-provided secret tool
(the announcement describes `./kit.sh secrets add N` in the Project Kit).
Coordinate with any existing use of slots 1–4 before assigning them. If a slot
or permission is missing, ask the TA; do not create new secret resources or
change IAM. The scripts reference secret names only and never fetch values.

For the first release with accounts, manually run **Deploy to Google Cloud** from `main`,
leave `image_tag` empty, and select `seed_demo_data`. This runs migrations and
then the idempotent seed before updating the service. A failed migration or
seed aborts deployment. Subsequent pushes migrate without seeding. Existing
account passwords and request history are preserved by repeat seeds.

### Preview and local verification

Run from the repository root in Git Bash or a Linux shell:

```bash
chmod +x deploy/deploy.sh deploy/release.sh
bash -n deploy/deploy.sh deploy/release.sh
DRY_RUN=1 bash deploy/deploy.sh
DRY_RUN=1 bash deploy/deploy.sh --demo
python -B -m unittest discover -s deploy/tests -p 'test_*.py' -v
```

Preview mode calls neither gcloud nor Docker and requires no Cloud account.
Offline tests substitute cloud commands, test migration failure, digest and
traffic verification (including OCI-index child membership and platform),
rollback isolation, team restrictions and cookie logout. They do not prove
access to the real course project.

### Reviewed release and optional manual deployment

Continue PR #46 on `feature/lab5-41-cloud-release`; its target is
`lab5-staging`, the equivalent of `staging` in the course example. Release
Docker/CI through PR #47 first. After the workflow PR passes checks and a
teammate reviews and merges it, open a reviewed release PR from `lab5-staging`
into `main`. The PR author must not merge their own PR.

Each push to `main` runs the application CI and offline deployment checks,
then builds an image tagged with the full commit SHA. The scripts resolve its
immutable digest, update and execute the existing migration job, update the
existing service, and send all traffic to the new ready revision. The serving
image must match the pinned digest. If Cloud Run reports a platform-specific
digest for an OCI index, the script accepts it only when that exact digest is
listed for `linux/amd64` in the pinned index; an unlisted digest or wrong
platform fails. The same full SHA is built into the UI and displayed as a short
release marker. They neither create infrastructure nor change IAM.
A public smoke check verifies `/api/health`, `/api/ready` (a real database
query), `/login`, and anonymous `/api/session` rejection.

Optionally set both `SMOKE_LOGIN` and GitHub secret `SMOKE_PASSWORD` for the
signed-in smoke check. It verifies cookie login, identity, the database-backed
request list, logout and subsequent session rejection. It never prints
credentials. Without those optional settings, required public checks still
run, but the complete requester/reviewer journey must be collected in #42.

A manual alternative requires gcloud, Docker, Python and a clean reviewed
`main` checkout. Use your own already-authorized Google account:

```bash
gcloud auth login
gcloud config set project cpe-se-course-2026
DRY_RUN=0 bash deploy/deploy.sh --demo
python3 -B deploy/smoke_test.py https://YOUR-ASSIGNED-SERVICE.run.app
```

On Windows Git Bash where only `python` is available, set `PYTHON=python` for
the deploy command and use `python` for smoke checks. Do not share accounts.
The manual script refuses a feature branch, a dirty checkout or a
tag that differs from HEAD. GitHub Actions also verifies its main event SHA.

### Rollback and evidence

For rollback, manually run **Deploy to Google Cloud** from `main` with `image_tag` set
to a full commit SHA whose image already exists. Leave seed disabled. The
workflow skips application tests/build and the release skips migration/seed;
it changes the service image and traffic, verifies the digest, and runs smoke
checks. It does not roll back schema or data. Choose a schema-compatible image.

For #40 record the first working URL, real database readiness, main commit,
image digest and serving revision. For #41/C-06 record the staging PR, release
PR, Actions run and visible change, and compare the serving revision with the
same commit's image digest. The Actions summary records these release values.
For #42 preserve the same request ID, status and history through restart and
redeploy, plus a requester/reviewer journey and a rejected forbidden action.
Preview/offline results cannot substitute for these live checks.

### Validation for the Starter Kit adaptation

Local checks on 19 November 2026 passed: 17 offline release/smoke tests;
16 application tests, 0 failures and 0 skipped, using isolated PostgreSQL 16
and the installed Microsoft Edge browser; TypeScript/Vite build; Bash syntax;
workflow actionlint; and a Docker image build. The image applied the migration,
seeded synthetic accounts in a separate temporary database, and passed the
real HTTP smoke checks including cookie login, request listing and logout.
On 20 November 2026, the updated offline release/smoke suite passed 25 tests
with no failures or skips, and both deployment scripts passed Bash syntax
checking. These are local results. Course Portal readiness, WIF authentication
and a live Cloud Run release remain unverified until the real deployment is
run.
