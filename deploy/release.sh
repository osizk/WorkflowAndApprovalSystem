#!/usr/bin/env bash
# Deploy an existing team image, or roll back without migrating.
set -euo pipefail
: "${PROJECT_ID:?Required}" "${REGION:?Required}" "${IMAGE_TAG:?Required}"
args=(--existing-image)
case "${SEED_DEMO_DATA:-false}" in
  true) args+=(--demo) ;;
  false) ;;
  *) echo 'Invalid seed mode' >&2; exit 1 ;;
esac
DRY_RUN="${DRY_RUN:-0}" exec bash "$(dirname -- "${BASH_SOURCE[0]}")/deploy.sh" "${args[@]}"
