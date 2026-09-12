# 🛸 Homelab Cockpit | Owner POV Dashboard

> **Real-time 360° Homelab Telemetry & Control Plane.** Built specifically for compact, multi-service homelab environments (Lenovo ThinkCentre Tiny, Proxmox VE, Ubuntu Docker Runner LXC, and Multi-bay External DAS).

---

## ⚡ Overview & Architecture

Homelab Cockpit combines hardware telemetry, multi-drive storage matrices, and real-time container metrics into a high-density, low-latency, dark-mode-first dashboard.

```
 +-------------------------------------------------------------------------+
 |                      Lenovo ThinkCentre M710q Tiny                      |
 |                      Intel Core i5-7500 (4C/4T) • 32GB RAM              |
 +-------------------------------------------------------------------------+
       |                                              |
       v                                              v
 [ Proxmox VE Node ]                           [ Ubuntu LXC ]
  IP: 192.168.18.224                            IP: 192.168.18.225
  • Host CPU & RAM                              • Container Runner
  • Thermal Sensors                             • /var/run/docker.sock
  • Proxmox REST API                            • Mounts: /mnt/hdd-*
       |                                              |
       +--------------------+    +--------------------+
                            |    |
                            v    v
       +-----------------------------------------------+
       |             HOMELAB COCKPIT DAEMON            |
       |       Node.js (Fastify) + TypeScript          |
       |       • Periodic WebSocket Broadcaster (2s)   |
       |       • Dockerode + Proxmox REST Client       |
       |       • Micro-sparkline Rolling History       |
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

2. **Storage Matrix & External DAS Enclosures**:
   - Live visual capacity bars for **Internal NVMe SSD** (Root OS & Docker Volumes).
   - Real-time capacity breakdown for **External 3-Bay DAS Enclosures** (`/mnt/hdd-media`, `/mnt/hdd-cloud`, `/mnt/hdd-music`).
   - SMART health badges and alert indicators for warning (>80%) and critical (>90%) thresholds.

3. **Live Container Fleet (Docker Engine Telemetry)**:
   - Full live list of containers via `/var/run/docker.sock`.
   - Real-time CPU % & RAM MB/GB with **dynamic inline SVG micro-sparklines** showing usage trends.
   - Network I/O counter (RX / TX) and exposed port bindings.
   - **Quick Actions**:
     - **Tail Logs Modal**: Monospace dark terminal with live line selector (50, 100, 250 lines) and copy-to-clipboard.
     - **Safe Restart Trigger**: Restart container directly with confirmation prompt.

4. **Zero-Overhead Single Container Deployment**:
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
STORAGE_MOUNTS=/,/mnt/hdd-media,/mnt/hdd-cloud,/mnt/hdd-music
```

### 2. Launch Container

```bash
docker compose up -d --build
```

Dashboard will be accessible at:
👉 **`http://192.168.18.225:8050`** (or `http://localhost:8050`)

---

## 🔑 Setting Up Proxmox VE API Token

To allow Homelab Cockpit to read CPU, RAM, and thermal metrics from your Proxmox Host (192.168.18.224):

1. Login to **Proxmox VE Web UI** (`https://192.168.18.224:8006`).
2. Go to **Datacenter** → **Permissions** → **API Tokens** → Click **Add**:
   - **User**: `root@pam` (or a dedicated monitoring user)
   - **Token ID**: `cockpit`
   - **Privilege Separation**: Unchecked (or grant `PVEAuditor` role)
3. Copy the generated **Secret Token** (UUID).
4. Fill in `.env`:
   ```env
   PROXMOX_TOKEN_ID=root@pam!cockpit
   PROXMOX_TOKEN_SECRET=your-secret-token-here
   ```

*(Note: If no Proxmox token is configured yet, the dashboard automatically generates simulated high-fidelity telemetry so the UI remains fully functional).*

---

## 💻 Local Development

Run backend and frontend concurrently in development mode:

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# Run dev mode
npm run dev:server   # Fastify on http://localhost:3000
npm run dev:client   # Vite on http://localhost:5173 with proxy
```

### Production Build Test

```bash
npm run build
npm start
```

---

## 📁 Repository Structure

```
homelab-dashboard/
├── client/                     # Vite + React 18 + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # Cockpit UI components
│   │   │   ├── Header.tsx
│   │   │   ├── HostHealthSection.tsx
│   │   │   ├── StorageMatrixSection.tsx
│   │   │   ├── ContainerGridSection.tsx
│   │   │   ├── Sparkline.tsx   # SVG micro-sparklines
│   │   │   ├── LogModal.tsx    # Live terminal log viewer
│   │   │   └── RestartModal.tsx# Safe restart dialog
│   │   ├── hooks/
│   │   │   └── useCockpitData.ts # Real-time WebSocket hook
│   │   ├── utils/              # Unit formatters & thresholds
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                     # Fastify + TypeScript Backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── docker.service.ts    # Docker Engine API & stats calculation
│   │   │   ├── proxmox.service.ts   # Proxmox REST API client
│   │   │   ├── system.service.ts    # Filesystem & systeminformation
│   │   │   └── collector.service.ts # Real-time WebSocket aggregator
│   │   ├── config.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml          # Production homelab deployment
├── Dockerfile                  # Multi-stage ultra-slim image
├── .env.example                # Environment variables template
└── README.md
```

---

## 📜 License
MIT License. Crafted for homelab owners and self-hosters.
