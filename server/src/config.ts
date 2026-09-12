import dotenv from 'dotenv';
dotenv.config();

export interface DockerHostConfig {
  name: string;
  socketPath?: string;
  url?: string;
}

function parseDockerHosts(raw: string | undefined): DockerHostConfig[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, url] = entry.split('=').map((s) => s.trim());
      return { name, url };
    })
    .filter((host) => host.name && host.url);
}

const primaryDockerHost: DockerHostConfig = {
  name: process.env.DOCKER_HOST_NAME || 'docker-host',
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
};

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  dockerSocket: primaryDockerHost.socketPath!,
  dockerHosts: [primaryDockerHost, ...parseDockerHosts(process.env.DOCKER_HOSTS)] as DockerHostConfig[],
  proxmox: {
    url: process.env.PROXMOX_URL || 'https://192.168.18.224:8006',
    node: process.env.PROXMOX_NODE || 'pve',
    tokenId: process.env.PROXMOX_TOKEN_ID || '', // e.g. root@pam!cockpit
    tokenSecret: process.env.PROXMOX_TOKEN_SECRET || '',
    rejectUnauthorized: process.env.PROXMOX_REJECT_UNAUTHORIZED === 'true',
  },
  tailscale: {
    apiKey: process.env.TAILSCALE_API_KEY || '',
    tailnet: process.env.TAILSCALE_TAILNET || '',
    socketPath: process.env.TAILSCALE_SOCKET || '/var/run/tailscale/tailscaled.sock',
  },
  storageMounts: (process.env.STORAGE_MOUNTS || '/,/mnt/hdd-media,/mnt/hdd-cloud,/mnt/hdd-music')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '2000', 10),
  demoMode: process.env.DEMO_MODE === 'true',
  sentinel: {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedUserIds: (process.env.TELEGRAM_ALLOWED_USER_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    managedContainers: (process.env.MANAGED_CONTAINERS || 'jellyfin,nextcloud,t3-code,nginx-proxy-manager,uptime-kuma,portainer-ce,transmission,paperless-ngx,home-assistant')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  },
};
