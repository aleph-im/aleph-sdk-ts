#!/usr/bin/env bash
set -euo pipefail
url="${1:?usage: wait-for-heph.sh <url>}"
for _ in $(seq 1 60); do
  if curl -sf "$url/api/v0/messages.json" >/dev/null 2>&1; then exit 0; fi
  sleep 0.5
done
echo "heph did not come up at $url within 30s" >&2
exit 1
