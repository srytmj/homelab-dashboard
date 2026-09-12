import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { HostMetrics } from '../types.js';
import { formatBytes, formatNetworkRate, getStatusColor, getTempColor } from '../utils/formatters.js';
import { Tile, Bar } from './hostVitalsShared.js';

interface HostSummaryTilesProps {
  host: HostMetrics | undefined;
  throughput?: { rx: number; tx: number };
}

export const HostSummaryTiles: React.FC<HostSummaryTilesProps> = ({ host, throughput }) => {
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
  const temp = pve.cpuTempCelsius ?? dockerHost.thermalThrottle?.packageTempCelsius ?? 48;
  const tempTone = getTempColor(temp);
  const tempScale = ((temp - 30) / 60) * 100;

  return (
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
  );
};
