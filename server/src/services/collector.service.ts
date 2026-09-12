import type { WebSocket, RawData } from 'ws';
import { DockerService } from './docker.service.js';
import { ProxmoxService } from './proxmox.service.js';
import { SystemService } from './system.service.js';
import { TailscaleService } from './tailscale.service.js';
import { SslService } from './ssl.service.js';
import { CockpitSnapshot, NativeConsoleItem } from '../types.js';
import { config } from '../config.js';

export class CollectorService {
  private dockerService: DockerService;
  private proxmoxService: ProxmoxService;
  private systemService: SystemService;
  private tailscaleService: TailscaleService;
  private sslService: SslService;
  private wsClients: Set<WebSocket> = new Set();
  private timer: NodeJS.Timeout | null = null;
  private lastSnapshot: CockpitSnapshot | null = null;

  constructor(
    dockerService: DockerService,
    proxmoxService: ProxmoxService,
    systemService: SystemService,
    tailscaleService: TailscaleService,
    sslService: SslService
  ) {
    this.dockerService = dockerService;
    this.proxmoxService = proxmoxService;
    this.systemService = systemService;
    this.tailscaleService = tailscaleService;
    this.sslService = sslService;
  }

  public start() {
    this.collectAndBroadcast();

    this.timer = setInterval(() => {
      this.collectAndBroadcast();
    }, config.pollIntervalMs);

    console.log(`[CollectorService] Real-time metrics collector running (interval: ${config.pollIntervalMs}ms)`);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public addClient(ws: WebSocket) {
    this.wsClients.add(ws);

    if (this.lastSnapshot) {
      ws.send(JSON.stringify({ type: 'SNAPSHOT', data: this.lastSnapshot }));
    }

    ws.on('close', () => {
      this.wsClients.delete(ws);
    });

    ws.on('message', async (message: RawData) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        } else if (payload.type === 'REQUEST_SNAPSHOT') {
          const snapshot = await this.collect();
          ws.send(JSON.stringify({ type: 'SNAPSHOT', data: snapshot }));
        }
      } catch {
        // ignore
      }
    });
  }

  public async collect(): Promise<CockpitSnapshot> {
    const [pveMetrics, dockerHostMetrics, tailscaleData, storageData, sslCerts, diskHygiene] = await Promise.all([
      this.proxmoxService.getMetrics(),
      this.systemService.getDockerHostMetrics(),
      this.tailscaleService.getStatus(),
      this.systemService.getStorageMatrix(),
      this.sslService.getCertificates(),
      this.dockerService.getDiskHygiene(),
    ]);

    const selfTailscaleIp = tailscaleData.devices.find(d => d.isCurrentDevice)?.ipv4 || '100.110.20.15';
    const containerData = await this.dockerService.getContainers(selfTailscaleIp);

    const consoles: NativeConsoleItem[] = [
      {
        id: 'console_pve',
        name: 'Proxmox VE',
        category: 'hypervisor',
        description: 'Bare-metal Hypervisor Node & VM/LXC Manager',
        port: 8006,
        protocol: 'https',
        lanHost: '192.168.18.224',
        tailscaleHost: '100.110.20.14',
        badge: 'Node PVE',
        status: pveMetrics.connected ? 'online' : 'online',
      },
      {
        id: 'console_portainer',
        name: 'Portainer CE',
        category: 'containers',
        description: 'Docker Stacks & Container UI Manager',
        port: 9000,
        protocol: 'http',
        lanHost: '192.168.18.225',
        tailscaleHost: selfTailscaleIp,
        badge: ':9000',
        status: 'online',
      },
      {
        id: 'console_npm',
        name: 'Nginx Proxy Manager',
        category: 'proxy',
        description: 'Reverse Proxy & Let\'s Encrypt SSL Gateway',
        port: 81,
        protocol: 'http',
        lanHost: '192.168.18.225',
        tailscaleHost: selfTailscaleIp,
        badge: ':81 Admin',
        status: 'online',
      },
      {
        id: 'console_netdata',
        name: 'Netdata',
        category: 'monitoring',
        description: 'Per-second OS & Hardware Kernel Telemetry',
        port: 19999,
        protocol: 'http',
        lanHost: '192.168.18.225',
        tailscaleHost: selfTailscaleIp,
        badge: ':19999',
        status: 'online',
      },
      {
        id: 'console_kuma',
        name: 'Uptime Kuma',
        category: 'monitoring',
        description: 'Service Health Status & Alert Notifications',
        port: 3001,
        protocol: 'http',
        lanHost: '192.168.18.225',
        tailscaleHost: selfTailscaleIp,
        badge: ':3001',
        status: 'online',
      },
      {
        id: 'console_adguard',
        name: 'AdGuard Home',
        category: 'security',
        description: 'Network-wide DNS Adblocker & Local DNS Sinkhole',
        port: 3000,
        protocol: 'http',
        lanHost: '192.168.18.225',
        tailscaleHost: selfTailscaleIp,
        badge: ':3000 DNS',
        status: 'online',
      },
      {
        id: 'console_t3code',
        name: 'T3 Code Web IDE',
        category: 'tools',
        description: 'Antigravity Autonomous IDE Workspace',
        port: 7860,
        protocol: 'http',
        lanHost: '192.168.18.225',
        tailscaleHost: selfTailscaleIp,
        badge: ':7860 IDE',
        status: 'online',
      },
      {
        id: 'console_jellyfin',
        name: 'Jellyfin Media',
        category: 'tools',
        description: 'Direct Streaming Video & 4K Transcoding',
        port: 8096,
        protocol: 'http',
        lanHost: '192.168.18.225',
        tailscaleHost: selfTailscaleIp,
        badge: ':8096',
        status: 'online',
      },
    ];

    const snapshot: CockpitSnapshot = {
      timestamp: Date.now(),
      host: {
        pve: pveMetrics,
        dockerHost: dockerHostMetrics,
      },
      storage: storageData,
      tailscale: tailscaleData,
      containers: containerData.containers,
      sslCertificates: sslCerts,
      dockerHygiene: diskHygiene,
      consoles,
      isDemoMode: !containerData.isLive || config.demoMode,
    };

    this.lastSnapshot = snapshot;
    return snapshot;
  }

  private async collectAndBroadcast() {
    try {
      const snapshot = await this.collect();
      if (this.wsClients.size > 0) {
        const message = JSON.stringify({ type: 'SNAPSHOT', data: snapshot });
        for (const client of this.wsClients) {
          if (client.readyState === 1) { // OPEN
            client.send(message);
          }
        }
      }
    } catch (err) {
      console.error(`[CollectorService] Error during metrics collection:`, err);
    }
  }

  public getLastSnapshot(): CockpitSnapshot | null {
    return this.lastSnapshot;
  }
}
