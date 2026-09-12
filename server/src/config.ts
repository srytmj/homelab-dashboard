import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  proxmox: {
    url: process.env.PROXMOX_URL || 'https://192.168.18.224:8006',
    node: process.env.PROXMOX_NODE || 'pve',
    tokenId: process.env.PROXMOX_TOKEN_ID || '', // e.g. root@pam!cockpit
    tokenSecret: process.env.PROXMOX_TOKEN_SECRET || '',
    rejectUnauthorized: process.env.PROXMOX_REJECT_UNAUTHORIZED === 'true',
  },
  storageMounts: (process.env.STORAGE_MOUNTS || '/,/mnt/hdd-media,/mnt/hdd-cloud,/mnt/hdd-music')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '2000', 10),
  demoMode: process.env.DEMO_MODE === 'true',
};
