#!/usr/bin/env bash
# Adapted from the course Starter Kit for team scd928edd.
# Build, migrate and deploy reviewed main using existing team resources.
set -euo pipefail
DRY_RUN="${DRY_RUN:-1}"
PROJECT_ID="${PROJECT_ID:-cpe-se-course-2026}"
REGION="${REGION:-asia-southeast1}"
ROLLBACK="${ROLLBACK:-false}"
SEED_DEMO_DATA=false
SERVICE_NAME="${SERVICE_NAME:-scd928edd}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-scd928edd-migrate}"
for arg in "$@"; do
  case "$arg" in
    --demo) SEED_DEMO_DATA=true ;;
    *) echo 'Usage: bash deploy/deploy.sh [--demo]' >&2; exit 1 ;;
  esac
done
[[ "$DRY_RUN" == 0 || "$DRY_RUN" == 1 ]] || { echo 'DRY_RUN must be 0 or 1' >&2; exit 1; }
[[ "$PROJECT_ID" == cpe-se-course-2026 && "$REGION" == asia-southeast1 ]] || { echo 'Use the assigned course project and region' >&2; exit 1; }
[[ -f Dockerfile && -f package.json ]] || { echo 'Run from the repository root' >&2; exit 1; }
[[ "$SERVICE_NAME" == scd928edd && "$MIGRATE_JOB_NAME" == scd928edd-migrate ]] || { echo 'Use assigned team resources only' >&2; exit 1; }
[[ "$ROLLBACK" == true || "$ROLLBACK" == false ]] || { echo 'Invalid rollback mode' >&2; exit 1; }
[[ "$ROLLBACK" != true || "$SEED_DEMO_DATA" != true ]] || { echo 'Rollback must not seed' >&2; exit 1; }
if [[ "$ROLLBACK" == true ]]; then
  : "${IMAGE_TAG:?Required for rollback}"
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
run_cmd() {
  if [[ "$DRY_RUN" == 1 ]]; then printf '[DRY_RUN] '; fi
  printf '%q ' "$@"; printf '\n'
  if [[ "$DRY_RUN" == 0 ]]; then "$@"; fi
}
PREFIX="$REGION-docker.pkg.dev/$PROJECT_ID/scd928edd/scd928edd"
IMAGE="$PREFIX:$IMAGE_TAG"

# 9. Build and push the reviewed commit.
if [[ "$ROLLBACK" == false ]]; then
  if [[ "$DRY_RUN" == 0 ]]; then
    gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" >/dev/null
    gcloud run jobs describe "$MIGRATE_JOB_NAME" --project "$PROJECT_ID" --region "$REGION" >/dev/null
  fi
  run_cmd gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
  run_cmd docker build --platform linux/amd64 --tag "$IMAGE" .
  run_cmd docker push "$IMAGE"
fi

if [[ "$DRY_RUN" == 1 ]]; then
  DIGEST_IMAGE="$PREFIX@sha256:$(printf '%064d' 0)"
  SERVICE_URL=https://scd928edd-preview.asia-southeast1.run.app
else
  DIGEST_IMAGE="$(gcloud artifacts docker images describe "$IMAGE" --project "$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
fi
[[ "$DIGEST_IMAGE" == "$PREFIX@sha256:"* && "${DIGEST_IMAGE##*@sha256:}" =~ ^[a-f0-9]{64}$ ]] || { echo 'Image digest not found in the team registry' >&2; exit 1; }
[[ "$SERVICE_URL" =~ ^https://[a-z0-9-]+(\.[a-z0-9-]+)*\.run\.app$ ]] || { echo 'Expected the assigned public Cloud Run URL' >&2; exit 1; }
# 10. Apply migrations and optionally seed demo accounts.
if [[ "$ROLLBACK" == false ]]; then
  MIGRATION='npm run db:migrate'
  JOB_SECRETS='DATABASE_URL=scd928edd-database-url:latest'
  if [[ "$SEED_DEMO_DATA" == true ]]; then
    # Populate these four pre-created secret slots privately before the first seed.
    # Values never pass through GitHub variables, command arguments or logs.
    JOB_SECRETS+=',SEED_REQUESTER1_PASSWORD=scd928edd-app-secret-1:latest'
    JOB_SECRETS+=',SEED_REQUESTER2_PASSWORD=scd928edd-app-secret-2:latest'
    JOB_SECRETS+=',SEED_REVIEWER1_PASSWORD=scd928edd-app-secret-3:latest'
    JOB_SECRETS+=',SEED_REVIEWER2_PASSWORD=scd928edd-app-secret-4:latest'
    MIGRATION+=' && npm run db:seed'
  fi
  run_cmd gcloud run jobs update "$MIGRATE_JOB_NAME" \
    --image "$DIGEST_IMAGE" --project "$PROJECT_ID" --region "$REGION" \
    --service-account "scd928edd-runner@$PROJECT_ID.iam.gserviceaccount.com" \
    --add-cloudsql-instances "$PROJECT_ID:$REGION:scd928edd-pg" \
    --update-secrets "$JOB_SECRETS" --update-env-vars 'NODE_ENV=production,TZ=Asia/Bangkok' \
    --command sh --args "-c,$MIGRATION" --max-retries 0 --task-timeout 300s --quiet
  if ! run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" --wait --project "$PROJECT_ID" --region "$REGION" --quiet; then
    echo 'Migration/seed failed. Service deployment stopped.' >&2
    exit 1
  fi
else
  echo 'Rollback: skip build, migration and seed.'
fi
# 11. Update Cloud Run while preserving portal environment variables and secrets.
# Rollback only changes the image and traffic, retaining current configuration.
if [[ "$ROLLBACK" == false ]]; then
  run_cmd gcloud run services update "$SERVICE_NAME" --image "$DIGEST_IMAGE" \
    --project "$PROJECT_ID" --region "$REGION" \
    --service-account "scd928edd-runner@$PROJECT_ID.iam.gserviceaccount.com" \
    --add-cloudsql-instances "$PROJECT_ID:$REGION:scd928edd-pg" \
    --update-secrets 'DATABASE_URL=scd928edd-database-url:latest' \
    --update-env-vars "NODE_ENV=production,TZ=Asia/Bangkok,PUBLIC_ORIGIN=$SERVICE_URL" \
    --port 3000 --min-instances 0 --max-instances 1 --memory 512Mi --cpu 1 --quiet
else
  run_cmd gcloud run services update "$SERVICE_NAME" --image "$DIGEST_IMAGE" --project "$PROJECT_ID" --region "$REGION" --quiet
fi
run_cmd gcloud run services update-traffic "$SERVICE_NAME" --to-latest --project "$PROJECT_ID" --region "$REGION" --quiet
if [[ "$DRY_RUN" == 1 ]]; then
  echo 'Preview completed. No Google Cloud or Docker commands were executed.'
  exit 0
fi
revision="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.latestReadyRevisionName)')"
serving="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format=json | "${PYTHON:-python3}" -c 'import json,sys; s=json.load(sys.stdin); t=s["status"]["traffic"]; print(next((x.get("revisionName", "") for x in t if x.get("percent")==100), ""))')"
[[ -n "$revision" && "$serving" == "$revision" ]] || { echo 'Latest ready revision is not serving all traffic' >&2; exit 1; }
resolved="$(gcloud run revisions describe "$revision" --project "$PROJECT_ID" --region "$REGION" --format='value(status.imageDigest)')"
[[ "${resolved##*@}" == "${DIGEST_IMAGE##*@}" ]] || { echo 'Serving image differs from the release image' >&2; exit 1; }
printf 'Commit: %s\nImage: %s\nRevision: %s\nService URL: %s\n' "$IMAGE_TAG" "$DIGEST_IMAGE" "$revision" "$SERVICE_URL"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'SERVICE_URL=%s\nDEPLOYED_IMAGE=%s\nDEPLOYED_REVISION=%s\n' "$SERVICE_URL" "$DIGEST_IMAGE" "$revision" >> "$GITHUB_ENV"
fi
