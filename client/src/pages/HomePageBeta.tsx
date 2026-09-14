import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  TerminalSquare,
  ShieldAlert,
  Cpu,
  HardDrive,
  Network,
  Activity,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  Terminal,
  Boxes,
  Server,
  GitBranch,
  Bot,
  Sparkles,
} from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { redactText, formatBytes, getStatusColor, getTempColor } from '../utils/formatters.js';
import { AppUpdateBanner } from '../components/AppUpdateBanner.js';
import { BookmarksSection } from '../components/BookmarksSection.js';

interface HomePageBetaProps {
  snapshot: CockpitSnapshot | null;
  throughput: { rx: number; tx: number };
  isPrivacyMode: boolean;
  onOpenCommandPalette?: () => void;
}

export const HomePageBeta: React.FC<HomePageBetaProps> = ({
  snapshot,
  throughput,
  isPrivacyMode,
  onOpenCommandPalette,
}) => {
  const pve = snapshot?.host.pve;
  const dockerHost = snapshot?.host.dockerHost;
  
  const runningCount = snapshot?.containers.filter((c) => c.state === 'running').length ?? 0;
  const totalCount = snapshot?.containers.length ?? 0;
  const pinnedCount = snapshot?.containers.filter((c) => c.isPinned).length ?? 0;

  // CPU Telemetry
  const cpuPercent = pve?.cpuPercent ?? 0;
  const cpuTone = getStatusColor(cpuPercent);
  const cpuModel = pve?.cpuModel;

  // RAM Telemetry
  const ramUsedBytes = pve?.ramUsedBytes ?? 0;
  const ramTotalBytes = pve?.ramTotalBytes || (dockerHost?.ramTotalBytes ?? 0);
  const ramPercent = pve?.ramPercent ?? (ramTotalBytes > 0 ? (ramUsedBytes / ramTotalBytes) * 100 : 0);
  const ramTone = getStatusColor(ramPercent);

  // Thermal Sensor
  const temp = pve?.cpuTempCelsius ?? dockerHost?.thermalThrottle?.packageTempCelsius;
  const tempTone = temp != null ? getTempColor(temp) : null;

  // Storage Matrix
  const storageList = snapshot?.storage || [];
  const rootDrive = storageList.find((s) => s.isPhysicalRoot || s.mount === '/dev/sda (/)' || s.mount === '/');
  const detachedCount = storageList.filter((s) => s.isDisconnected || s.canaryPresent === false).length;
  const totalUsedBytes = storageList.reduce((acc, s) => acc + (s.usedBytes || 0), 0);
  const totalCapacityBytes = storageList.reduce((acc, s) => acc + (s.totalBytes || 0), 0);
  const overallUsedPercent = totalCapacityBytes > 0 ? (totalUsedBytes / totalCapacityBytes) * 100 : 0;
  const externalCount = storageList.filter((s) => s.isExternal).length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-4 border-cockpit-text pb-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-cockpit-text text-cockpit-bg px-2 py-0.5 text-xs font-bold tracking-widest uppercase mb-1">Preview</div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-cockpit-text uppercase leading-none mt-2">
            System Overview
          </h1>
          <p className="font-mono text-xs text-cockpit-muted mt-2 uppercase tracking-wide font-bold">
             Experimental Brutalist Layout
          </p>
        </div>
      </div>

      <AppUpdateBanner />

      <div className="grid gap-6 md:grid-cols-12 items-start">
        
        {/* Core Vitals - Strict Brutalist Grid */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Primary Node Banner */}
          <div className="sm:col-span-2 border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)]">
            <div className="flex items-center justify-between w-full border-b-2 border-cockpit-text pb-3 mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text">Primary Node &amp; Host Spec</span>
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-widest uppercase">{pve?.nodeName || 'UNNAMED-NODE'}</h2>
                <div className="font-mono text-[11px] font-bold mt-1 text-cockpit-muted uppercase flex flex-wrap items-center gap-2">
                  <span>Proxmox VE · {redactText(pve?.ip || '0.0.0.0', isPrivacyMode)}</span>
                  <span>·</span>
                  <span>Docker {dockerHost?.hostname || 'host'} · {redactText(dockerHost?.ip || '—', isPrivacyMode)}</span>
                </div>
                {cpuModel && (
                  <div className="font-mono text-[10.5px] font-bold text-cockpit-text mt-1.5 truncate">
                    {cpuModel}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`pill ${pve?.connected ? 'pill-good' : 'pill-warn'}`}>
                  {pve?.connected ? 'PVE CONNECTED' : 'PVE SIMULATED'}
                </span>
              </div>
            </div>
          </div>

          {/* Compute Card */}
          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-3 w-3" /> Compute
              </div>
              <span className="font-mono text-[10px] font-black">{cpuPercent.toFixed(1)}%</span>
            </div>
            <div>
              <div className={`text-3xl font-black tabular-nums leading-none tracking-tighter ${cpuTone.text}`}>
                {cpuPercent.toFixed(1)}%
              </div>
              <div className="font-mono text-[10px] font-bold text-cockpit-muted mt-2 uppercase tracking-widest">
                {pve?.cpuCores ? `${pve.cpuCores} Allocated Cores` : 'CPU Usage'}
              </div>
              <div className="track mt-3 h-2 bg-cockpit-border/60">
                <span
                  className={`track-fill ${cpuTone.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, cpuPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Memory Card */}
          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3 w-3" /> Memory
              </div>
              <span className="font-mono text-[10px] font-black">{ramPercent.toFixed(0)}%</span>
            </div>
            <div>
              <div className={`text-3xl font-black tabular-nums leading-none tracking-tighter ${ramTone.text}`}>
                {ramPercent.toFixed(1)}%
              </div>
              <div className="font-mono text-[10px] font-bold text-cockpit-muted mt-2 uppercase tracking-widest truncate">
                {formatBytes(ramUsedBytes)} of {formatBytes(ramTotalBytes)}
              </div>
              <div className="track mt-3 h-2 bg-cockpit-border/60">
                <span
                  className={`track-fill ${ramTone.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, ramPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Workloads Card */}
          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between border-l-8 border-l-state-good">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-3 w-3" /> Workloads
              </div>
              {pinnedCount > 0 && (
                <span className="font-mono text-[9px] font-black bg-cockpit-text text-cockpit-bg px-1 py-0.5">
                  {pinnedCount} PINNED
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-black tabular-nums leading-none tracking-tighter">{runningCount}</div>
                <div className="font-mono text-[11px] font-bold text-cockpit-muted uppercase tracking-widest">/ {totalCount} RUNNING</div>
              </div>
              <div className="font-mono text-[10px] font-bold text-cockpit-muted mt-2 uppercase tracking-widest">
                {pinnedCount > 0 ? `${pinnedCount} Containers in Command Deck` : 'Active Containers'}
              </div>
            </div>
          </div>

          {/* Thermal / Package Temp Sensor Card */}
          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-3 w-3" /> Thermal
              </div>
              {tempTone && (
                <span className={`font-mono text-[9px] font-black uppercase px-1 py-0.5 border border-current ${tempTone.text}`}>
                  {tempTone.label}
                </span>
              )}
            </div>
            <div>
              <div className={`text-3xl font-black tabular-nums leading-none tracking-tighter ${tempTone?.text ?? 'text-cockpit-text'}`}>
                {temp != null ? `${temp.toFixed(1)}°C` : 'N/A'}
              </div>
              <div className="font-mono text-[10px] font-bold text-cockpit-muted mt-2 uppercase tracking-widest">
                Package Temperature
              </div>
              <div className="track mt-3 h-2 bg-cockpit-border/60">
                <span
                  className={`track-fill ${tempTone?.bar ?? 'bg-cockpit-border'}`}
                  style={{ width: `${temp != null ? Math.min(100, Math.max(5, ((temp - 25) / 65) * 100)) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Network Throughput */}
          <div className="sm:col-span-2 border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-4 flex items-center gap-2">
              <Network className="h-3 w-3" /> Network Throughput
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-baseline border-b-2 sm:border-b-0 sm:border-r-2 border-cockpit-border/50 pb-2 sm:pb-0 sm:pr-4 border-dotted">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-muted">RX (Inbound)</span>
                <span className="font-mono text-base font-black tabular-nums text-cockpit-text">{formatBytes(throughput.rx)}/s</span>
              </div>
              <div className="flex justify-between items-baseline sm:pl-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-muted">TX (Outbound)</span>
                <span className="font-mono text-base font-black tabular-nums text-cockpit-text">{formatBytes(throughput.tx)}/s</span>
              </div>
            </div>
          </div>

          {/* Real-time Storage & DAS Watchdog Overview Block */}
          <Link
            to="/beta/infra"
            className="sm:col-span-2 border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(var(--cockpit-text)/1)] transition-transform group"
          >
            <div className="flex items-center justify-between border-b-2 border-cockpit-border/50 pb-2 mb-3 border-dotted">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3.5 w-3.5 text-cockpit-text" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text">
                  Storage &amp; DAS Watchdog
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                {detachedCount > 0 ? (
                  <span className="bg-state-bad text-white px-1.5 py-0.5 font-bold animate-pulse">
                    {detachedCount} ALERT
                  </span>
                ) : (
                  <span className="bg-state-good text-black px-1.5 py-0.5 font-bold">
                    CANARY OK
                  </span>
                )}
                <span className="bg-cockpit-text text-cockpit-bg px-1.5 py-0.5 font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  SMART {rootDrive?.smartStatus || 'PASSED'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <div className="text-2xl font-black tabular-nums tracking-tight">
                  {formatBytes(totalUsedBytes)} <span className="text-xs font-normal text-cockpit-muted">used of</span> {formatBytes(totalCapacityBytes)}
                </div>
                <div className="font-mono text-[10.5px] text-cockpit-muted uppercase mt-0.5">
                  {rootDrive?.label || 'Proxmox Root SSD'} {externalCount > 0 ? `+ ${externalCount} DAS Enclosure(s)` : ''}
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-cockpit-text group-hover:underline">
                <span>View Full Telemetry</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="track mt-3 h-2 bg-cockpit-border/60">
              <span
                className={`track-fill ${getStatusColor(overallUsedPercent).bar}`}
                style={{ width: `${Math.min(100, Math.max(2, overallUsedPercent))}%` }}
              />
            </div>
          </Link>

        </div>

        {/* Right Sidebar - Alerts & Actions */}
        <div className="md:col-span-4 space-y-6">
          
          <div className="border-4 border-yellow-500 bg-yellow-500/5 p-4 relative shadow-[4px_4px_0_rgba(234,179,8,1)]">
            <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500 flex items-center justify-center border-l-4 border-b-4 border-yellow-500">
              <ShieldAlert className="h-4 w-4 text-black" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-yellow-500 mb-2 mt-1">Design Architecture</h3>
            <p className="text-[11px] text-cockpit-text leading-relaxed font-mono font-bold">
              High density brutalist interface. Crisp borders, zero blur, instant animations, and complete parity with host telemetry.
            </p>
          </div>

          <div className="border-2 border-cockpit-text bg-cockpit-bg p-4 space-y-3 shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)]">
            <div className="flex items-center justify-between border-b-2 border-cockpit-text pb-2 mb-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-cockpit-text flex items-center gap-2">
                <TerminalSquare className="h-3.5 w-3.5" /> Quick Actions &amp; Shortcuts
              </h3>
              <span className="font-mono text-[9px] font-bold text-cockpit-muted uppercase">Fast Deck</span>
            </div>

            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="w-full flex items-center justify-between border-2 border-cockpit-text bg-cockpit-text text-cockpit-bg p-2.5 font-mono text-[11px] font-black uppercase tracking-widest hover:bg-cockpit-bg hover:text-cockpit-text active:translate-y-[1px] transition-none"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Command Deck</span>
                </div>
                <kbd className="border border-current px-1 text-[9px] font-bold">Ctrl K</kbd>
              </button>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Link to="/beta/fleet" className="flex items-center justify-between border-2 border-cockpit-text p-2.5 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-none group">
                <div className="flex items-center gap-2">
                  <Boxes className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest">Container Fleet</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link to="/beta/infra" className="flex items-center justify-between border-2 border-cockpit-text p-2.5 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-none group">
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest">Storage &amp; Infra</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/beta/terminal" className="flex items-center justify-between border-2 border-cockpit-text p-2.5 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-none group">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest">SSH Web Terminal</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/beta/processes" className="flex items-center justify-between border-2 border-cockpit-text p-2.5 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-none group">
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest">Host Processes</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/beta/git-projects" className="flex items-center justify-between border-2 border-cockpit-text p-2.5 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-none group">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest">Git Projects &amp; Sync</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/beta/sentinel" className="flex items-center justify-between border-2 border-cockpit-text p-2.5 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-none group">
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest">Sentinel AI Watchdog</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/beta/ai-agents" className="flex items-center justify-between border-2 border-cockpit-text p-2.5 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-none group">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest">AI Agents Telemetry</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
        </div>

      </div>

      {/* Bookmarks & Web Shortcuts Section */}
      <div className="border-t-4 border-cockpit-text pt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-cockpit-text text-cockpit-bg px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest">
            Personal Web Shortcuts
          </span>
          <span className="font-mono text-[11px] font-bold text-cockpit-muted uppercase tracking-wider">
            Quick Launch &amp; Startpage Grid
          </span>
        </div>
        <BookmarksSection />
      </div>
      
    </div>
  );
};
