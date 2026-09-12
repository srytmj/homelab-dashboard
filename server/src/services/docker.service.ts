import Docker from 'dockerode';
import fs from 'node:fs';
import { ContainerMetric } from '../types.js';
import { config } from '../config.js';

interface SparklineHistory {
  cpu: number[];
  memory: number[];
}

export class DockerService {
  private docker: Docker | null = null;
  private isDockerAvailable = false;
  private historyMap: Map<string, SparklineHistory> = new Map();
  private mockContainers: ContainerMetric[] = [];
  private lastMockUpdate = 0;

  constructor() {
    this.initDocker();
    this.initMockContainers();
  }

  private initDocker() {
    try {
      if (fs.existsSync(config.dockerSocket)) {
        this.docker = new Docker({ socketPath: config.dockerSocket });
        this.isDockerAvailable = true;
        console.log(`[DockerService] Connected to Docker socket at ${config.dockerSocket}`);
      } else {
        console.warn(`[DockerService] Docker socket not found at ${config.dockerSocket}. Using mock fallback.`);
        this.isDockerAvailable = false;
      }
    } catch (err) {
      console.warn(`[DockerService] Failed to initialize Docker client:`, err);
      this.isDockerAvailable = false;
    }
  }

  private initMockContainers() {
    const homelabServices = [
      { name: 'jellyfin', image: 'jellyfin/jellyfin:latest', ports: ['8096:8096'], baseCpu: 12.5, baseMemMB: 1450 },
      { name: 'nextcloud', image: 'nextcloud:apache', ports: ['8080:80'], baseCpu: 3.8, baseMemMB: 620 },
      { name: 't3-code', image: 't3-code:latest', ports: ['7860:7860'], baseCpu: 4.2, baseMemMB: 980 },
      { name: 'nginx-proxy-manager', image: 'jc21/nginx-proxy-manager:latest', ports: ['80:80', '443:443', '81:81'], baseCpu: 1.5, baseMemMB: 210 },
      { name: 'uptime-kuma', image: 'louislam/uptime-kuma:1', ports: ['3001:3001'], baseCpu: 1.2, baseMemMB: 180 },
      { name: 'portainer-ce', image: 'portainer/portainer-ce:latest', ports: ['9000:9000', '9443:9443'], baseCpu: 0.8, baseMemMB: 125 },
      { name: 'netdata', image: 'netdata/netdata:latest', ports: ['19999:19999'], baseCpu: 5.4, baseMemMB: 480 },
      { name: 'postgres-db', image: 'postgres:16-alpine', ports: ['5432:5432'], baseCpu: 2.1, baseMemMB: 390 },
      { name: 'redis-cache', image: 'redis:7-alpine', ports: ['6379:6379'], baseCpu: 0.5, baseMemMB: 85 },
      { name: 'vaultwarden', image: 'vaultwarden/server:latest', ports: ['8085:80'], baseCpu: 0.4, baseMemMB: 95 },
      { name: 'adguard-home', image: 'adguard/adguardhome:latest', ports: ['53:53/udp', '3000:3000'], baseCpu: 1.8, baseMemMB: 140 },
      { name: 'radarr', image: 'lscr.io/linuxserver/radarr:latest', ports: ['7878:7878'], baseCpu: 2.4, baseMemMB: 310 },
      { name: 'sonarr', image: 'lscr.io/linuxserver/sonarr:latest', ports: ['8989:8989'], baseCpu: 2.6, baseMemMB: 325 },
      { name: 'prowlarr', image: 'lscr.io/linuxserver/prowlarr:latest', ports: ['9696:9696'], baseCpu: 1.1, baseMemMB: 190 },
      { name: 'transmission', image: 'lscr.io/linuxserver/transmission:latest', ports: ['9091:9091', '51413:51413'], baseCpu: 3.2, baseMemMB: 280 },
      { name: 'photoprism', image: 'photoprism/photoprism:latest', ports: ['2342:2342'], baseCpu: 1.5, baseMemMB: 890 },
      { name: 'homarr', image: 'ghcr.io/ajnart/homarr:latest', ports: ['7575:7575'], baseCpu: 0.9, baseMemMB: 145 },
      { name: 'home-assistant', image: 'ghcr.io/home-assistant/home-assistant:stable', ports: ['8123:8123'], baseCpu: 4.8, baseMemMB: 750 },
      { name: 'mosquitto-mqtt', image: 'eclipse-mosquitto:2', ports: ['1883:1883'], baseCpu: 0.3, baseMemMB: 42 },
      { name: 'paperless-ngx', image: 'ghcr.io/paperless-ngx/paperless-ngx:latest', ports: ['8000:8000'], baseCpu: 2.0, baseMemMB: 680 },
      { name: 'mealie', image: 'ghcr.io/mealie-recipes/mealie:latest', ports: ['9925:9000'], baseCpu: 0.6, baseMemMB: 160 },
      { name: 'it-tools', image: 'corentinth/it-tools:latest', ports: ['8088:80'], baseCpu: 0.1, baseMemMB: 35 },
      { name: 'dozzle', image: 'amir20/dozzle:latest', ports: ['8888:8080'], baseCpu: 0.5, baseMemMB: 65 },
      { name: 'watchtower', image: 'containrrr/watchtower:latest', ports: [], baseCpu: 0.1, baseMemMB: 40 },
      { name: 'glances', image: 'nicolargo/glances:latest-full', ports: ['61208:61208'], baseCpu: 1.6, baseMemMB: 110 },
      { name: 'wireguard', image: 'lscr.io/linuxserver/wireguard:latest', ports: ['51820:51820/udp'], baseCpu: 0.4, baseMemMB: 50 },
      { name: 'navidrome', image: 'deluan/navidrome:latest', ports: ['4533:4533'], baseCpu: 1.2, baseMemMB: 240 },
      { name: 'traefik-cert-backup', image: 'alpine:latest', ports: [], baseCpu: 0.0, baseMemMB: 15 },
    ];

    const totalHostRamBytes = 32 * 1024 * 1024 * 1024; // 32GB
    const now = Date.now();

    this.mockContainers = homelabServices.map((svc, idx) => {
      const id = `mock_cnt_${svc.name.replace(/-/g, '_')}_${idx + 100}`;
      const shortId = id.slice(-12);
      const isRunning = svc.name !== 'traefik-cert-backup';
      const memBytes = isRunning ? svc.baseMemMB * 1024 * 1024 : 0;
      const memPercent = (memBytes / totalHostRamBytes) * 100;
      const cpu = isRunning ? svc.baseCpu : 0;

      // Seed sparkline history
      const cpuHistory = Array.from({ length: 12 }, () => Math.max(0, cpu + (Math.random() * 2 - 1)));
      const memHistory = Array.from({ length: 12 }, () => Math.max(10, memBytes / (1024 * 1024) + (Math.random() * 20 - 10)));

      this.historyMap.set(id, {
        cpu: cpuHistory,
        memory: memHistory,
      });

      return {
        id,
        shortId,
        name: svc.name,
        image: svc.image,
        state: isRunning ? 'running' : 'exited',
        status: isRunning ? 'Up 5 days' : 'Exited (0) 2 hours ago',
        cpuPercent: Number(cpu.toFixed(1)),
        memoryBytes: memBytes,
        memoryLimitBytes: totalHostRamBytes,
        memoryPercent: Number(memPercent.toFixed(2)),
        networkRxBytes: Math.floor(Math.random() * 500000000) + 10000000,
        networkTxBytes: Math.floor(Math.random() * 300000000) + 5000000,
        sparklineCpu: cpuHistory,
        sparklineMemory: memHistory,
        uptime: isRunning ? '5d 14h' : 'Down',
        ports: svc.ports,
        created: now - (idx * 86400000 * 3),
      };
    });
  }

  public async getContainers(): Promise<{ containers: ContainerMetric[]; isLive: boolean }> {
    if (this.isDockerAvailable && this.docker && !config.demoMode) {
      try {
        const liveContainers = await this.fetchLiveContainers();
        return { containers: liveContainers, isLive: true };
      } catch (err) {
        console.warn(`[DockerService] Live fetch failed, falling back to mock:`, err);
      }
    }

    return { containers: this.getSimulatedContainers(), isLive: false };
  }

  private async fetchLiveContainers(): Promise<ContainerMetric[]> {
    if (!this.docker) return [];

    const containers = await this.docker.listContainers({ all: true });
    const results: ContainerMetric[] = [];

    for (const info of containers) {
      const id = info.Id;
      const shortId = id.slice(0, 12);
      const name = (info.Names[0] || '').replace(/^\//, '');
      const state = info.State.toLowerCase() as ContainerMetric['state'];

      let cpuPercent = 0;
      let memBytes = 0;
      let memLimit = 0;
      let memPercent = 0;
      let rxBytes = 0;
      let txBytes = 0;

      if (state === 'running') {
        try {
          const container = this.docker.getContainer(id);
          // Get one-shot stats
          const stats = await container.stats({ stream: false });
          
          // CPU calculation
          const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
          const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
          const onlineCpus = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
          
          if (systemDelta > 0 && cpuDelta > 0) {
            cpuPercent = (cpuDelta / systemDelta) * onlineCpus * 100;
          }

          // Memory calculation
          memBytes = stats.memory_stats?.usage || 0;
          memLimit = stats.memory_stats?.limit || 1;
          memPercent = (memBytes / memLimit) * 100;

          // Network calculation
          if (stats.networks) {
            for (const iface of Object.values<any>(stats.networks)) {
              rxBytes += iface.rx_bytes || 0;
              txBytes += iface.tx_bytes || 0;
            }
          }
        } catch {
          // stats error handled gracefully
        }
      }

      // Sparklines update
      let history = this.historyMap.get(id);
      if (!history) {
        history = { cpu: [], memory: [] };
        this.historyMap.set(id, history);
      }

      history.cpu.push(Number(cpuPercent.toFixed(1)));
      if (history.cpu.length > 12) history.cpu.shift();

      const memMB = Math.round(memBytes / (1024 * 1024));
      history.memory.push(memMB);
      if (history.memory.length > 12) history.memory.shift();

      const ports = (info.Ports || []).map(p => 
        p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}${p.Type ? `/${p.Type}` : ''}` : `${p.PrivatePort}/${p.Type}`
      );

      results.push({
        id,
        shortId,
        name,
        image: info.Image,
        state,
        status: info.Status,
        cpuPercent: Number(cpuPercent.toFixed(1)),
        memoryBytes: memBytes,
        memoryLimitBytes: memLimit,
        memoryPercent: Number(memPercent.toFixed(2)),
        networkRxBytes: rxBytes,
        networkTxBytes: txBytes,
        sparklineCpu: [...history.cpu],
        sparklineMemory: [...history.memory],
        uptime: info.Status,
        ports,
        created: info.Created * 1000,
      });
    }

    return results;
  }

  private getSimulatedContainers(): ContainerMetric[] {
    const now = Date.now();
    const shouldJitter = now - this.lastMockUpdate > 1500;

    if (shouldJitter) {
      this.lastMockUpdate = now;
      for (const c of this.mockContainers) {
        if (c.state === 'running') {
          // slight jitter for realism
          const jitterCpu = Math.max(0.1, Number((c.cpuPercent + (Math.random() * 2.4 - 1.2)).toFixed(1)));
          c.cpuPercent = jitterCpu;
          
          const history = this.historyMap.get(c.id);
          if (history) {
            history.cpu.push(jitterCpu);
            if (history.cpu.length > 12) history.cpu.shift();
            c.sparklineCpu = [...history.cpu];

            const curMemMB = Math.round(c.memoryBytes / (1024 * 1024));
            const jitterMemMB = Math.max(20, curMemMB + Math.floor(Math.random() * 6 - 3));
            c.memoryBytes = jitterMemMB * 1024 * 1024;
            c.memoryPercent = Number(((c.memoryBytes / c.memoryLimitBytes) * 100).toFixed(2));
            history.memory.push(jitterMemMB);
            if (history.memory.length > 12) history.memory.shift();
            c.sparklineMemory = [...history.memory];
          }

          c.networkRxBytes += Math.floor(Math.random() * 250000);
          c.networkTxBytes += Math.floor(Math.random() * 120000);
        }
      }
    }

    return this.mockContainers;
  }

  public async restartContainer(id: string): Promise<{ success: boolean; message: string }> {
    if (this.isDockerAvailable && this.docker && !config.demoMode) {
      try {
        const container = this.docker.getContainer(id);
        await container.restart();
        return { success: true, message: `Container ${id.slice(0, 12)} restarted successfully` };
      } catch (err: any) {
        return { success: false, message: `Failed to restart: ${err.message}` };
      }
    }

    // Mock restart
    const target = this.mockContainers.find(c => c.id === id || c.shortId === id);
    if (target) {
      target.state = 'running';
      target.status = 'Up Less than a second (Restarted)';
      target.uptime = '0s';
      return { success: true, message: `Mock Container ${target.name} restarted successfully` };
    }

    return { success: false, message: `Container ${id} not found` };
  }

  public async getLogs(id: string, tail = 100): Promise<{ logs: string }> {
    if (this.isDockerAvailable && this.docker && !config.demoMode) {
      try {
        const container = this.docker.getContainer(id);
        const logBuffer = await container.logs({
          stdout: true,
          stderr: true,
          tail,
          timestamps: true,
        });
        return { logs: logBuffer.toString('utf-8') };
      } catch (err: any) {
        return { logs: `Error fetching logs from docker daemon: ${err.message}` };
      }
    }

    // Mock logs
    const target = this.mockContainers.find(c => c.id === id || c.shortId === id);
    const serviceName = target ? target.name : 'service';
    const now = new Date().toISOString();

    const mockLogs = [
      `[${now}] [INFO] Starting ${serviceName} homelab daemon v2.4.1...`,
      `[${now}] [INFO] Loading configuration from /etc/${serviceName}/config.yaml`,
      `[${now}] [INFO] Initialized storage cache and database connection pool (pool_size=10)`,
      `[${now}] [DEBUG] Worker heartbeat acknowledged. Active connections: 4`,
      `[${now}] [INFO] Service bound to 0.0.0.0, listening for inbound traffic`,
      `[${now}] [INFO] Healthcheck probe status: HTTP 200 OK (latency: 1.4ms)`,
      `[${now}] [INFO] Background sync completed. 0 anomalies detected.`,
      `[${now}] [LOG] Ready to process incoming requests.`,
    ].join('\n');

    return { logs: mockLogs };
  }
}
