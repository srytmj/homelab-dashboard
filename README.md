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
  • Thermal Sensors                             • /var/run/docker.sock
  • Proxmox REST API                            • Mounts: /mnt/hdd-*
       |                                              |
       +--------------------+    +--------------------+
                            |    |
                            v    v
       +-----------------------------------------------+   [ Tailscale Tailnet ]
       |             HOMELAB COCKPIT DAEMON            |<-- 100.x Peer Mesh
       |       Node.js (Fastify) + TypeScript          |    • Local Socket
       |       • Periodic WebSocket Broadcaster (2s)   |    • Subnet Router 192.168.18.0/24
       |       • Dockerode + Proxmox REST Client       |    • Direct Container URLs
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

1. **Dual-Layer Hardware Vitals**:
   - **Proxmox VE Hypervisor (192.168.18.224)**: Host CPU %, RAM usage (used vs 32GB hardware limit), CPU thermal sensor monitoring (`°C` status badge: Cool / Warm / Hot), PVE version, and host uptime.
   - **Docker Runner (Ubuntu LXC 192.168.18.225)**: LXC CPU load, memory utilization, and 1m/5m/15m system load averages.

2. **Tailscale Mesh & Peer Tracking**:
   - **Tailnet Peer Fleet**: Track which homelab devices, hypervisors, workstations, and mobile devices are connected to the Tailnet.
   - **IP & MagicDNS Matrix**: Live `100.x.y.z` IPv4 and IPv6 addresses with 1-click clipboard copy.
   - **Subnet Router & Exit Node Detection**: Highlights advertised subnets (e.g. `192.168.18.0/24`) and exit node status.
   - **Per-Container Tailscale Reachability**: View whether a container service is accessible via Tailscale vs LAN Only, with direct 1-click Tailscale URLs!

3. **Storage Matrix & External DAS Enclosures**:
   - Live visual capacity bars for **Internal NVMe SSD** (Root OS & Docker Volumes).
   - Real-time capacity breakdown for **External 3-Bay DAS Enclosures** (`/mnt/hdd-media`, `/mnt/hdd-cloud`, `/mnt/hdd-music`).
   - SMART health badges and alert indicators for warning (>80%) and critical (>90%) thresholds.

4. **Live Container Fleet (Docker Engine Telemetry)**:
   - Full live list of containers via `/var/run/docker.sock`.
   - Real-time CPU % & RAM MB/GB with **dynamic inline SVG micro-sparklines** showing usage trends.
   - Network I/O counter (RX / TX) and exposed port bindings.
   - Filter by **All**, **Tailscale Only**, or **LAN Only**.
   - **Quick Actions**:
     - **Tail Logs Modal**: Monospace dark terminal with live line selector (50, 100, 250 lines) and copy-to-clipboard.
     - **Safe Restart Trigger**: Restart container directly with confirmation prompt.

5. **Zero-Overhead Single Container Deployment**:
   - Multi-stage Docker build packaging both Fastify daemon and compiled Vite frontend into a single lean Alpine image (< 130MB).
   - Smart fallback demo-mode if run outside the homelab cluster.

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone & Configure Environment

```bash
git clone https://github.com/srytmj/homelab-dashboard.git
cd homelab-dashboard
cp .env.example .env
```

Edit your `.env` file:
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

## 🔑 Integrations Setup

### 1. Proxmox VE API Token
1. Login to Proxmox VE Web UI (`https://192.168.18.224:8006`).
2. Go to **Datacenter** → **Permissions** → **API Tokens** → Click **Add**:
   - **User**: `root@pam`
   - **Token ID**: `cockpit`
3. Copy generated **Secret Token** into `.env`.

### 2. Tailscale Telemetry
- **Via Local Socket (Zero Config)**: Keep volume mount `/var/run/tailscale:/var/run/tailscale:ro` in `docker-compose.yml`. Homelab Cockpit will read live peer statuses directly from `tailscaled`.
- **Via Tailscale API**: Generate an API access token in Tailscale Admin Console → **Settings** → **Keys** → **API access tokens**, and set `TAILSCALE_API_KEY` and `TAILSCALE_TAILNET`.

---

## 💻 Local Development

Run backend and frontend concurrently in development mode:

```bash
# Build whole project
npm run build

# Run dev mode
npm run dev:server   # Fastify on http://localhost:3000
npm run dev:client   # Vite on http://localhost:5173
```

---

## 📜 License
MIT License. Crafted for homelab owners and self-hosters.
