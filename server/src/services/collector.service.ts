import type { WebSocket, RawData } from 'ws';
import { DockerService } from './docker.service.js';
import { ProxmoxService } from './proxmox.service.js';
import { SystemService } from './system.service.js';
import { TailscaleService } from './tailscale.service.js';
import { SslService } from './ssl.service.js';
import { CockpitSnapshot } from '../types.js';
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
