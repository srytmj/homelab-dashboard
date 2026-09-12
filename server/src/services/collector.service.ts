import type { WebSocket, RawData } from 'ws';
import { DockerService } from './docker.service.js';
import { ProxmoxService } from './proxmox.service.js';
import { SystemService } from './system.service.js';
import { CockpitSnapshot } from '../types.js';
import { config } from '../config.js';

export class CollectorService {
  private dockerService: DockerService;
  private proxmoxService: ProxmoxService;
  private systemService: SystemService;
  private wsClients: Set<WebSocket> = new Set();
  private timer: NodeJS.Timeout | null = null;
  private lastSnapshot: CockpitSnapshot | null = null;

  constructor(
    dockerService: DockerService,
    proxmoxService: ProxmoxService,
    systemService: SystemService
  ) {
    this.dockerService = dockerService;
    this.proxmoxService = proxmoxService;
    this.systemService = systemService;
  }

  public start() {
    // Initial fetch
    this.collectAndBroadcast();

    // Start ticker
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
    console.log(`[CollectorService] Client connected (total: ${this.wsClients.size})`);

    // Send immediate snapshot upon connection
    if (this.lastSnapshot) {
      ws.send(JSON.stringify({ type: 'SNAPSHOT', data: this.lastSnapshot }));
    }

    ws.on('close', () => {
      this.wsClients.delete(ws);
      console.log(`[CollectorService] Client disconnected (remaining: ${this.wsClients.size})`);
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
        // ignore malformed message
      }
    });
  }

  public async collect(): Promise<CockpitSnapshot> {
    const [pveMetrics, dockerHostMetrics, containerData, storageData] = await Promise.all([
      this.proxmoxService.getMetrics(),
      this.systemService.getDockerHostMetrics(),
      this.dockerService.getContainers(),
      this.systemService.getStorageMatrix(),
    ]);

    const snapshot: CockpitSnapshot = {
      timestamp: Date.now(),
      host: {
        pve: pveMetrics,
        dockerHost: dockerHostMetrics,
      },
      storage: storageData,
      containers: containerData.containers,
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
          if (client.readyState === 1) { // WebSocket.OPEN = 1
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
