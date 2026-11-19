#!/usr/bin/env bash
# Roll back to an existing team image through the shared Cloud Run update logic.
set -euo pipefail
: "${PROJECT_ID:?Required}" "${REGION:?Required}" "${IMAGE_TAG:?Required}"
[[ "${SEED_DEMO_DATA:-false}" == false ]] || { echo 'Rollback must not seed' >&2; exit 1; }
ROLLBACK=true DRY_RUN="${DRY_RUN:-0}" exec bash "$(dirname -- "${BASH_SOURCE[0]}")/deploy.sh"
