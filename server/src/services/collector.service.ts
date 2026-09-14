import type { WebSocket, RawData } from 'ws';
import { DockerService } from './docker.service.js';
import { ProxmoxService } from './proxmox.service.js';
import { SystemService } from './system.service.js';
import { TailscaleService } from './tailscale.service.js';
import { SslService } from './ssl.service.js';
import { PinsService } from './pins.service.js';
import { GitProjectsService } from './git-projects.service.js';
import { CockpitSnapshot, SentinelStatus, DockerHostSummary, AppVersionInfo } from '../types.js';
import { config } from '../config.js';

export class CollectorService {
  private dockerServices: DockerService[];
  private proxmoxService: ProxmoxService;
  private systemService: SystemService;
  private tailscaleService: TailscaleService;
  private sslService: SslService;
  private pinsService: PinsService;
  private gitProjectsService: GitProjectsService;
  private getSentinelStatus?: () => SentinelStatus | undefined;
  private getAppVersion?: () => AppVersionInfo | undefined;
  private getPrimaryNodeName?: () => string | undefined;
  private wsClients: Set<WebSocket> = new Set();
  private timer: NodeJS.Timeout | null = null;
  private lastSnapshot: CockpitSnapshot | null = null;

  constructor(
    dockerServices: DockerService[],
    proxmoxService: ProxmoxService,
    systemService: SystemService,
    tailscaleService: TailscaleService,
    sslService: SslService,
    pinsService: PinsService,
    gitProjectsService: GitProjectsService,
    getSentinelStatus?: () => SentinelStatus | undefined,
    getAppVersion?: () => AppVersionInfo | undefined,
    getPrimaryNodeName?: () => string | undefined
  ) {
    this.dockerServices = dockerServices;
    this.proxmoxService = proxmoxService;
    this.systemService = systemService;
    this.tailscaleService = tailscaleService;
    this.sslService = sslService;
    this.pinsService = pinsService;
    this.gitProjectsService = gitProjectsService;
    this.getSentinelStatus = getSentinelStatus;
    this.getAppVersion = getAppVersion;
    this.getPrimaryNodeName = getPrimaryNodeName;
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
    const localRootStats = this.systemService.safeStatfs('/');
    const rootUsage = localRootStats ? { used: localRootStats.used, total: localRootStats.total } : undefined;

    const [pveMetrics, dockerHostMetrics, tailscaleData, pveStorage, sslCerts, diskHygiene] = await Promise.all([
      this.proxmoxService.getMetrics(rootUsage),
      this.systemService.getDockerHostMetrics(),
      this.tailscaleService.getStatus(),
      this.proxmoxService.getStorageVitals(rootUsage),
      this.sslService.getCertificates(),
      this.dockerServices[0].getDiskHygiene(),
    ]);

    const customNodeName = this.getPrimaryNodeName ? this.getPrimaryNodeName() : undefined;
    if (customNodeName) {
      pveMetrics.nodeName = customNodeName;
      dockerHostMetrics.hostname = customNodeName;
    }

    const storageData = await this.systemService.getStorageMatrix(pveStorage);

    const selfTailscaleIp = tailscaleData.devices.find(d => d.isCurrentDevice)?.ipv4 || '100.110.20.15';

    const perHostResults = await Promise.all(
      this.dockerServices.map(async (service) => ({
        service,
        result: await service.getContainers(selfTailscaleIp),
      }))
    );

    const dockerHosts: DockerHostSummary[] = perHostResults.map(({ service, result }) => ({
      name: service.name,
      connected: service.isConnected(),
      containerCount: result.containers.length,
    }));

    const anyLive = perHostResults.some(({ result }) => result.isLive);
    const allContainers = perHostResults.flatMap(({ result }) => result.containers);

    const pins = this.pinsService.getAll();
    const containers = allContainers.map(container => {
      const pin = pins[container.name];
      return pin
        ? { ...container, isPinned: true, publicUrl: pin.publicUrl }
        : container;
    });

    const gitProjects = this.gitProjectsService.getSnapshot();
    const sentinel = this.getSentinelStatus ? this.getSentinelStatus() : undefined;
    const appVersion = this.getAppVersion ? this.getAppVersion() : undefined;

    const snapshot: CockpitSnapshot = {
      timestamp: Date.now(),
      host: {
        pve: pveMetrics,
        dockerHost: dockerHostMetrics,
      },
      storage: storageData,
      tailscale: tailscaleData,
      containers,
      dockerHosts,
      sslCertificates: sslCerts,
      dockerHygiene: diskHygiene,
      gitProjects,
      sentinel,
      isDemoMode: !anyLive || config.demoMode,
      appVersion,
    };

    this.lastSnapshot = snapshot;
    return snapshot;
  }

  public getDockerServiceForContainer(id: string): DockerService | undefined {
    const container = this.lastSnapshot?.containers.find((c) => c.id === id || c.shortId === id);
    if (!container) return undefined;
    return this.dockerServices.find((service) => service.name === container.dockerHost);
  }

  public async collectAndBroadcast() {
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
