#!/usr/bin/env bash
# Static serve for the Seller Agent Console prototype (no build step).
set -euo pipefail
cd "$(dirname "$0")/prototype"
exec python3 -m http.server "${PORT:-8931}"
