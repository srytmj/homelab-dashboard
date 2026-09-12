# 🛸 Homelab Cockpit | Definitive Owner POV Dashboard

> **Real-time 360° Homelab Telemetry, Autonomous Control Plane & Telegram Sentinel Companion.** Built specifically for compact, multi-service homelab environments (Lenovo ThinkCentre Tiny, Proxmox VE, Ubuntu Docker Runner LXC, Tailscale Mesh Network, and Multi-bay External DAS).

---

## 🏆 Real-World Impact: Lenovo ThinkCentre M710q Tiny Case Study

Deployed in production on an unprivileged Ubuntu 24.04 LXC (100) on a Lenovo ThinkCentre M710q Tiny (Intel Core i5-7500, 32GB RAM) running Proxmox VE 8:

```
+-----------------------------------------------------------------------------------------+
|                                    HARD BENCHMARK METRICS                               |
|                                                                                         |
|   📉 -83.3% Observability Containers  : Reduced from 6 containers down to 1 daemon       |
|   💾 15.27 GB NVMe SSD Space Reclaimed : Cleaned via `docker system prune -af --volumes` |
|   ⚡ 9.8 GB Free RAM Headroom          : LXC RAM stabilized at ~2.2 GB / 12 GB          |
|   🚫 4 Redundant Stacks Decommissioned : Netdata, Uptime Kuma, Portainer & Homelable    |
|   🔄 Zero Polling Storm                : Replaced 4 poll loops with 1 multiplexed WS    |
+-----------------------------------------------------------------------------------------+
```

| Metric | Before (Fragmented Stacks) | After (Homelab Cockpit) | Impact |
| :--- | :--- | :--- | :--- |
| **Active Monitoring Stacks** | **4 tools / 6 containers**<br>*(Netdata, Uptime Kuma, Portainer, Homelable x3)* | **1 container**<br>*(`homelab-cockpit` on port :8050)* | **-83.3%** container bloat |
| **NVMe SSD Storage** | Bloated layers, cache & volumes | Purged via `docker system prune -af` | **15.27 GB Reclaimed** |
| **LXC RAM Consumption** | High baseline memory pressure | **~2.2 GB** used out of 12 GB allocation | **9.8 GB Free Headroom** |
| **Browser Tabs for Operations** | 4 tabs minimum | **1 unified Cockpit tab** | **-75%** context switching |
| **Tailscale Routing Visibility** | Blind / Guesswork | Explicit `TS 100.x` vs `LAN 192.x` badges | **Instant 1-click routing** |

> 📖 **Read the full case study & technical deep dive:** [docs/case-study.md](file:///root/homelab-dashboard/docs/case-study.md)

---

## ⚡ Architecture & Signal Flow

Homelab Cockpit combines low-level hardware telemetry, multi-bay storage watchdog protection, Tailscale overlay peer tracking, live per-second network throughput speedometers, L7 HTTP service probes, native infrastructure console quick-launching, and an optional **Telegram Sentinel Bot** into a single unified daemon.

```
 +-------------------------------------------------------------------------+
 |                      Lenovo ThinkCentre M710q Tiny                      |
 |                      Intel Core i5-7500 (4C/4T) • 32GB RAM              |
 +-------------------------------------------------------------------------+
       |                                              |
       v                                              v
 [ Proxmox VE Node ]                           [ Ubuntu LXC ]
  IP: 192.168.18.224                            IP: 192.168.18.225
  • Host CPU & RAM                              • Container Runner (~28 containers)
  • Thermal Throttling & Fan Sensor             • /var/run/docker.sock
  • Proxmox vzdump Nightly Backups              • Mounts: /mnt/hdd-* (DAS Watchdog)
       |                                              |
       +--------------------+    +--------------------+
                            |    |
                            v    v
       +-----------------------------------------------+   [ Tailscale Tailnet ]
       |             HOMELAB COCKPIT DAEMON            |<-- 100.x Peer Mesh
       |       Node.js (Fastify) + TypeScript          |    • Local Socket
       |       • Real-time WebSocket Broadcaster (2s)  |    • Subnet Router 192.168.18.0/24
       |       • 1x Owner Auth Wall & 30-Day Sessions  |    • Direct Container URLs
       |       • Dockerode + Proxmox REST Client       |
       |       • Live Bandwidth Delta Speedometer      |
       |       • L7 HTTP Service Health Prober         |
       |       • NPM Let's Encrypt SSL Tracker         |
       |       • Docker NVMe Disk Hygiene / Prune      |
       |       • Infrastructure Quick Consoles Gateway |
       |       • Telegram Sentinel Bot (3-Tier Ops)    |<-- 📱 Telegram Long-Polling
       |       • Gemini 2.0 Flash AI Context Engine    |<-- 🧠 Google AI Studio
       +-----------------------------------------------+
                            |  WebSocket (ws://)
                            v
       +-----------------------------------------------+
       |             CLIENT DASHBOARD SPA              |
       |          Vite + React + Tailwind CSS          |
       |  Owner POV Cockpit • Privacy Mode • Kiosk UI  |
       +-----------------------------------------------+
```

---

## 🎯 Complete Feature Matrix

### 1. 🔐 Owner Auth Wall (1x Onboarding & Remote Protection)
- **1x Initial Registration**: Setup form appears only on first run. Once registered, public registration is **permanently locked** down to the single owner.
- **30-Day Persistent Session**: Secure scrypt-hashed credentials stored in persistent volume `./data/auth.json`. Safe to expose outside via Cloudflare Tunnel or Tailscale.
- **Full Route Protection**: Fastify `preHandler` hook protects all REST endpoints (`/api/snapshot`, logs, restart, prune) and WebSocket connections (`/ws`).

### 2. 🌐 Container Fleet with Explicit Tailscale Routing
- **Prominent Dual Network Display**: Shows active **`TS` `100.110.20.15:PORT`** and **`LAN` `192.168.18.225:PORT`** side-by-side with 1-click clipboard copy and open buttons.
- **Instant Network Filters**: Segment by `All (28)`, `Tailscale Mesh (14)`, `LAN Only (7)`, and `Internal Bridge (7)`.
- **In-App Real-Time Log Viewer**: Stream stdout/stderr directly (50/100/250/500 lines) with auto-scroll and copy.
- **Safe Graceful Restart**: Interactive confirmation modal with instant feedback.
- **Live Bandwidth Speedometer**: Live per-second throughput deltas (`↓ 12.5 MB/s`, `↑ 1.4 MB/s`).
- **L7 HTTP Health Probing**: Verifies real service responsiveness (`200 OK - 8ms` vs `502 ERR`) instead of blindly trusting Docker's "Up" state.

### 3. 🤖 Homelab Sentinel (Telegram & Gemini AI Companion) — *Optional*
- **Zero Extra Containers**: Replaces separate Python bot stacks (`homelab-sentinel`) by embedding directly into the Cockpit daemon with in-memory telemetry access.
- **3-Tier Risk Architecture**:
  - **Tier 1 (Read-Only Telemetry)**: `/status`, `/resources`, `/backup_status`, `/logs <container>`.
  - **Tier 2 (AI Assistant via Gemini 2.0 Flash)**: Natural language Q&A fed by real-time homelab telemetry snapshots (*"bro jellyfin lancar ga?"*, *"ada storage yg mau penuh?"*). LLM answers only, never executes actions.
  - **Tier 3 (State Actions with Confirmation)**: `/restart <container>` and `/prune` enforce a 60-second `/confirm` state machine and strict `MANAGED_CONTAINERS` whitelist.
- **Fail-Closed Security**: Silently rejects and ignores any Telegram user ID not specified in `TELEGRAM_ALLOWED_USER_IDS`.
- **Outbound Long-Polling**: Works behind Tailscale and CGNAT without open inbound ports or webhooks.

### 4. 🎛️ Infrastructure Quick Consoles (Launcher)
- **Minimal Utilitarian Drawer**: Direct single-click gateway into 8 native homelab consoles (Proxmox VE `:8006`, Portainer `:9000`, NPM `:81`, Netdata `:19999`, Uptime Kuma `:3001`, AdGuard `:3000`, T3 Code `:7860`, Jellyfin `:8096`).
- **Dual Routing**: Instantly switch between LAN and Tailscale URLs.

### 5. 🚨 DAS Canary Watchdog (Hard Drive Disconnect Alert)
- Continuous monitoring of external multi-bay USB DAS storage via canary files (`.mounted`).
- Triggers a pulsing emergency banner if any storage volume unmounts, preventing SSD overflow.

### 6. 🛡️ Proxmox Nightly Backup Tracker (vzdump)
- Direct integration with Proxmox VE REST API (`192.168.18.224:8006`).
- Displays last night's backup status (`SUCCEEDED` / `FAILED`), duration, archive size, and storage targets.

### 7. 🧹 Docker NVMe SSD Saver & Safe Prune
- Identifies reclaimable disk space across dangling images, build caches, and unused volumes.
- Safely triggers `docker system prune -f` directly from the UI or via Telegram `/prune`.

### 8. 🔒 SSL Certificate & Domain Expiry Tracker (NPM Companion)
- Real-time countdown of Let's Encrypt certificates across all subdomains with warning threshold indicators.

### 9. 🕶️ Privacy Showcase Mode & Kiosk Fullscreen
- **1-Click Privacy Toggle**: Instantly redacts local IPs, Tailscale IPs, and domain names for clean screenshots.
- **Kiosk Fullscreen**: Perfect for wall-mounted tablets and ambient displays.

---

## 🚀 Quick Start (Docker Compose)

```bash
git clone https://github.com/srytmj/homelab-dashboard.git
cd homelab-dashboard
cp .env.example .env
```

Configure `.env`:
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

# Optional Telegram Sentinel Companion
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ALLOWED_USER_IDS=12345678
GEMINI_API_KEY=AIzaSy...
```

Run container:
```bash
docker compose up -d --build
```

Access Cockpit:
👉 **`http://192.168.18.225:8050`** (or via Tailscale `http://100.x.y.z:8050`)

---

## 📜 License
MIT License. Crafted for homelab owners and self-hosters.
