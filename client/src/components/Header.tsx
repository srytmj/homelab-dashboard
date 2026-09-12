import React from 'react';
import { Server, Activity, RefreshCw, Wifi, WifiOff, HardDrive, ShieldCheck, Network, Eye, EyeOff, Maximize2, Minimize2, Terminal, LogOut } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { redactText } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.js';

interface HeaderProps {
  snapshot: CockpitSnapshot | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  isPrivacyMode: boolean;
  isFullscreen: boolean;
  onTogglePrivacy: () => void;
  onToggleFullscreen: () => void;
  onOpenCommandDeck: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  snapshot,
  isConnected,
  lastUpdated,
  isPrivacyMode,
  isFullscreen,
  onTogglePrivacy,
  onToggleFullscreen,
  onOpenCommandDeck,
  onRefresh,
}) => {
  const { username, logout } = useAuth();
  const runningCount = snapshot?.containers.filter(c => c.state === 'running').length || 0;
  const totalCount = snapshot?.containers.length || 0;
  const tailscale = snapshot?.tailscale;

  return (
    <header className="border-b border-slate-800 bg-[#0c1220] sticky top-0 z-40 px-4 lg:px-6 py-2.5 font-mono select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Brand & Hardware */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-wider uppercase text-slate-100">
                Homelab Cockpit
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                OWNER
              </span>
              {snapshot?.isDemoMode && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Lenovo M710q Tiny (i5-7500 / 32GB RAM)
            </p>
          </div>
        </div>

        {/* Status Pills & Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          {/* Infrastructure Quick Consoles */}
          <button
            onClick={onOpenCommandDeck}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">Consoles</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">
              8
            </span>
          </button>

          {/* PVE Node */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">PVE:</span>
            <span className="text-slate-200 font-semibold">
              {redactText('192.168.18.224', isPrivacyMode)}
            </span>
          </div>

          {/* Docker Host LXC */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">LXC:</span>
            <span className="text-slate-200 font-semibold">
              {redactText('192.168.18.225', isPrivacyMode)}
            </span>
          </div>

          {/* Tailscale Status */}
          {tailscale && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Tailnet:</span>
              <span className="text-indigo-200 font-bold">{tailscale.totalOnline}/{tailscale.totalDevices}</span>
            </div>
          )}

          {/* Container Fleet count */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{runningCount}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{totalCount}</span>
          </div>

          {/* Privacy Toggle */}
          <button
            onClick={onTogglePrivacy}
            title={isPrivacyMode ? 'Privacy Mode ON' : 'Toggle Privacy Mode'}
            className={`p-1.5 rounded border transition-colors ${
              isPrivacyMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Kiosk Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk'}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Live Sync / WS Connection */}
          <button
            onClick={onRefresh}
            title={lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
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
                <span>OFFLINE</span>
              </>
            )}
            <RefreshCw className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>

          {/* User Profile & Logout */}
          {username && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 px-1">@{username}</span>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
