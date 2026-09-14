#!/usr/bin/env bash
# ==============================================================================
# Homelab Cockpit / Git Project Out-of-Process Redeployer
# ==============================================================================
# Designed to run OUTSIDE the container process tree so that self-recreation of
# the homelab-cockpit Docker container never terminates the deployment mid-stream.
#
# Usage:
#   1. Manual direct redeploy (Homelab Dashboard):
#      bash /root/homelab-dashboard/scripts/homelab-redeploy.sh
#      or: bash /root/homelab-redeploy.sh
#
#   2. Manual direct redeploy of another project:
#      bash /root/homelab-redeploy.sh homelab-idp
#
#   3. Daemon / Watcher Mode (watches data/.redeploy-trigger from dashboard clicks):
#      bash /root/homelab-redeploy.sh --watch
#      or run via systemd: systemctl start homelab-redeploy
# ==============================================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOMELAB_ROOT="${HOMELAB_ROOT:-}"

# Auto-detect homelab repository root
if [ -z "$HOMELAB_ROOT" ]; then
  if [ -f "$SCRIPT_DIR/../docker-compose.yml" ]; then
    HOMELAB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  elif [ -d "/root/homelab-dashboard" ]; then
    HOMELAB_ROOT="/root/homelab-dashboard"
  elif [ -d "/opt/homelab-dashboard" ]; then
    HOMELAB_ROOT="/opt/homelab-dashboard"
  elif [ -d "/projects/homelab-dashboard" ]; then
    HOMELAB_ROOT="/projects/homelab-dashboard"
  else
    HOMELAB_ROOT="$(pwd)"
  fi
fi

DATA_DIR="${DATA_DIR:-$HOMELAB_ROOT/data}"
mkdir -p "$DATA_DIR"

LOG_FILE="${LOG_FILE:-$DATA_DIR/redeploy.log}"
STATUS_FILE="${STATUS_FILE:-$DATA_DIR/redeploy-status.json}"
TRIGGER_FILE="${TRIGGER_FILE:-$DATA_DIR/.redeploy-trigger}"
PROJECTS_ROOT="${GIT_PROJECTS_ROOT:-/opt/homelab-projects}"
if [ ! -d "$PROJECTS_ROOT" ] && [ -d "/projects" ]; then
  PROJECTS_ROOT="/projects"
fi

timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

log() {
  local msg="[$(timestamp)] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

set_status() {
  local status="$1"
  local project="$2"
  local sha="${3:-}"
  local error="${4:-}"
  local now
  now=$(date +%s%3N 2>/dev/null || date +%s000)

  cat <<EOF > "$STATUS_FILE"
{
  "status": "$status",
  "project": "$project",
  "sha": "$sha",
  "error": "$error",
  "timestamp": $now
}
EOF
}

auto_create_network() {
  local net_name="${1:-homelab-net}"
  if ! docker network inspect "$net_name" >/dev/null 2>&1; then
    log "⚠ External network '$net_name' not found. Creating it now..."
    if docker network create "$net_name" >> "$LOG_FILE" 2>&1; then
      log "✔ Docker network '$net_name' created successfully."
    else
      log "❌ Failed to create docker network '$net_name'."
    fi
  fi
}

do_redeploy() {
  local target="${1:-homelab-dashboard}"
  target="$(echo "$target" | tr -d '\r\n ')"
  [ -z "$target" ] && target="homelab-dashboard"

  log "=================================================================="
  log "🚀 Starting Redeployment for: $target"
  log "=================================================================="
  set_status "updating" "$target" "" ""

  local target_dir=""
  local is_self=0

  if [ "$target" = "homelab-dashboard" ] || [ "$target" = "homelab-cockpit" ]; then
    target_dir="$HOMELAB_ROOT"
    is_self=1
  else
    if [ -d "$PROJECTS_ROOT/$target" ]; then
      target_dir="$PROJECTS_ROOT/$target"
    elif [ -d "/root/$target" ]; then
      target_dir="/root/$target"
    else
      log "❌ Project directory not found for '$target' (checked in $PROJECTS_ROOT and /root)."
      set_status "failed" "$target" "" "Directory not found for $target"
      return 1
    fi
  fi

  log "📁 Target Directory: $target_dir"

  # 1. Clean stale .git/index.lock if exists
  if [ -f "$target_dir/.git/index.lock" ]; then
    log "ℹ Stale .git/index.lock detected. Cleaning up..."
    rm -f "$target_dir/.git/index.lock" || true
  fi

  # 2. Check git branch
  local branch="main"
  if git -C "$target_dir" rev-parse --git-dir >/dev/null 2>&1; then
    branch="$(git -C "$target_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")"
    [ "$branch" = "HEAD" ] && branch="main"
    log "🌿 Detected branch: $branch"

    # Stash any local uncommitted changes safely
    if [ -n "$(git -C "$target_dir" status --porcelain 2>/dev/null || true)" ]; then
      log "ℹ Saving uncommitted local changes to git stash..."
      git -C "$target_dir" stash push -m "Auto-stashed by homelab-redeploy at $(timestamp)" >> "$LOG_FILE" 2>&1 || true
    fi

    # Fetch and clean reset
    log "$ git fetch origin $branch"
    if ! git -C "$target_dir" fetch origin "$branch" >> "$LOG_FILE" 2>&1; then
      log "❌ Failed to fetch origin $branch."
      set_status "failed" "$target" "" "git fetch failed"
      return 1
    fi

    log "$ git reset --hard origin/$branch"
    if ! git -C "$target_dir" reset --hard "origin/$branch" >> "$LOG_FILE" 2>&1; then
      log "❌ Failed to reset to origin/$branch."
      set_status "failed" "$target" "" "git reset failed"
      return 1
    fi

    local new_sha
    new_sha="$(git -C "$target_dir" rev-parse HEAD 2>/dev/null || echo "unknown")"
    log "📌 Checked out HEAD: ${new_sha:0:7}"
  else
    log "⚠ Warning: $target_dir is not a git repository. Skipping git sync."
    local new_sha="manual"
  fi

  # 3. Ensure standard homelab external docker network exists
  auto_create_network "homelab-net"

  # 4. Run Docker Compose Rebuild
  log "🐳 Executing Docker build & compose up..."
  log "$ docker compose up -d --build --force-recreate"

  cd "$target_dir"
  if docker compose up -d --build --force-recreate >> "$LOG_FILE" 2>&1; then
    log "✔ Docker compose up finished successfully!"
  else
    # Fallback to docker-compose if docker compose plugin fails
    log "⚠ 'docker compose' failed, trying legacy 'docker-compose'..."
    if docker-compose up -d --build --force-recreate >> "$LOG_FILE" 2>&1; then
      log "✔ docker-compose up finished successfully!"
    else
      log "❌ Docker compose rebuild failed! See log details above."
      set_status "failed" "$target" "${new_sha:-}" "Docker compose build failed"
      return 1
    fi
  fi

  # 5. Verify container state
  sleep 2
  log "🔍 Container status:"
  if [ "$is_self" -eq 1 ]; then
    docker ps --filter "name=homelab-cockpit" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "$LOG_FILE" 2>&1 || true
  else
    docker ps --filter "name=$target" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "$LOG_FILE" 2>&1 || true
  fi

  log "🎉 Redeployment for $target completed successfully at commit ${new_sha:0:7}!"
  log "=================================================================="
  set_status "success" "$target" "${new_sha:-}" ""
  return 0
}

watch_mode() {
  log "👀 [Homelab Redeploy Watcher] Daemon started on $(uname -n)."
  log "Watching trigger file: $TRIGGER_FILE"
  log "Logs will be written to: $LOG_FILE"

  # Clear any stale trigger file on boot
  rm -f "$TRIGGER_FILE"

  while true; do
    if [ -f "$TRIGGER_FILE" ]; then
      local target_project
      target_project="$(cat "$TRIGGER_FILE" 2>/dev/null || echo "homelab-dashboard")"
      rm -f "$TRIGGER_FILE"

      log "⚡ Detected redeploy trigger for: $target_project"
      do_redeploy "$target_project" || true
    fi
    sleep 1.5
  done
}

# Entrypoint routing
if [ "${1:-}" = "--watch" ] || [ "${1:-}" = "-w" ]; then
  watch_mode
else
  do_redeploy "${1:-homelab-dashboard}"
fi
