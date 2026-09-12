import React from 'react';
import { Cpu, MemoryStick as Memory, Thermometer, Clock, ShieldCheck, Box, Gauge } from 'lucide-react';
import { HostMetrics } from '../types.js';
import { formatBytes, formatUptime, getStatusColor, getTempColor } from '../utils/formatters.js';

interface HostHealthSectionProps {
  host: HostMetrics | undefined;
}

export const HostHealthSection: React.FC<HostHealthSectionProps> = ({ host }) => {
  if (!host) {
    return <div className="h-44 rounded-xl bg-slate-900/60 animate-pulse border border-slate-800" />;
  }

  const { pve, dockerHost } = host;
  const pveCpuColors = getStatusColor(pve.cpuPercent);
  const pveRamColors = getStatusColor(pve.ramPercent);
  const pveTempInfo = getTempColor(pve.cpuTempCelsius || 48);

  const lxcCpuColors = getStatusColor(dockerHost.cpuPercent);
  const lxcRamColors = getStatusColor(dockerHost.ramPercent);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Host PVE Hardware Card */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 relative overflow-hidden shadow-md">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 opacity-80" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  Host Hypervisor (Proxmox VE)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {pve.nodeName}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {pve.cpuModel || 'Intel Core i5-7500 (4C/4T)'} • {pve.pveVersion || 'PVE 8.2'}
              </p>
            </div>
          </div>

          {/* Thermal Sensor Badge */}
          {pve.cpuTempCelsius && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-bold ${pveTempInfo.color}`}>
              <Thermometer className="w-3.5 h-3.5" />
              <span>{pve.cpuTempCelsius.toFixed(1)}°C</span>
              <span className="text-[10px] opacity-75">{pveTempInfo.label}</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Host CPU */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Host CPU Load
              </span>
              <span className={`text-xs font-mono font-bold ${pveCpuColors.text}`}>
                {pve.cpuPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${pveCpuColors.bar}`}
                style={{ width: `${Math.min(100, Math.max(3, pve.cpuPercent))}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-mono text-slate-500">
              <span>{pve.cpuCores} Cores Active</span>
              <span>Hardware Total</span>
            </div>
          </div>

          {/* Host RAM */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Memory className="w-3.5 h-3.5 text-indigo-400" />
                Host RAM Usage
              </span>
              <span className={`text-xs font-mono font-bold ${pveRamColors.text}`}>
                {pve.ramPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${pveRamColors.bar}`}
                style={{ width: `${Math.min(100, Math.max(3, pve.ramPercent))}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-mono text-slate-500">
              <span>{formatBytes(pve.ramUsedBytes)}</span>
              <span>{formatBytes(pve.ramTotalBytes)}</span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Uptime: <strong className="text-slate-200">{formatUptime(pve.uptimeSeconds)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Node IP:</span>
            <span className="text-cyan-400 font-semibold">{pve.ip}</span>
          </div>
        </div>
      </div>

      {/* Container Runner (Ubuntu LXC) Card */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 relative overflow-hidden shadow-md">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                  Docker Host Runner (Ubuntu LXC)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {dockerHost.hostname}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Unprivileged Container • Docker 26.x • 28 Containers
              </p>
            </div>
          </div>

          {/* Load Average Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900/90 text-xs font-mono text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Load:</span>
            <span className="text-indigo-300 font-bold">{dockerHost.loadAverage.join(', ')}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* LXC CPU */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                LXC CPU Load
              </span>
              <span className={`text-xs font-mono font-bold ${lxcCpuColors.text}`}>
                {dockerHost.cpuPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${lxcCpuColors.bar}`}
                style={{ width: `${Math.min(100, Math.max(3, dockerHost.cpuPercent))}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-mono text-slate-500">
              <span>Guest Container Load</span>
              <span>All Cores</span>
            </div>
          </div>

          {/* LXC RAM */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Memory className="w-3.5 h-3.5 text-purple-400" />
                LXC Active Memory
              </span>
              <span className={`text-xs font-mono font-bold ${lxcRamColors.text}`}>
                {dockerHost.ramPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${lxcRamColors.bar}`}
                style={{ width: `${Math.min(100, Math.max(3, dockerHost.ramPercent))}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-mono text-slate-500">
              <span>{formatBytes(dockerHost.ramUsedBytes)}</span>
              <span>{formatBytes(dockerHost.ramTotalBytes)}</span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Runner Uptime: <strong className="text-slate-200">{formatUptime(dockerHost.uptimeSeconds)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Runner IP:</span>
            <span className="text-indigo-400 font-semibold">{dockerHost.ip}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
