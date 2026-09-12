# 🛸 Homelab Cockpit | Owner POV Dashboard

> **Real-time 360° Homelab Telemetry & Control Plane.** Built specifically for compact, multi-service homelab environments (Lenovo ThinkCentre Tiny, Proxmox VE, Ubuntu Docker Runner LXC, Tailscale Mesh Network, and Multi-bay External DAS).

---

## ⚡ Overview & Architecture

Homelab Cockpit combines hardware telemetry, multi-drive storage matrices, Tailscale overlay peer tracking, and real-time container metrics into a high-density, low-latency, dark-mode-first dashboard.

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
       |       • Periodic WebSocket Broadcaster (2s)   |    • Subnet Router 192.168.18.0/24
       |       • Dockerode + Proxmox REST Client       |    • Direct Container URLs
       |       • NPM Let's Encrypt SSL Tracker         |
       |       • Docker NVMe Disk Hygiene / Prune      |
       +-----------------------------------------------+
                            |  WebSocket (ws://)
                            v
       +-----------------------------------------------+
       |             CLIENT DASHBOARD SPA              |
       |          Vite + React + Tailwind CSS          |
       |  Dense Owner POV Cockpit • Zero Bloat • Fast  |
       +-----------------------------------------------+
```

---

## 🎯 Key Features

1. **Dual-Layer Hardware Vitals & Backup Status**:
   - **Proxmox VE Hypervisor (192.168.18.224)**: Host CPU %, RAM usage (used vs 32GB limit), thermal sensor monitoring (`°C`), PVE version, and host uptime.
   - **Proxmox Backup Vitals ("Did My Homelab Backup Last Night?")**: Integrates `vzdump` task logs directly into the UI (last backup timestamp, target storage, size, duration, and status badge).
   - **Docker Runner (Ubuntu LXC 192.168.18.225)**: LXC CPU load, memory utilization, load averages, and **CPU Thermal Throttle Watchdog** with dynamic fan speed indicator.

2. **Multi-Bay DAS Mount Watchdog & Canary Protection**:
   - Continuous canary check (`.mounted`) on external USB/DAS enclosures (`/mnt/hdd-media`, `/mnt/hdd-cloud`, `/mnt/hdd-music`).
   - **Blinking Emergency Banner**: Detects silent unmounts before media downloaders or containers can flood and exhaust the internal NVMe root SSD.

3. **Tailscale Mesh & Peer Tracking**:
   - **Tailnet Peer Fleet**: Track homelab devices, hypervisors, workstations, and mobile devices on the Tailnet.
   - **IP & MagicDNS Matrix**: Live `100.x.y.z` IPv4 and IPv6 addresses with 1-click clipboard copy.
   - **Subnet Router & Exit Node Detection**: Highlights advertised subnets (`192.168.18.0/24`) and active exit nodes.

4. **SSL Certificate & Domain Vitals (NPM Companion)**:
   - Expiration countdowns for Nginx Proxy Manager subdomains (`jellyfin.homelab.lan`, `cloud.homelab.lan`, `vault.homelab.lan`, etc.).
   - Visual alerts for certificates requiring renewal (<30 days warning, <14 days critical).

5. **Docker NVMe Disk Hygiene ("SSD Saver")**:
   - Real-time detection of recoverable disk space from dangling image layers, stopped containers, and build cache.
   - **One-Click Safe Prune Modal**: Reclaim gigabytes of space on the internal NVMe drive safely with real-time feedback.

6. **Live Container Fleet with Smart Web UI Launcher**:
   - Full live list of containers via `/var/run/docker.sock`.
   - Dynamic inline SVG micro-sparklines for CPU and memory usage trends.
   - **Smart Launcher Switcher**: Auto-detects whether the dashboard is being viewed locally on LAN (`192.168.18.x`) or remotely via Tailscale (`100.x` / `.ts.net`), seamlessly tailoring "Open Web UI" links to the active connection!
   - **Quick Actions**: Tail live logs in a monospace dark terminal modal and restart containers with confirmation.

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone & Configure Environment

```bash
git clone https://github.com/srytmj/homelab-dashboard.git
cd homelab-dashboard
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
PROXMOX_URL=https://192.168.18.224:8006
PROXMOX_NODE=pve
PROXMOX_TOKEN_ID=root@pam!cockpit
PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PROXMOX_REJECT_UNAUTHORIZED=false

# Tailscale Integration (via socket or API key)
TAILSCALE_SOCKET=/var/run/tailscale/tailscaled.sock
TAILSCALE_API_KEY=tskey-api-kxxxxxxxxxxxxxx
TAILSCALE_TAILNET=your-tailnet.ts.net

STORAGE_MOUNTS=/,/mnt/hdd-media,/mnt/hdd-cloud,/mnt/hdd-music
```

### 2. Launch Container

```bash
docker compose up -d --build
```

Dashboard will be accessible at:
👉 **`http://192.168.18.225:8050`** (or via your Tailscale IP `http://100.x.y.z:8050`)

---

## 💻 Local Development

```bash
# Build monorepo
npm run build

# Run dev mode
npm run dev:server   # Fastify on http://localhost:3000
npm run dev:client   # Vite on http://localhost:5173
```

---

## 📜 License
MIT License. Crafted for homelab owners and self-hosters.
