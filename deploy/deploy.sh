#!/usr/bin/env bash
# Adapted from the course Starter Kit for team scd928edd.
# Build reviewed main, then update the team's existing resources only.
set -euo pipefail
DRY_RUN="${DRY_RUN:-1}"
PROJECT_ID="${PROJECT_ID:-cpe-se-course-2026}"
REGION="${REGION:-asia-southeast1}"
SEED_DEMO_DATA=false
for arg in "$@"; do
  case "$arg" in
    --demo) SEED_DEMO_DATA=true ;;
    *) echo 'Usage: bash deploy/deploy.sh [--demo]' >&2; exit 1 ;;
  esac
done
[[ "$DRY_RUN" == 0 || "$DRY_RUN" == 1 ]] || { echo 'DRY_RUN must be 0 or 1' >&2; exit 1; }
[[ "$PROJECT_ID" == cpe-se-course-2026 && "$REGION" == asia-southeast1 ]] || { echo 'Use the assigned course project and region' >&2; exit 1; }
[[ -f Dockerfile && -f package.json && -f deploy/release.sh ]] || { echo 'Run from the repository root' >&2; exit 1; }
if [[ "$DRY_RUN" == 1 ]]; then
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
# Fail before building if the portal has not prepared these exact resources.
if [[ "$DRY_RUN" == 0 ]]; then
  gcloud run services describe scd928edd --project "$PROJECT_ID" --region "$REGION" >/dev/null
  gcloud run jobs describe scd928edd-migrate --project "$PROJECT_ID" --region "$REGION" >/dev/null
fi
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/scd928edd/scd928edd:$IMAGE_TAG"
run_cmd gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
run_cmd docker build --platform linux/amd64 --tag "$IMAGE" .
run_cmd docker push "$IMAGE"
export DRY_RUN PROJECT_ID REGION IMAGE_TAG SEED_DEMO_DATA
ROLLBACK=false bash deploy/release.sh
