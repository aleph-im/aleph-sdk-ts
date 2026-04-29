#!/usr/bin/env bash
set -euo pipefail
url="${1:?usage: check-heph.sh <url>}"
if ! curl -sf "$url/api/v0/messages.json" >/dev/null 2>&1; then
  echo "heph is not reachable at $url. Run 'just start-dev-env' first." >&2
  exit 1
fi
