import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { HostMetrics } from '../types.js';
import { formatBytes, formatUptime, redactText, getStatusColor } from '../utils/formatters.js';
import { Bar, Row } from './hostVitalsShared.js';

interface HostDetailPanelsProps {
  host: HostMetrics | undefined;
  isPrivacyMode?: boolean;
}

export const HostDetailPanels: React.FC<HostDetailPanelsProps> = ({ host, isPrivacyMode = false }) => {
  if (!host) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  const { pve, dockerHost } = host;
  const lxcCpuTone = getStatusColor(dockerHost.cpuPercent);
  const lxcRamTone = getStatusColor(dockerHost.ramPercent);
  const backup = pve.backupVitals;
  const throttle = dockerHost.thermalThrottle;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Proxmox VE node</h3>
            <p className="panel-sub">Hypervisor · {pve.nodeName}</p>
          </div>
          <span className={`pill ${pve.connected ? 'pill-good' : 'pill-warn'}`}>
            {pve.connected ? 'Online' : 'Simulated'}
          </span>
        </div>
        <div className="px-5 py-1.5">
          <Row label="Address">{redactText(pve.ip, isPrivacyMode)}</Row>
          <Row label="Cores">{pve.cpuCores} threads</Row>
          {pve.storageVitals?.physicalDisk && (
            <Row label="Host SSD">
              {pve.storageVitals.physicalDisk.model} ({formatBytes(pve.storageVitals.physicalDisk.sizeBytes)})
            </Row>
          )}
          <Row label="Version">{pve.pveVersion || 'PVE 8.x'}</Row>
          <Row label="Uptime">{formatUptime(pve.uptimeSeconds)}</Row>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Docker runner LXC</h3>
            <p className="panel-sub">Container host · {dockerHost.hostname}</p>
          </div>
          {throttle?.isThrottling ? (
            <span className="pill pill-bad">
              <AlertTriangle className="h-3 w-3" />
              Throttled
            </span>
          ) : (
            <span className="pill pill-neutral">{throttle?.fanSpeedPercent ?? 35}% fan</span>
          )}
        </div>
        <div className="space-y-3.5 px-5 py-4">
          <div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-cockpit-muted">CPU</span>
              <span className={`metric ${lxcCpuTone.text}`}>{dockerHost.cpuPercent.toFixed(1)}%</span>
            </div>
            <Bar percent={dockerHost.cpuPercent} tone={lxcCpuTone.bar} />
          </div>
          <div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-cockpit-muted">Memory</span>
              <span className={`metric ${lxcRamTone.text}`}>
                {formatBytes(dockerHost.ramUsedBytes)} / {formatBytes(dockerHost.ramTotalBytes)}
              </span>
            </div>
            <Bar percent={dockerHost.ramPercent} tone={lxcRamTone.bar} />
          </div>
          <div className="flex items-center justify-between border-t border-cockpit-border pt-3 font-mono text-[11.5px] text-cockpit-muted">
            <span>
              Load <span className="tabular-nums text-cockpit-text">{dockerHost.loadAverage.join(' · ')}</span>
            </span>
            <span>Up {formatUptime(dockerHost.uptimeSeconds)}</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Backup vitals</h3>
            <p className="panel-sub">vzdump nightly archives</p>
          </div>
          <span className={`pill ${backup?.status === 'failed' ? 'pill-bad' : 'pill-good'}`}>
            {backup?.status || 'succeeded'}
          </span>
        </div>
        <div className="px-5 py-1.5">
          <Row label="Target">{backup?.vmid || '100 (docker-host)'}</Row>
          <Row label="Last run">{backup?.lastBackupTime || 'Today, 03:00'}</Row>
          <Row label="Archive size">{backup ? formatBytes(backup.backupSizeBytes) : '14.85 GB'}</Row>
          <Row label="Duration">{backup?.durationSeconds ?? 252}s</Row>
          <Row label="Storage">
            <span className="block max-w-[160px] truncate" title={backup?.targetStorage}>
              {backup?.targetStorage || 'pve-backup (DAS bay 2)'}
            </span>
          </Row>
        </div>
      </section>
    </div>
  );
};
