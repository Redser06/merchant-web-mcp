#!/usr/bin/env bash
# Rebuild with a sentinel secret in the environment and fail if it, or the
# HMAC env var names, show up anywhere under dist/.
set -euo pipefail

sentinel="${BUNDLE_LEAK_SENTINEL:-}"
if [ -z "$sentinel" ]; then
  echo "BUNDLE_LEAK_SENTINEL is required"
  exit 1
fi

export MERCHANT_HMAC_SECRET="$sentinel"
export VITE_MERCHANT_HMAC_SECRET="$sentinel"

rm -rf dist
bun run build

fail=0
check() {
  local needle="$1"
  if grep -R -a -q -F -- "$needle" dist; then
    echo "Bundle leak: found ${needle} in dist/"
    grep -R -a -l -F -- "$needle" dist
    fail=1
  fi
}

check "$sentinel"
check "VITE_MERCHANT_HMAC_SECRET"
check "MERCHANT_HMAC_SECRET"

exit "$fail"
