# Homelab Cockpit

A single-pane dashboard for a compact homelab: Proxmox VE host vitals, Docker container telemetry, Tailscale peers, storage and DAS mount health, SSL expiry, and an optional Telegram companion bot. One Node.js daemon, one React client, no external monitoring stack.

Built for a Lenovo ThinkCentre M710q Tiny running Proxmox VE with an Ubuntu LXC container runner and an external multi-bay DAS enclosure, but nothing is hardcoded to that setup.

## Results in production

Running on an unprivileged Ubuntu 24.04 LXC on the M710q under Proxmox VE 8, replacing a stack of separate monitoring tools:

| | Before | After |
| --- | --- | --- |
| Monitoring containers | 6 across 4 tools | 1 daemon |
| LXC memory in use | high baseline pressure | 2.2 GB of 12 GB |
| NVMe reclaimed | — | 15.27 GB |
| Browser tabs to operate | 4 | 1 |
| Poll loops | 4 independent | 1 multiplexed WebSocket |

Netdata, Uptime Kuma, Portainer and the previous dashboard were decommissioned. Full write-up in [docs/case-study.md](docs/case-study.md).

## Architecture

```
Proxmox VE node (192.168.18.224)        Ubuntu LXC runner (192.168.18.225)      Second Docker host (optional)
  host CPU / RAM / thermal                ~28 containers via docker.sock         containers only, over
  vzdump backup history                   /mnt/hdd-* DAS mounts                  dockerd's TCP API on the tailnet
              |                                      |                                    |
              +------------------+-------------------+------------------+-----------------+
                                 |
                    Cockpit daemon (Fastify + TypeScript)
                    - single owner account, 30-day sessions
                    - polls every 2s, broadcasts over WebSocket
                    - Dockerode per configured Docker host, Proxmox REST, Tailscale socket
                    - L7 HTTP probes, SSL expiry, disk hygiene (primary host only)
                    - pinned-container registry (data/pins.json)
                    - GitHub commit tracking for tracked projects
                    - rclone backup / restore, plus small-config import
                    - SSH terminal bridge (no command whitelist)
                    - optional Telegram bot with Gemini Q&A
                                 |
                    React client (Vite + Tailwind + React Router)
                    - Overview / Fleet / Infra / Git projects / Terminal / Sentinel pages
                    - Ctrl+K command palette
                    - light and dark theme
```

## Features

**Owner authentication.** The first visit registers one owner account, and registration closes permanently after that. Every `/api` route and the WebSocket require a bearer token; sessions last 30 days when you ask them to. Health and auth endpoints stay public.

**Host vitals.** Proxmox CPU, memory, package temperature and uptime; LXC CPU, memory and load average; fan speed and kernel throttle counters; vzdump backup status, archive size and duration.

**Container fleet.** Live CPU, memory and per-second network rate for every container, with sparklines, sortable columns, filters and pagination. L7 HTTP probes report the real status code and latency instead of trusting the Docker "Up" state. A container's Web UI cell opens a small menu to pick which address to use — LAN, Tailscale, or its public domain if pinned with one — rather than guessing.

**Multiple Docker hosts.** Point the daemon at more than one dockerd (see `DOCKER_HOSTS` below) and every host's containers land in the same fleet table, tagged and filterable by which host they came from. Host-level CPU/RAM stays scoped to the primary host — that's the only machine the daemon can read its own OS vitals from.

**Storage and DAS watchdog.** Usage per volume plus a canary file check (`.mounted`) on external enclosures. If a bay detaches, a banner appears immediately, because containers writing to a missing mount will fill the root NVMe instead.

**Disk performance.** On Infra's Performance tab: pick any volume, internal or external, and see its live read/write throughput and how much of the time it's actually busy, graphed over recent history — the same shape as Task Manager's own Performance tab for a disk. Reads `/proc/diskstats` directly, so it needs no extra mount or config, but only has data on a Linux host.

**Processes.** A dedicated page with three tabs — this host, Docker containers (via `docker top`, across every configured host), and one tab per configured SSH target (a read-only `ps` over SSH) — so Proxmox's own process list shows up next to the LXC's and every container's. Sortable, searchable, each tab polling independently rather than riding the main two-second feed.

**Shortcuts.** The Overview page doubles as a browser startpage: a grid of personal links (YouTube, Gmail, anything) alongside the homelab summary, plus a clock and an opt-in weather readout based on the browser's own location (sent straight to Open-Meteo, never through this daemon).

**Notifications.** A bell icon in the header logs pins, project tracking, and every pull & rebuild — started, finished, failed, or auto-deployed — so you don't have to be staring at the page it happened on. Desktop notifications are opt-in per browser. Pull & rebuild itself runs inline under the project row rather than in a blocking dialog, with a live log, and keeps running server-side if you navigate away.

**Tailscale mesh.** Peer list with online state, `100.x` addresses, MagicDNS names, exit node and subnet router flags. Container links switch between LAN and Tailscale addresses, automatically or manually.

**SSL tracker.** Countdown for every Let's Encrypt certificate issued through Nginx Proxy Manager, with warning under 30 days and critical under 14.

**Disk hygiene.** Reclaimable space across dangling layers and build cache, with a confirmation modal that runs a safe prune. Running containers and named volumes are never touched.

**Backup, restore and config import.** Scheduled or on-demand `rclone sync` to a remote you've already set up yourself (Nextcloud, Drive, anything rclone supports) — this is real disaster recovery, meant to answer "the SSD died, get my fleet back," not just Cockpit's own settings. Restore is the same sync reversed and needs an explicit confirmation, since it overwrites whatever's currently there. Separately, **Import config from a link** restores just `pins.json`/`git-projects.json` from a small zip at a public link (a "Anyone with the link" Google Drive share works) — never the fleet, and never your login. See Backup and restore below.

**Git projects.** Track a container that's built from your own repo — separate from off-the-shelf services like Jellyfin — and see its latest upstream commit against what you last deployed, checked against GitHub every few minutes (not on every poll tick, to stay well under GitHub's rate limit). Set a local path and a rebuild command and the dashboard can pull and rebuild it directly, with a heuristic warning first if the changed files look like they touch a database migration. This is the one feature that runs a command against the host — see Git project pull/rebuild below before enabling it.

**Pinned containers and public domains.** Pin any container from the fleet table, optionally with the public domain it answers on if it's exposed through a Cloudflare tunnel. Pins persist server-side in `data/pins.json`, so they follow you between browsers and devices.

**Command palette.** `Ctrl+K` (or `Cmd+K`) from anywhere opens a searchable palette across the four pages and every pinned container — its public domain if it has one, else Tailscale, else LAN, in that fixed order. Arrow keys move, Enter activates.

**Pages.** Overview is a one-glance summary — device, spec, usage, container count. Fleet, Infra and Sentinel hold the detail. Direct links to any page work, since the daemon serves the client for every non-API route.

**Light and dark theme.** Toggles from the header, remembers your choice, otherwise follows the OS setting.

**Privacy mode and kiosk mode.** Redact IPs and domains before taking screenshots; go fullscreen for a wall display.

**Terminal.** A real interactive shell, in the browser, to Proxmox or any configured Docker host over SSH — for the one-off `tail -f` you don't want to leave the dashboard for. This is deliberately the one feature with no command whitelist: it's full shell access, by design, to hosts named in `SSH_TARGETS` and nowhere else. See Terminal below before enabling it.

**Sentinel companion (optional).** A Telegram bot embedded in the same daemon. Tier 1 is read-only telemetry, tier 2 answers questions through Gemini without acting, tier 3 restarts containers or prunes disk behind a whitelist and a 60-second confirmation. Unknown Telegram user IDs are ignored silently.

## Quick start

```bash
git clone https://github.com/srytmj/homelab-dashboard.git
cd homelab-dashboard
cp .env.example .env
docker compose up -d --build
```

The dashboard is served at `http://<docker-host>:8050`.

Without a `.env` the daemon starts in demo mode with simulated telemetry, which is enough to develop against.

### Configuration

```env
PORT=3000

DOCKER_HOST_NAME=docker-host
DOCKER_SOCKET=/var/run/docker.sock
# Optional second (and third, ...) Docker host, reachable over the tailnet
DOCKER_HOSTS=media-lxc=tcp://100.110.20.30:2375

PROXMOX_URL=https://192.168.18.224:8006
PROXMOX_NODE=pve
PROXMOX_TOKEN_ID=root@pam!cockpit
PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PROXMOX_REJECT_UNAUTHORIZED=false

TAILSCALE_SOCKET=/var/run/tailscale/tailscaled.sock
TAILSCALE_TAILNET=your-tailnet.ts.net

STORAGE_MOUNTS=/,/mnt/hdd-media,/mnt/hdd-cloud,/mnt/hdd-music

# Optional, for the Git projects page (raises the GitHub API rate limit and
# allows tracking private repos)
GITHUB_TOKEN=

# Only needed if you'll use pull/rebuild from the Git projects page — see
# "Git project pull/rebuild" below before setting this
GIT_PROJECTS_ROOT=/opt/homelab-projects

# Only needed for scheduled/on-demand backup and restore — see "Backup and
# restore" below. Config import works without any of this.
BACKUP_RCLONE_REMOTE=nextcloud:homelab-backup
BACKUP_SOURCE_PATHS=/app/data,/projects
BACKUP_INTERVAL_HOURS=0

# Only needed for the in-browser terminal — see "Terminal" below before
# setting this. No command whitelist; real shell access to whatever's named.
SSH_TARGETS=proxmox=root@192.168.18.224,docker-host=root@192.168.18.225:22

# Optional Telegram companion
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_ALLOWED_USER_IDS=12345678
GEMINI_API_KEY=AIzaSy
```

### Setup checklist

Everything the dashboard shows about your machine — node name, CPU, RAM, IPs — comes from the snapshot at runtime; nothing about a specific brand of hardware is baked into the interface. What you do need to check when adapting this to your own homelab:

- **`STORAGE_MOUNTS`** must be paths that exist on the machine running the daemon. A path that doesn't exist falls back to placeholder demo numbers, which is only useful for development, not a real reading of your disks.
- **`STORAGE_LABELS`** is optional and positional — one label per entry in `STORAGE_MOUNTS`, same order, same count. Leave an entry blank to get an auto-generated name from that mount's folder instead of writing one.
- **`DOCKER_SOCKET`** / **`DOCKER_HOST_NAME`** should match where the daemon itself runs. `DOCKER_HOSTS` is only for additional hosts reachable over your tailnet (see Multiple Docker hosts above) — leave it empty for a single-host setup.
- **`PROXMOX_URL`**, **`PROXMOX_TOKEN_ID`** and **`PROXMOX_TOKEN_SECRET`** — without these the Overview and Infra pages show a `SIMULATED` badge and generated numbers, not your actual hardware.
- A pinned container's **public domain** is normalized server-side (`https://` is added if you omit a scheme), but paste the real address a browser would use, not just a bare hostname you haven't verified resolves.

### Git project pull/rebuild

This is the one feature where the dashboard runs a command against your host rather than just reading data from it, so it's worth understanding before you turn it on.

The container image now includes `git` and the `docker` CLI, talking to the same `docker.sock` already mounted for container metrics — this is the standard "Docker outside of Docker" pattern (the same one Portainer or Watchtower use), not a separate Docker-in-Docker install. `GIT_PROJECTS_ROOT` on the host is bind-mounted read-write to `/projects` inside the container. Every project you want to pull/rebuild through the dashboard needs its working tree already cloned somewhere under that directory, e.g. `$GIT_PROJECTS_ROOT/myapp` — the dashboard never clones a repo for you, only pulls one that's already there.

When you register a project's **local path** as `myapp` and pick a **rebuild command**, pulling runs, in order: `git -C /projects/myapp fetch`, a read-only diff to check for migration risk, then (once you confirm) `git -C /projects/myapp pull` and the chosen `docker compose up -d --build[...]` with `cwd` set to that same directory. The rebuild command is a fixed choice from a short list, resolved server-side — the dashboard's UI never lets you type an arbitrary shell command, and the API never accepts one either.

Skip `GIT_PROJECTS_ROOT` entirely if you only want commit tracking (Track a project still works without it) — pull/rebuild for a project without a local path and rebuild command configured stays disabled on that row.

### Backup and restore

`BACKUP_RCLONE_REMOTE` points at a destination you've already configured yourself with `rclone config` on the host — Nextcloud/WebDAV, Google Drive via rclone's own OAuth, or anything else rclone supports. Cockpit never runs that setup for you and never sees your Drive/Nextcloud credentials directly; it only ever calls `rclone sync` against whatever remote you've named, in either direction:

- **Backup** copies each path in `BACKUP_SOURCE_PATHS` up to `<remote>/<path-basename>`. Runs on `BACKUP_INTERVAL_HOURS` if set above 0, and on demand from the Infra page.
- **Restore** copies the same paths back down, overwriting whatever's currently there — this is what you run after reinstalling the daemon on a replacement disk, once `BACKUP_RCLONE_REMOTE` points at the same remote as before. It's confirmed explicitly in the UI and the API rejects it without `{ confirm: true }`.

Leave `BACKUP_RCLONE_REMOTE` empty to skip backup/restore entirely — **Import config from a link** on the Infra page works independently of it. That one is intentionally narrow: it downloads one small zip from a public link (a Google Drive "Anyone with the link" share is rewritten to a direct-download URL automatically; any other direct-download URL works as-is), extracts only `pins.json` and `git-projects.json` by name, and copies just those into `data/`. It never touches `data/auth.json`, so an import can't lock you out of your own dashboard, and it's capped at 20MB — this is for Cockpit's own small config, not a way to move fleet data around.

### Terminal

Read this before setting `SSH_TARGETS`. Every other host-touching feature in this app runs one fixed, pre-chosen command — git pull, a rebuild, an rclone sync. The terminal is different on purpose: it's a real interactive shell, so there's no whitelist to design, because the feature *is* "run anything as this user on this host."

The mitigations are real but limited: it uses SSH key auth (never a password), targets are fixed in `.env` at deploy time and can't be added while the app is running, and it sits behind the same single-owner login as the rest of the dashboard. That last point matters — anyone with a valid Cockpit session already has this ceiling of access in practice, since the daemon's own Docker socket access already reaches every configured host's containers. The terminal doesn't grant a new class of access so much as make an existing one convenient.

Setup: generate a dedicated key pair yourself (`ssh-keygen`), put the public half in `~/.ssh/authorized_keys` on every host you list in `SSH_TARGETS`, and point `SSH_PRIVATE_KEY_PATH` in `docker-compose.yml` at the private half — it's bind-mounted read-only, never uploaded through the dashboard or stored in `data/`. Leave `SSH_TARGETS` empty to disable the feature entirely; the Terminal page then just says there's nothing configured.

If you're an AI agent setting this up or extending it: don't reintroduce hardware-specific strings into `client/src/` — host name, CPU model, IPs and per-drive labels must come from `snapshot.host`/`snapshot.storage` (or the config above), never a literal like a specific CPU model name or IP address written into a component. That was a real bug here once already (see [CLAUDE.md](CLAUDE.md)).

## Local development

```bash
npm install          # root, also installs the git hooks
npm run dev:server   # Fastify daemon on :3000
npm run dev:client   # Vite dev server on :5173, proxies /api and /ws
```

`npm run build` builds both. `npm start` serves the built client from the daemon.

Commit messages follow [conventional commits](https://www.conventionalcommits.org) and are checked by commitlint through a husky `commit-msg` hook, for example `feat(ui): add container pagination`. Allowed scopes live in `commitlint.config.mjs`.

## HTTP API

Everything except `/api/health` and `/api/auth/*` requires `Authorization: Bearer <token>`; the WebSocket takes the same token as a `token` query parameter.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness check |
| GET | `/api/auth/status` | Whether an owner exists and the token is valid |
| POST | `/api/auth/register` | Create the owner account, once |
| POST | `/api/auth/login` | Exchange credentials for a token |
| POST | `/api/auth/logout` | Invalidate the current token |
| GET | `/api/snapshot` | Full telemetry snapshot |
| GET | `/api/tailscale` | Tailnet peers |
| GET | `/api/ssl` | Certificate expiry |
| GET | `/api/sentinel` | Companion bot status |
| GET | `/api/containers/:id/logs?tail=100` | Container logs |
| POST | `/api/containers/:id/restart` | Restart one container |
| POST | `/api/docker/prune` | Safe prune of layers and build cache |
| POST | `/api/pins/:name` | Pin a container, optionally with `{ publicUrl }` |
| DELETE | `/api/pins/:name` | Unpin a container |
| POST | `/api/git-projects/:containerName` | Track a container's repo — `{ repoOwner, repoName, branch, localPath?, rebuildCommand? }` |
| DELETE | `/api/git-projects/:containerName` | Stop tracking |
| POST | `/api/git-projects/:containerName/check-pull` | Read-only: lists files that would change, flags migration risk |
| POST | `/api/git-projects/:containerName/pull` | Pull and run the configured rebuild command |
| GET | `/api/backup/status` | Last backup/restore result and configured source paths |
| POST | `/api/backup/run` | Run a backup now |
| POST | `/api/backup/restore` | Restore from the remote — requires `{ confirm: true }` |
| POST | `/api/backup/import-config` | Import `pins.json`/`git-projects.json` from a link — `{ url }` |
| GET | `/api/ssh-targets` | Configured SSH target names (never host/user/key details) |
| WS | `/ws` | Snapshot broadcast every 2 seconds |
| WS | `/ws/terminal?target=<name>` | Interactive shell to that target — no command whitelist |

## Documentation

- [User manual](docs/USER_MANUAL.md) covers reading the dashboard and using every control.
- [Design system](docs/DESIGN_SYSTEM.md) documents colors, typography and component patterns.
- [CLAUDE.md](CLAUDE.md) is the working brief for AI coding agents on this repo.

## License

MIT.
