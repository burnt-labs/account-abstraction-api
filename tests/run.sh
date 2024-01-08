#!/usr/bin/env bash
set -euxo pipefail

k6 run \
  -e STYTCH_PROJECT_ID="${STYTCH_PROJECT_ID}" \
  -e STYTCH_SECRET="${STYTCH_SECRET}" \
  -e STYTCH_API_URL="${STYTCH_API_URL}" \
  -e STYTCH_PASSWD="${STYTCH_PASSWD}" \
  -e XION_AA_API_URL="${XION_AA_API_URL}" \
  ./aa-api-integration.js
