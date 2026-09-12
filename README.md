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
Proxmox VE node (192.168.18.224)        Ubuntu LXC runner (192.168.18.225)
  host CPU / RAM / thermal                ~28 containers via docker.sock
  vzdump backup history                   /mnt/hdd-* DAS mounts
              |                                      |
              +------------------+-------------------+
                                 |
                    Cockpit daemon (Fastify + TypeScript)
                    - single owner account, 30-day sessions
                    - polls every 2s, broadcasts over WebSocket
                    - Dockerode, Proxmox REST, Tailscale socket
                    - L7 HTTP probes, SSL expiry, disk hygiene
                    - optional Telegram bot with Gemini Q&A
                                 |
                    React client (Vite + Tailwind)
```

## Features

**Owner authentication.** The first visit registers one owner account, and registration closes permanently after that. Every `/api` route and the WebSocket require a bearer token; sessions last 30 days when you ask them to. Health and auth endpoints stay public.

**Host vitals.** Proxmox CPU, memory, package temperature and uptime; LXC CPU, memory and load average; fan speed and kernel throttle counters; vzdump backup status, archive size and duration.

**Container fleet.** Live CPU, memory and per-second network rate for every container, with sparklines, sortable columns, filters and pagination. L7 HTTP probes report the real status code and latency instead of trusting the Docker "Up" state.

**Storage and DAS watchdog.** Usage per volume plus a canary file check (`.mounted`) on external enclosures. If a bay detaches, a banner appears immediately, because containers writing to a missing mount will fill the root NVMe instead.

**Tailscale mesh.** Peer list with online state, `100.x` addresses, MagicDNS names, exit node and subnet router flags. Container links switch between LAN and Tailscale addresses, automatically or manually.

**SSL tracker.** Countdown for every Let's Encrypt certificate issued through Nginx Proxy Manager, with warning under 30 days and critical under 14.

**Disk hygiene.** Reclaimable space across dangling layers and build cache, with a confirmation modal that runs a safe prune. Running containers and named volumes are never touched.

**Command deck.** One-click links into Proxmox, Portainer, Nginx Proxy Manager, Netdata, Uptime Kuma, AdGuard Home, the web IDE and Jellyfin, on either LAN or Tailscale addresses.

**Privacy mode and kiosk mode.** Redact IPs and domains before taking screenshots; go fullscreen for a wall display.

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

PROXMOX_URL=https://192.168.18.224:8006
PROXMOX_NODE=pve
PROXMOX_TOKEN_ID=root@pam!cockpit
PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PROXMOX_REJECT_UNAUTHORIZED=false

TAILSCALE_SOCKET=/var/run/tailscale/tailscaled.sock
TAILSCALE_TAILNET=your-tailnet.ts.net

STORAGE_MOUNTS=/,/mnt/hdd-media,/mnt/hdd-cloud,/mnt/hdd-music

# Optional Telegram companion
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_ALLOWED_USER_IDS=12345678
GEMINI_API_KEY=AIzaSy
```

## Local development

```bash
npm run dev:server   # Fastify daemon on :3000
npm run dev:client   # Vite dev server on :5173, proxies /api and /ws
```

`npm run build` builds both. `npm start` serves the built client from the daemon.

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
| WS | `/ws` | Snapshot broadcast every 2 seconds |

## Documentation

- [User manual](docs/USER_MANUAL.md) covers reading the dashboard and using every control.
- [Design system](docs/DESIGN_SYSTEM.md) documents colors, typography and component patterns.
- [CLAUDE.md](CLAUDE.md) is the working brief for AI coding agents on this repo.

## License

MIT.
