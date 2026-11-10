#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
SANDBOX_USER=$(id -un)
SANDBOX_HOME=${SANDBOX_HOME:-/home/$SANDBOX_USER}
NPM_CACHE=${SANDBOX_NPM_CACHE:-$HOME/.npm-sandbox}
mkdir -p "$NPM_CACHE"

NET=0
RO=0
TTY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --net) NET=1; shift ;;
    --ro) RO=1; shift ;;
    --tty) TTY=1; shift ;;
    --) shift; break ;;
    *) break ;;
  esac
done
if [ $# -eq 0 ]; then
  echo "usage: $0 [--net] [--ro] [--tty] -- command ..." >&2
  exit 2
fi

mounts=(
  --ro-bind /nix /nix
  --ro-bind /etc /etc
  --ro-bind-try /run/current-system /run/current-system
  --ro-bind-try /usr /usr
  --ro-bind-try /bin /bin
  --ro-bind-try /lib /lib
  --ro-bind-try /lib64 /lib64
  --dev /dev
  --proc /proc
  --tmpfs /tmp
  --tmpfs /home
  --bind "$NPM_CACHE" "$SANDBOX_HOME/.npm"
  --clearenv
  --setenv HOME "$SANDBOX_HOME"
  --setenv PATH "${SANDBOX_PATH:-/etc/profiles/per-user/$SANDBOX_USER/bin:/run/current-system/sw/bin:/usr/bin:/bin}"
  --setenv TERM "${TERM:-dumb}"
  --setenv LANG "${LANG:-C.UTF-8}"
  --setenv TMPDIR /tmp
  --setenv npm_config_cache "$SANDBOX_HOME/.npm"
  --setenv CI 1
  --setenv NEXT_TELEMETRY_DISABLED 1
)

if [ "$RO" = 1 ]; then
  mounts+=(--ro-bind "$PROJECT_DIR" /workspace)
else
  mounts+=(--bind "$PROJECT_DIR" /workspace)
fi

mounts+=(--chdir /workspace --unshare-all --cap-drop ALL --die-with-parent)
if [ "$NET" = 1 ]; then
  mounts+=(--share-net)
fi
if [ "$TTY" = 0 ]; then
  mounts+=(--new-session)
fi

exec bwrap "${mounts[@]}" -- "$@"
