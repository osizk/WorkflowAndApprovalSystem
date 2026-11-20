#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# WorkflowAndApprovalSystem — reviewed Cloud Run release
# ==============================================================================
# Usage:
#   ./deploy/release.sh [--demo]
#
# Environment Variables (Optional):
#   PROJECT_ID   assigned course project (default: cpe-se-course-2026)
#   REGION       GCP Region (default: asia-southeast1)
#   DRY_RUN      Set DRY_RUN=1 to print all gcloud commands without executing
#
# WHAT THIS SCRIPT DOES  (one-time / manual first setup; safe to re-run)
#   Portal/TA prepare steps 1–8. This script only updates existing resources:
#   9 build image        10 migrate + optional demo seed        11 service update
#   GitHub Actions invokes this script for normal deployments; release.sh
#   reuses steps 10–11 for existing-image releases and explicit rollback.
#
# ⭐ IMPORTANT
#   - Idempotent: existing resources/secrets are reused, never overwritten
#     (a re-run does not replace credentials).
#   - Password values stay in Secret Manager. Only secret names are used here;
#     run_cmd retains the course password-redaction behavior.
#   - Preview first with:  DRY_RUN=1 ./deploy/deploy.sh   (no gcloud calls)
#   - Run from the REPO ROOT (step 9 builds the root Dockerfile).
#   - Offline checks: python -B -m unittest discover -s deploy/tests -v
#
# REFERENCES
#   - gcloud run deploy : https://cloud.google.com/sdk/gcloud/reference/run/deploy
#   - Cloud Run jobs    : https://cloud.google.com/run/docs/create-jobs
#   - Cloud SQL + Run   : https://cloud.google.com/sql/docs/postgres/connect-run
#   - Secret Manager    : https://cloud.google.com/secret-manager/docs
#   - Artifact Registry : https://cloud.google.com/artifact-registry/docs/docker
#
# ⭐ CHANGE ME — groups using another tech stack must review (marked below):
#   # CHANGE ME: resource names (REPO_NAME, SQL_INSTANCE, SERVICE_NAME, ...)
#   # CHANGE ME: database engine/version (steps 3, 4, 6)
#   # CHANGE ME: migrate/seed command of the Cloud Run job (step 10)
#   # CHANGE ME: port / memory / scaling flags (step 11)
# ==============================================================================

# ------------------------------------------------------------------------------
# Settings & argument parsing
# ------------------------------------------------------------------------------
DRY_RUN="${DRY_RUN:-1}"
# CHANGE ME: default region if your group uses another one.
REGION="${REGION:-asia-southeast1}"
SEED_DEMO_DATA="${SEED_DEMO_DATA:-false}"
ROLLBACK="${ROLLBACK:-false}"
USE_EXISTING_IMAGE=false

for arg in "$@"; do
  case "$arg" in
    --demo)
      SEED_DEMO_DATA="true"
      ;;
    --existing-image)
      USE_EXISTING_IMAGE=true
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: $0 [--demo] [--existing-image]" >&2
      exit 1
      ;;
  esac
done

# Helper: prints the command (DRY_RUN=1) or prints then executes it.
# ⭐ IMPORTANT: --password=... is redacted in the log; keep this behaviour.
run_cmd() {
  # Log the command without exposing generated database credentials.
  local arg
  if [ "$DRY_RUN" = "1" ]; then
    printf '[DRY_RUN] '
  else
    printf '+ '
  fi
  for arg in "$@"; do
    case "$arg" in
      --password=*) printf '%s ' '--password=<REDACTED>' ;;
      *) printf '%q ' "$arg" ;;
    esac
  done
  printf '\n'
  if [ "$DRY_RUN" != "1" ]; then
    "$@"
  fi
}

[[ "$DRY_RUN" == 0 || "$DRY_RUN" == 1 ]] || { echo 'DRY_RUN must be 0 or 1' >&2; exit 1; }
[[ -f Dockerfile && -f package.json ]] || { echo 'Run from the repository root' >&2; exit 1; }
[[ "${SERVICE_NAME:-scd928edd}" == scd928edd && "${MIGRATE_JOB_NAME:-scd928edd-migrate}" == scd928edd-migrate ]] || { echo 'Use assigned team resources only' >&2; exit 1; }
[[ "$ROLLBACK" == true || "$ROLLBACK" == false ]] || { echo 'Invalid rollback mode' >&2; exit 1; }
[[ "$ROLLBACK" != true || "$SEED_DEMO_DATA" != true ]] || { echo 'Rollback must not seed' >&2; exit 1; }

# Resolve the assigned GCP project without discovering or creating a project.
# Shared course project: no project discovery or project IAM changes.
PROJECT_ID="${PROJECT_ID:-cpe-se-course-2026}"
[[ "$PROJECT_ID" == "cpe-se-course-2026" ]] || { echo 'Wrong course project' >&2; exit 1; }
REGION="${REGION:-asia-southeast1}"
[[ "$REGION" == "asia-southeast1" ]] || { echo 'Wrong assigned region' >&2; exit 1; }
REPO_NAME="scd928edd"
SQL_INSTANCE="scd928edd-pg"
DB_NAME="scd928edd"
DB_USER="scd928edd"
SERVICE_NAME="scd928edd"
MIGRATE_JOB_NAME="scd928edd-migrate"
SA_NAME="scd928edd-runner"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SQL_CONN_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
if [[ "$ROLLBACK" == true || "$USE_EXISTING_IMAGE" == true ]]; then
  : "${IMAGE_TAG:?Required when deploying an existing image}"
elif [[ "$DRY_RUN" == 1 ]]; then
  IMAGE_TAG="${IMAGE_TAG:-0000000000000000000000000000000000000000}"
else
  head="$(git rev-parse HEAD)"
  branch="$(git branch --show-current)"
  [[ "$branch" == main || ( "${GITHUB_REF:-}" == refs/heads/main && "${GITHUB_SHA:-}" == "$head" ) ]] || { echo 'Deploy reviewed main only' >&2; exit 1; }
  [[ -z "$(git status --porcelain --untracked-files=normal)" ]] || { echo 'Use a clean reviewed checkout' >&2; exit 1; }
  IMAGE_TAG="${IMAGE_TAG:-$head}"
  [[ "$IMAGE_TAG" == "$head" ]] || { echo 'IMAGE_TAG must match HEAD' >&2; exit 1; }
fi
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Use a full commit SHA' >&2; exit 1; }
IMAGE_PREFIX="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"

# Secret Manager secret names (values are never stored in this repo).
SECRET_DB_URL="scd928edd-database-url"
SECRET_ADMIN_PASS="scd928edd-admin-password"
SECRET_DEMO_PASS="scd928edd-demo-password"

# The Kit example admin/demo secret names above are retained as course
# metadata only. This app seeds four requester/reviewer accounts instead.
SECRET_REQUESTER1_PASS="scd928edd-app-secret-1"
SECRET_REQUESTER2_PASS="scd928edd-app-secret-2"
SECRET_REVIEWER1_PASS="scd928edd-app-secret-3"
SECRET_REVIEWER2_PASS="scd928edd-app-secret-4"

echo "=================================================================="
echo "Workflow and Approval System Cloud Run Deployment"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Demo    : ${SEED_DEMO_DATA}"
echo "Dry Run : ${DRY_RUN}"
echo "Database: ${DB_NAME} (user ${DB_USER})"
echo "=================================================================="

# ==============================================================================
# Portal/TA pre-provisions infrastructure and public service IAM (Guide 5.3 steps 1–8, 5.4).
# These names must exist. Never create or modify project-level IAM here.
MIGRATION="npm run db:migrate"
JOB_SECRETS="DATABASE_URL=${SECRET_DB_URL}:latest"
if [ "$SEED_DEMO_DATA" = "true" ]; then
  JOB_SECRETS="${JOB_SECRETS},SEED_REQUESTER1_PASSWORD=${SECRET_REQUESTER1_PASS}:latest,SEED_REQUESTER2_PASSWORD=${SECRET_REQUESTER2_PASS}:latest,SEED_REVIEWER1_PASSWORD=${SECRET_REVIEWER1_PASS}:latest,SEED_REVIEWER2_PASSWORD=${SECRET_REVIEWER2_PASS}:latest"
  MIGRATION="npm run db:migrate && npm run db:seed"
fi
if [[ "$DRY_RUN" == 0 && "$ROLLBACK" == false && "$USE_EXISTING_IMAGE" == false ]]; then
  gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" >/dev/null
  gcloud run jobs describe "$MIGRATE_JOB_NAME" --project "$PROJECT_ID" --region "$REGION" >/dev/null
fi
# 9. Build & Push Unified Container Image
#    Builds the root Dockerfile (run this script from the repo root).
#    Use the full reviewed commit SHA for the image tag.
# ==============================================================================
if [[ "$ROLLBACK" == false && "$USE_EXISTING_IMAGE" == false ]]; then
  run_cmd gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
  run_cmd docker build --platform linux/amd64 --build-arg "APP_COMMIT=$IMAGE_TAG" --tag "$IMAGE_URI" .
  run_cmd docker push "$IMAGE_URI"
fi
if [ "$DRY_RUN" != "1" ]; then
  IMAGE_URI="$(gcloud artifacts docker images describe "$IMAGE_URI" --project "$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
else
  IMAGE_URI="$IMAGE_PREFIX@sha256:$(printf '%064d' 0)"
  SERVICE_URL=https://scd928edd-preview.asia-southeast1.run.app
fi
[[ "$IMAGE_URI" == "$IMAGE_PREFIX@sha256:"* && "${IMAGE_URI##*@sha256:}" =~ ^[a-f0-9]{64}$ ]] || { echo 'Image digest not found in the team registry' >&2; exit 1; }
[[ "$SERVICE_URL" =~ ^https://[a-z0-9-]+(\.[a-z0-9-]+)*\.run\.app$ ]] || { echo 'Expected the assigned public Cloud Run URL' >&2; exit 1; }

# ==============================================================================
# 10. Create/Update & Execute Cloud Run Job for Migration + Non-destructive Seed
#     ⭐ IMPORTANT: if this job fails the script stops BEFORE deploying the
#        service, so a broken migration never reaches users.
#     CHANGE ME: `--args` (npm run db:migrate, optionally npm run db:seed) is
#        Prisma/npm specific — use your stack's migrate/seed command.
#     deploy.yml / release.sh later re-run this same job (name: scd928edd-migrate).
# ==============================================================================
if [[ "$ROLLBACK" == false ]]; then
run_cmd gcloud run jobs update "$MIGRATE_JOB_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --add-cloudsql-instances "$SQL_CONN_NAME" \
  --update-secrets "$JOB_SECRETS" \
  --update-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
  --command "sh" \
  --args "-c,$MIGRATION" \
  --max-retries 0 \
  --task-timeout 300s \
  --project "$PROJECT_ID"

if ! run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" \
  --region "$REGION" \
  --wait \
  --project "$PROJECT_ID"; then
  printf '%s\n' 'Migration/seed failed. Service deployment stopped.' >&2
  printf '%s\n' "View job logs with:" >&2
  printf '%s\n' "  gcloud logging read \"resource.type=cloud_run_job AND resource.labels.job_name=${MIGRATE_JOB_NAME}\" --project \"${PROJECT_ID}\" --limit 50 --format=\"value(textPayload)\"" >&2
  exit 1
fi

else
  echo 'Rollback: skip build, migration and seed.'
fi

# ==============================================================================
# 11. Deploy Cloud Run Service
#     CHANGE ME: --port must equal the port in the Dockerfile (3000); tune
#                --memory / --cpu / --max-instances for your app.
#     Portal/TA own public access. This script never changes IAM.
# ==============================================================================
if [[ "$ROLLBACK" == false ]]; then
run_cmd gcloud run services update "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --add-cloudsql-instances "$SQL_CONN_NAME" \
  --update-secrets "DATABASE_URL=${SECRET_DB_URL}:latest" \
  --update-env-vars "NODE_ENV=production,TZ=Asia/Bangkok,PUBLIC_ORIGIN=$SERVICE_URL" \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1 \
  --port 3000 \
  --project "$PROJECT_ID"

else
  run_cmd gcloud run services update "$SERVICE_NAME" --image "$IMAGE_URI" --project "$PROJECT_ID" --region "$REGION" --quiet
fi
run_cmd gcloud run services update-traffic "$SERVICE_NAME" --to-latest --project "$PROJECT_ID" --region "$REGION" --quiet
DIGEST_IMAGE="$IMAGE_URI"
if [[ "$DRY_RUN" == 1 ]]; then
  echo 'Preview completed. No Google Cloud or Docker commands were executed.'
  exit 0
fi
revision="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.latestReadyRevisionName)')"
serving="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format=json | "${PYTHON:-python3}" -c 'import json,sys; s=json.load(sys.stdin); t=s["status"]["traffic"]; print(next((x.get("revisionName", "") for x in t if x.get("percent")==100), ""))')"
[[ -n "$revision" && "$serving" == "$revision" ]] || { echo 'Latest ready revision is not serving all traffic' >&2; exit 1; }
resolved="$(gcloud run revisions describe "$revision" --project "$PROJECT_ID" --region "$REGION" --format='value(status.imageDigest)')"
resolved_digest="${resolved##*@}"
expected_digest="${DIGEST_IMAGE##*@}"
[[ "$resolved" == "$IMAGE_PREFIX@sha256:"* && "$resolved_digest" =~ ^sha256:[a-f0-9]{64}$ ]] || { echo 'Cloud Run returned an invalid serving image digest' >&2; exit 1; }
if [[ "$resolved_digest" != "$expected_digest" ]]; then
  # Cloud Run can report the platform-specific child digest when the pushed
  # linux/amd64 image was published as an OCI index (for example, with a
  # BuildKit attestation). Accept it only when the exact digest is the amd64
  # child of the immutable index we deployed.
  if ! manifest="$(docker buildx imagetools inspect --raw "$DIGEST_IMAGE")"; then
    echo 'Could not verify the released image manifest' >&2
    exit 1
  fi
  if ! printf '%s' "$manifest" | "${PYTHON:-python3}" -c '
import json, sys

try:
    index = json.load(sys.stdin)
except (json.JSONDecodeError, TypeError):
    sys.exit(1)

if not isinstance(index, dict):
    sys.exit(1)

expected = sys.argv[1]
for descriptor in index.get("manifests", []):
    if not isinstance(descriptor, dict):
        continue
    platform = descriptor.get("platform") or {}
    if (descriptor.get("digest") == expected
            and platform.get("os") == "linux"
            and platform.get("architecture") == "amd64"):
        sys.exit(0)
sys.exit(1)
' "$resolved_digest"; then
    echo 'Serving image differs from the release image' >&2
    exit 1
  fi
fi
printf 'Commit: %s\nImage: %s\nRevision: %s\nService URL: %s\n' "$IMAGE_TAG" "$DIGEST_IMAGE" "$revision" "$SERVICE_URL"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'SERVICE_URL=%s\nDEPLOYED_IMAGE=%s\nDEPLOYED_REVISION=%s\n' "$SERVICE_URL" "$DIGEST_IMAGE" "$revision" >> "$GITHUB_ENV"
fi
