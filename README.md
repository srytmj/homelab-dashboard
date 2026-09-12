# 🛸 Homelab Cockpit | Definitive Owner POV Dashboard

> **Real-time 360° Homelab Telemetry & Autonomous Control Plane.** Built specifically for compact, multi-service homelab environments (Lenovo ThinkCentre Tiny, Proxmox VE, Ubuntu Docker Runner LXC, Tailscale Mesh Network, and Multi-bay External DAS).

---

## ⚡ Architecture & Signal Flow

Homelab Cockpit combines low-level hardware telemetry, multi-bay storage watchdog protection, Tailscale overlay peer tracking, live per-second network throughput speedometers, L7 HTTP service probes, and native infrastructure console quick-launching into a single high-density, dark-mode cockpit.

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
       |       • Dockerode + Proxmox REST Client       |    • Direct Container URLs
       |       • Live Bandwidth Delta Speedometer      |
       |       • L7 HTTP Service Health Prober         |
       |       • NPM Let's Encrypt SSL Tracker         |
       |       • Docker NVMe Disk Hygiene / Prune      |
       |       • Infrastructure Command Deck Gateway   |
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

### 1. 🎛️ Infrastructure Command Deck (Native Console Launchpad)
- **Quick-Access Modal**: One-click direct gateway to your 8 native homelab consoles:
  - **Proxmox VE** (`:8006`, HTTPS hypervisor manager)
  - **Portainer CE** (`:9000`, Docker management)
  - **Nginx Proxy Manager** (`:81`, reverse proxy & SSL manager)
  - **Netdata** (`:19999`, second-by-second OS & kernel metrics)
  - **Uptime Kuma** (`:3001`, service uptime monitor)
  - **AdGuard Home** (`:3000`, DNS sinkhole & adblocker)
  - **T3 Code Web IDE** (`:7860`, autonomous developer workspace)
  - **Jellyfin** (`:8096`, 4K media server)
- **Seamless LAN vs Tailscale Switcher**: Toggle all 8 consoles between local LAN (`192.168.18.x`) or Tailscale (`100.x`) with 1 click.

### 2. ⚡ Live Network Rate Speedometer (`MB/s` / `KB/s`)
- Computes real-time bandwidth delta throughput per polling interval:
  - Instantly spot when Jellyfin is transcoding/streaming (`↑ 12.5 MB/s`) or Transmission is downloading (`↓ 8.5 MB/s`).
  - Total cumulative lifetime transfer + live instantaneous speed.

### 3. 🩺 L7 HTTP Service Health Prober (Process vs Real Health)
- Bypasses basic Docker "Up" status by probing actual web ports with latency tracking:
  - 🟢 `200 OK (8ms)`: Service is alive and actively serving HTTP requests.
  - 🔴 `502 Bad Gateway`: Catches database disconnects or internal worker crashes.

### 4. 🙈 Privacy & Showcase Mode + Kiosk Fullscreen
- **1-Click Screenshot Redaction**: Obfuscates all private LAN IPs (`192.168.18.•••`), Tailscale addresses (`100.110.•••.•••`), and domain names so you can safely screenshot and share your setup on Reddit / Discord.
- **Kiosk / Fullscreen Mode**: Maximizes the dashboard with one click, ideal for dedicated tablets or wall-mounted homelab status displays.

### 5. 🛡️ Multi-Bay DAS Mount Watchdog & Canary Protection
- Canary check (`.mounted`) on external USB/DAS enclosures (`/mnt/hdd-media`, `/mnt/hdd-cloud`, `/mnt/hdd-music`).
- **Emergency Pulsing Alarm Banner**: Triggers instantly if an external drive disconnects, preventing container downloads from overflowing into the root NVMe SSD.

### 6. 💾 Proxmox Backup Vitals ("Did My Homelab Backup Last Night?")
- Live vzdump backup telemetry for LXC 100 (`docker-host`):
  - Status: 🟢 `SUCCEEDED` (24h Clean)
  - Last backup timestamp, target storage, archive size (`14.85 GB`), and duration (`4m 12s`).

### 7. 🌡️ CPU Thermal Throttle Indicator (Lenovo M710q Tiny)
- Monitors package temperature, fan speed percentage, and kernel thermal throttling counters.
- Visual warning badge if the Tiny chassis begins throttling under high CPU transcoding load.

### 8. 🧹 Docker Disk Hygiene ("NVMe SSD Saver") & Safe Prune
- Calculates reclaimable disk space across dangling image layers, stopped containers, and build cache.
- **Safe Prune Confirmation Modal**: Triggers `POST /api/docker/prune` to reclaim gigabytes of NVMe SSD space safely without affecting running containers.

### 9. ⏳ SSL Certificate & Domain Expiry Tracker (NPM Companion)
- Live countdown of Let's Encrypt certificates across all subdomains with warning states (<30 days warning, <14 days critical).

### 10. 🌐 Tailscale Mesh Network & Smart Launcher Switcher
- Full peer tracking on the Tailnet (`100.x` IPs, online status, MagicDNS names, subnet router badges).
- Automatic LAN vs Tailscale URL switcher for all container Web UI action links.

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
