import { useState } from 'react';
import { Network, Smartphone, Laptop, Server, Globe, Copy, Check, Route } from 'lucide-react';
import { TailscaleStatus, TailscaleDevice } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface TailscaleMatrixSectionProps {
  tailscale: TailscaleStatus | undefined;
  isPrivacyMode?: boolean;
}

export const TailscaleMatrixSection: React.FC<TailscaleMatrixSectionProps> = ({ tailscale, isPrivacyMode = false }) => {
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  if (!tailscale) {
    return <div className="h-40 rounded-xl bg-slate-900/60 animate-pulse border border-slate-800" />;
  }

  const { devices = [], tailnetName, totalOnline, totalDevices } = tailscale;

  const copyToClipboard = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const getDeviceIcon = (device: TailscaleDevice) => {
    if (device.os === 'android' || device.os === 'ios') {
      return <Smartphone className="w-4 h-4 text-emerald-400" />;
    }
    if (device.os === 'windows' || device.os === 'macos') {
      return <Laptop className="w-4 h-4 text-cyan-400" />;
    }
    if (device.isExitNode) {
      return <Globe className="w-4 h-4 text-amber-400" />;
    }
    return <Server className="w-4 h-4 text-indigo-400" />;
  };

  const subnetRouters = devices.filter(d => d.subnetRoutes && d.subnetRoutes.length > 0);

  return (
    <section className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                Tailscale Mesh Network & Tailnet Tracking
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {redactText(tailnetName, isPrivacyMode)}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Secure WireGuard overlay network status & 100.x peer address matrix
            </p>
          </div>
        </div>

        {/* Global Tailscale Stats */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs self-start sm:self-auto">
          {/* Subnet Route Badge */}
          {subnetRouters.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <Route className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-500">Subnet:</span>
              <span className="text-cyan-300 font-semibold">
                {isPrivacyMode ? '192.168.•••.0/24' : subnetRouters[0].subnetRoutes.join(', ')}
              </span>
            </div>
          )}

          {/* Peer Count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-400">Peers Online:</span>
            <span className="text-emerald-400 font-bold">{totalOnline}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-semibold">{totalDevices}</span>
          </div>
        </div>
      </div>

      {/* Grid of Tailscale Peers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {devices.map((device) => {
          const isCopied = copiedIp === device.ipv4;
          const displayIp = redactText(device.ipv4, isPrivacyMode);
          const displayDns = redactText(device.dnsName, isPrivacyMode);

          return (
            <div
              key={device.id}
              className={`rounded-lg p-3 border transition-all flex flex-col justify-between ${
                device.online
                  ? 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900/60 opacity-60'
              }`}
            >
              <div>
                {/* Peer Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/50">
                      {getDeviceIcon(device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-100 truncate max-w-[130px]">
                          {device.name}
                        </span>
                        {device.isCurrentDevice && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                            THIS HOST
                          </span>
                        )}
                        {device.isExitNode && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/30">
                            EXIT NODE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
                        {displayDns}
                      </div>
                    </div>
                  </div>

                  {/* Online / Offline Status */}
                  <div className="flex items-center gap-1 text-[10px] font-mono shrink-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        device.online ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                      }`}
                    />
                    <span className={device.online ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>\n                      {device.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                {/* Subnet / Feature Tags */}
                {device.subnetRoutes.length > 0 && (
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                    <Route className="w-3 h-3" />
                    <span>
                      Subnet Router: {isPrivacyMode ? '192.168.•••.0/24' : device.subnetRoutes.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* IP Address & Action Row */}
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-500">IPv4:</span>
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {displayIp}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    {device.lastSeen}
                  </span>
                  <button
                    onClick={() => copyToClipboard(device.ipv4)}
                    title="Copy Tailscale IP"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
