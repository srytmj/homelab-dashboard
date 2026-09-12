import { SslCertificate } from '../types.js';

export class SslService {
  public async getCertificates(): Promise<SslCertificate[]> {
    const now = new Date();

    const certs: SslCertificate[] = [
      {
        id: 'ssl_jellyfin',
        domain: 'jellyfin.homelab.lan',
        service: 'Jellyfin Media Server',
        issuer: "Let's Encrypt Authority X3",
        validTo: new Date(now.getTime() + 64 * 86400000).toISOString().split('T')[0],
        daysRemaining: 64,
        status: 'healthy',
        autoRenewEnabled: true,
      },
      {
        id: 'ssl_nextcloud',
        domain: 'cloud.homelab.lan',
        service: 'Nextcloud Hub',
        issuer: "Let's Encrypt Authority X3",
        validTo: new Date(now.getTime() + 58 * 86400000).toISOString().split('T')[0],
        daysRemaining: 58,
        status: 'healthy',
        autoRenewEnabled: true,
      },
      {
        id: 'ssl_vaultwarden',
        domain: 'vault.homelab.lan',
        service: 'Vaultwarden Password Vault',
        issuer: "Let's Encrypt Authority X3",
        validTo: new Date(now.getTime() + 19 * 86400000).toISOString().split('T')[0],
        daysRemaining: 19,
        status: 'warning',
        autoRenewEnabled: true,
      },
      {
        id: 'ssl_npm',
        domain: 'npm.homelab.lan',
        service: 'Nginx Proxy Manager',
        issuer: "Let's Encrypt Authority X3",
        validTo: new Date(now.getTime() + 42 * 86400000).toISOString().split('T')[0],
        daysRemaining: 42,
        status: 'healthy',
        autoRenewEnabled: true,
      },
      {
        id: 'ssl_kuma',
        domain: 'kuma.homelab.lan',
        service: 'Uptime Kuma Healthcheck',
        issuer: "Let's Encrypt Authority X3",
        validTo: new Date(now.getTime() + 75 * 86400000).toISOString().split('T')[0],
        daysRemaining: 75,
        status: 'healthy',
        autoRenewEnabled: true,
      },
      {
        id: 'ssl_t3code',
        domain: 'code.homelab.lan',
        service: 'T3 Code IDE Server',
        issuer: "Let's Encrypt Authority X3",
        validTo: new Date(now.getTime() + 82 * 86400000).toISOString().split('T')[0],
        daysRemaining: 82,
        status: 'healthy',
        autoRenewEnabled: true,
      },
    ];

    return certs;
  }
}
