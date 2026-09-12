import React from 'react';
import { ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';
import { HostMetrics } from '../types.js';
import { formatBytes, formatNetworkRate, formatUptime, redactText, getStatusColor, getTempColor } from '../utils/formatters.js';

interface HostHealthSectionProps {
  host: HostMetrics | undefined;
  throughput?: { rx: number; tx: number };
  isPrivacyMode?: boolean;
}

const Tile: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="panel px-4 py-3.5">
    <p className="label">{label}</p>
    <div className="mt-3">{children}</div>
  </div>
);

const Bar: React.FC<{ percent: number; tone: string }> = ({ percent, tone }) => (
  <div className="track mt-3">
    <span className={`track-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(2, percent))}%` }} />
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="data-row">
    <span className="text-cockpit-muted">{label}</span>
    <span className="metric text-[12.5px]">{children}</span>
  </div>
);

export const HostHealthSection: React.FC<HostHealthSectionProps> = ({ host, throughput, isPrivacyMode = false }) => {
  if (!host) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel h-[104px] animate-pulse" />
        ))}
      </div>
    );
  }

  const { pve, dockerHost } = host;
  const cpuTone = getStatusColor(pve.cpuPercent);
  const ramTone = getStatusColor(pve.ramPercent);
  const lxcCpuTone = getStatusColor(dockerHost.cpuPercent);
  const lxcRamTone = getStatusColor(dockerHost.ramPercent);

  const backup = pve.backupVitals;
  const throttle = dockerHost.thermalThrottle;
  const temp = pve.cpuTempCelsius ?? throttle?.packageTempCelsius ?? 48;
  const tempTone = getTempColor(temp);
  const tempScale = ((temp - 30) / 60) * 100;

  return (
    <div className="space-y-4">
      {/* Headline vitals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="CPU · Proxmox">
          <div className="metric-lg">
            {pve.cpuPercent.toFixed(1)}
            <span className="metric-unit">%</span>
          </div>
          <Bar percent={pve.cpuPercent} tone={cpuTone.bar} />
        </Tile>

        <Tile label="Memory · 32GB">
          <div className="metric-lg">
            {formatBytes(pve.ramUsedBytes)}
            <span className="metric-unit">of {formatBytes(pve.ramTotalBytes)}</span>
          </div>
          <Bar percent={pve.ramPercent} tone={ramTone.bar} />
        </Tile>

        <Tile label="Fleet throughput">
          <div className="flex items-baseline gap-3">
            <span className="metric-lg flex items-baseline">
              <ArrowDown className="mr-1 h-3.5 w-3.5 self-center text-cockpit-accent" />
              {formatNetworkRate(throughput?.rx ?? 0)}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-1 font-mono text-[11.5px] tabular-nums text-cockpit-muted">
            <ArrowUp className="h-3 w-3" />
            {formatNetworkRate(throughput?.tx ?? 0)} outbound
          </p>
        </Tile>

        <Tile label="Package temp">
          <div className={`metric-lg ${tempTone.text}`}>
            {temp.toFixed(1)}
            <span className="metric-unit">°C · {tempTone.label}</span>
          </div>
          <Bar percent={tempScale} tone={tempTone.bar} />
        </Tile>
      </div>

      {/* Node detail panels */}
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
    </div>
  );
};
