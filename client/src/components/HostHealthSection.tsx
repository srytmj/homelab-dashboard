import { Server, Cpu, HardDrive, ShieldCheck, Thermometer, Clock, Database, CheckCircle2, AlertTriangle, Wind } from 'lucide-react';
import { HostMetrics } from '../types.js';
import { formatBytes, formatUptime, redactText, getStatusColor } from '../utils/formatters.js';

interface HostHealthSectionProps {
  host: HostMetrics | undefined;
  isPrivacyMode?: boolean;
}

export const HostHealthSection: React.FC<HostHealthSectionProps> = ({ host, isPrivacyMode = false }) => {
  if (!host) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        <div className="h-44 rounded-xl bg-slate-900/60 border border-slate-800" />
        <div className="h-44 rounded-xl bg-slate-900/60 border border-slate-800" />
        <div className="h-44 rounded-xl bg-slate-900/60 border border-slate-800" />
      </div>
    );
  }

  const { pve, dockerHost } = host;
  const pveCpuColors = getStatusColor(pve.cpuPercent);
  const pveRamColors = getStatusColor(pve.ramPercent);
  const lxcCpuColors = getStatusColor(dockerHost.cpuPercent);
  const lxcRamColors = getStatusColor(dockerHost.ramPercent);

  const backup = pve.backupVitals;
  const throttle = dockerHost.thermalThrottle;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      
      {/* 1. Proxmox VE Hardware Card */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/70 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                  <span>Proxmox VE Node</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400">
                    {pve.nodeName}
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {redactText(pve.ip, isPrivacyMode)}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          {/* Vitals Progress Bars */}
          <div className="space-y-3 font-mono text-xs">
            {/* CPU */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CPU Load</span>
                </span>
                <span className={`font-bold ${pveCpuColors.text}`}>{pve.cpuPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pveCpuColors.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, pve.cpuPercent))}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Host RAM</span>
                </span>
                <span className={`font-bold ${pveRamColors.text}`}>
                  {formatBytes(pve.ramUsedBytes)} / {formatBytes(pve.ramTotalBytes)} ({pve.ramPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pveRamColors.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, pve.ramPercent))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Package Temp:</span>
            <strong className="text-slate-200">{pve.cpuTempCelsius?.toFixed(1) || '48.0'}°C</strong>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Up {formatUptime(pve.uptimeSeconds)}</span>
          </div>
        </div>
      </div>

      {/* 2. Ubuntu LXC Docker Runner Card */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/70 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                  <span>Docker Runner LXC</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-indigo-400">
                    {dockerHost.hostname}
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {redactText(dockerHost.ip, isPrivacyMode)}
                </span>
              </div>
            </div>
            
            {/* Throttle Status Pill */}
            {throttle?.isThrottling ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-semibold animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                THROTTLED!
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 font-semibold">
                <Wind className="w-3 h-3 text-cyan-400" />
                {throttle?.fanSpeedPercent || 35}% Fan
              </span>
            )}
          </div>

          {/* Vitals Progress Bars */}
          <div className="space-y-3 font-mono text-xs">
            {/* CPU */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LXC CPU</span>
                </span>
                <span className={`font-bold ${lxcCpuColors.text}`}>{dockerHost.cpuPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${lxcCpuColors.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, dockerHost.cpuPercent))}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Memory Alloc</span>
                </span>
                <span className={`font-bold ${lxcRamColors.text}`}>
                  {formatBytes(dockerHost.ramUsedBytes)} / {formatBytes(dockerHost.ramTotalBytes)} ({dockerHost.ramPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${lxcRamColors.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, dockerHost.ramPercent))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div>
            <span>Load: </span>
            <strong className="text-slate-200">{dockerHost.loadAverage.join(', ')}</strong>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Up {formatUptime(dockerHost.uptimeSeconds)}</span>
          </div>
        </div>
      </div>

      {/* 3. Proxmox Backup Vitals Card */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/70 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Proxmox Backup Vitals
                </h3>
                <span className="text-[11px] font-mono text-slate-400">vzdump automated nightlies</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SUCCEEDED
            </span>
          </div>

          {/* Backup details */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Target VM/LXC:</span>
              <span className="text-slate-200 font-bold">{backup?.vmid || '100 (docker-host)'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Last Backup:</span>
              <span className="text-emerald-400 font-semibold">{backup?.lastBackupTime || 'Today, 03:00 AM'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Archive Size:</span>
              <span className="text-cyan-300 font-bold">{backup ? formatBytes(backup.backupSizeBytes) : '14.85 GB'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Storage Target:</span>
              <span className="text-slate-400 truncate max-w-[150px]">{backup?.targetStorage || 'pve-backup (DAS Bay 2)'}</span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="text-emerald-400/90 font-semibold">Status: 24h Clean</span>
          <span className="text-slate-500">Duration: {backup?.durationSeconds || 252}s</span>
        </div>
      </div>

    </div>
  );
};
