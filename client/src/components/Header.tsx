import React from 'react';
import { Server, Activity, RefreshCw, Wifi, WifiOff, HardDrive, ShieldCheck, Network } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';

interface HeaderProps {
  snapshot: CockpitSnapshot | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  snapshot,
  isConnected,
  lastUpdated,
  onRefresh,
}) => {
  const runningCount = snapshot?.containers.filter(c => c.state === 'running').length || 0;
  const totalCount = snapshot?.containers.length || 0;
  const tailscale = snapshot?.tailscale;

  return (
    <header className="border-b border-slate-800/80 bg-[#0c1220]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Hardware Badge */}
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/20 via-slate-800 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center shadow-inner shadow-cyan-500/10">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-cyan-400">
                Homelab Cockpit
              </h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-500/30">
                OWNER POV
              </span>
              {snapshot?.isDemoMode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  DEMO MODE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span>Lenovo M710q Tiny</span>
              <span className="text-slate-600">•</span>
              <span>Intel i5-7500 (4C/4T)</span>
              <span className="text-slate-600">•</span>
              <span>32GB RAM</span>
            </p>
          </div>
        </div>

        {/* Status Pills & Ticker */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
          {/* Proxmox Node Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">PVE:</span>
            <span className="font-semibold text-slate-200">192.168.18.224</span>
            <span className={`w-2 h-2 rounded-full ${snapshot?.host.pve.connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`} />
          </div>

          {/* Docker Host LXC Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 font-mono">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">LXC:</span>
            <span className="font-semibold text-slate-200">192.168.18.225</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          </div>

          {/* Tailscale Status Pill */}
          {tailscale && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-mono">
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Tailnet:</span>
              <span className="text-indigo-200 font-bold">{tailscale.totalOnline}/{tailscale.totalDevices}</span>
            </div>
          )}

          {/* Active Container Count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Containers:</span>
            <span className="text-emerald-400 font-bold">{runningCount}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300 font-semibold">{totalCount}</span>
          </div>

          {/* Live Sync / WS Connection */}
          <button
            onClick={onRefresh}
            title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Click to refresh'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono transition-colors ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/50'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-400 hover:bg-rose-950/50'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="font-bold">LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span>RECONNECTING</span>
              </>
            )}
            {lastUpdated && (
              <span className="text-[10px] opacity-70 border-l border-emerald-500/30 pl-1.5 hidden sm:inline">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <RefreshCw className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
        </div>

      </div>
    </header>
  );
};
