import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Terminal, Layers, Copy, Check, ExternalLink, Globe, ArrowDown, ArrowUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { formatBytes, formatNetworkRate, redactText, getStatusColor } from '../utils/formatters.js';

interface ContainerGridSectionProps {
  containers: ContainerMetric[] | undefined;
  isPrivacyMode?: boolean;
  onViewLogs: (container: ContainerMetric) => void;
  onRestartContainer: (container: ContainerMetric) => void;
}

export const ContainerGridSection: React.FC<ContainerGridSectionProps> = ({
  containers = [],
  isPrivacyMode = false,
  onViewLogs,
  onRestartContainer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'exited'>('all');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'tailscale' | 'lan_only' | 'internal'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cpu' | 'ram' | 'network'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const tailscaleCount = useMemo(() => containers.filter(c => c.tailscaleEnabled && c.tailscaleUrl).length, [containers]);
  const lanOnlyCount = useMemo(() => containers.filter(c => !c.tailscaleEnabled && c.primaryPort).length, [containers]);
  const internalCount = useMemo(() => containers.filter(c => !c.primaryPort).length, [containers]);

  const filteredContainers = useMemo(() => {
    return containers
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.image.toLowerCase().includes(search.toLowerCase()) ||
          (c.tailscaleIp && c.tailscaleIp.includes(search)) ||
          c.ports.some((p) => p.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (statusFilter === 'running' && c.state !== 'running') return false;
        if (statusFilter === 'exited' && c.state === 'running') return false;

        if (networkFilter === 'tailscale' && (!c.tailscaleEnabled || !c.tailscaleUrl)) return false;
        if (networkFilter === 'lan_only' && (c.tailscaleEnabled || !c.primaryPort)) return false;
        if (networkFilter === 'internal' && c.primaryPort) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        else if (sortBy === 'cpu') diff = a.cpuPercent - b.cpuPercent;
        else if (sortBy === 'ram') diff = a.memoryBytes - b.memoryBytes;
        else if (sortBy === 'network') diff = (a.networkRxRateBytesPerSec + a.networkTxRateBytesPerSec) - (b.networkRxRateBytesPerSec + b.networkTxRateBytesPerSec);

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [containers, search, statusFilter, networkFilter, sortBy, sortOrder]);

  const toggleSort = (column: 'name' | 'cpu' | 'ram' | 'network') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'name' ? 'asc' : 'desc');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <section className="rounded-lg bg-[#0d1424] border border-slate-800 p-4 font-mono text-xs">
      
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Container Fleet & Network Routing
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
            {filteredContainers.length} / {containers.length}
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search container, port, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 w-48 sm:w-56"
            />
          </div>

          {/* Network Segment Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setNetworkFilter('all')}
              className={`px-2 py-1 rounded transition-colors ${
                networkFilter === 'all'
                  ? 'bg-slate-800 text-slate-100 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({containers.length})
            </button>
            <button
              onClick={() => setNetworkFilter('tailscale')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                networkFilter === 'tailscale'
                  ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Tailscale</span>
              <span className="text-[10px] px-1 rounded bg-indigo-900/60">{tailscaleCount}</span>
            </button>
            <button
              onClick={() => setNetworkFilter('lan_only')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                networkFilter === 'lan_only'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>LAN Only</span>
              <span className="text-[10px] px-1 rounded bg-cyan-900/60">{lanOnlyCount}</span>
            </button>
            <button
              onClick={() => setNetworkFilter('internal')}
              className={`px-2 py-1 rounded transition-colors ${
                networkFilter === 'internal'
                  ? 'bg-slate-800 text-slate-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Internal ({internalCount})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
            {(['all', 'running', 'exited'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`px-2 py-1 rounded capitalize transition-colors ${
                  statusFilter === mode
                    ? 'bg-slate-800 text-slate-100 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clean High-Density Table */}
      <div className="mt-3 overflow-x-auto rounded border border-slate-800 bg-slate-950/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider">
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">
                  <span>Container / Image</span>
                  {sortBy === 'name' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="py-2.5 px-3">State & Health</th>
              <th className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span>Network Route & IP (Tailscale vs LAN)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('cpu')}>
                <div className="flex items-center gap-1">
                  <span>CPU</span>
                  {sortBy === 'cpu' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('ram')}>
                <div className="flex items-center gap-1">
                  <span>Memory</span>
                  {sortBy === 'ram' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('network')}>
                <div className="flex items-center gap-1">
                  <span>Speedometer</span>
                  {sortBy === 'network' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredContainers.map((container) => {
              const isRunning = container.state === 'running';
              const cpuColors = getStatusColor(container.cpuPercent);
              const ramColors = getStatusColor(container.memoryPercent);

              const hasTailscale = Boolean(container.tailscaleEnabled && container.tailscaleUrl);
              const hasLan = Boolean(container.lanUrl);

              const isTsCopied = copiedUrl === container.tailscaleUrl;
              const isLanCopied = copiedUrl === container.lanUrl;

              return (
                <tr key={container.id} className="hover:bg-slate-900/40 transition-colors group">
                  
                  {/* Container & Image */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{container.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">#{container.shortId}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[170px]" title={container.image}>
                          {container.image}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* State & L7 Health */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isRunning ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isRunning ? 'UP' : 'STOPPED'}
                        </span>
                        
                        {isRunning && container.httpHealth?.status === 'healthy' && (
                          <span className="text-[10px] text-cyan-400 flex items-center gap-0.5 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{container.httpHealth.statusCode || 200}</span>
                            <span className="text-slate-500 text-[9px]">({container.httpHealth.latencyMs}ms)</span>
                          </span>
                        )}

                        {isRunning && container.httpHealth?.status === 'critical' && (
                          <span className="text-[10px] text-rose-400 flex items-center gap-0.5 font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>502</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{container.uptime}</span>
                    </div>
                  </td>

                  {/* Network Route & IP: Explicit Tailscale vs LAN */}
                  <td className="py-2.5 px-3">
                    {hasTailscale || hasLan ? (
                      <div className="flex flex-col gap-1">
                        {/* Tailscale Route */}
                        {hasTailscale && container.tailscaleUrl && (
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                              TS
                            </span>
                            <a
                              href={container.tailscaleUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-300 hover:text-white hover:underline flex items-center gap-1 font-semibold text-[11px]"
                            >
                              <span>{redactText(container.tailscaleIp || '100.110.20.15', isPrivacyMode)}:{container.primaryPort}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
                            </a>
                            <button
                              onClick={() => copyToClipboard(container.tailscaleUrl!)}
                              title="Copy Tailscale URL"
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                            >
                              {isTsCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        )}

                        {/* LAN Route */}
                        {hasLan && container.lanUrl && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              LAN
                            </span>
                            <a
                              href={container.lanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-200 hover:underline flex items-center gap-1"
                            >
                              <span>{redactText('192.168.18.225', isPrivacyMode)}:{container.primaryPort}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                            </a>
                            <button
                              onClick={() => copyToClipboard(container.lanUrl!)}
                              title="Copy LAN URL"
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                            >
                              {isLanCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        Internal (Bridge)
                      </span>
                    )}
                  </td>

                  {/* CPU % */}
                  <td className="py-2.5 px-3">
                    <div className="w-20">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`font-bold ${isRunning ? cpuColors.text : 'text-slate-500'}`}>
                          {isRunning ? `${container.cpuPercent.toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full ${cpuColors.bar}`}
                          style={{ width: `${Math.min(100, Math.max(2, container.cpuPercent))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* RAM MB/GB */}
                  <td className="py-2.5 px-3">
                    <div className="w-20">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`font-bold ${isRunning ? ramColors.text : 'text-slate-500'}`}>
                          {isRunning ? formatBytes(container.memoryBytes) : '0 B'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full ${ramColors.bar}`}
                          style={{ width: `${Math.min(100, Math.max(2, container.memoryPercent))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Speedometer (Live Rate Delta) */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col gap-0.5 text-[10px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <ArrowDown className="w-2.5 h-2.5" />
                          {formatNetworkRate(container.networkRxRateBytesPerSec)}
                        </span>
                        <span className="text-sky-400 flex items-center gap-0.5">
                          <ArrowUp className="w-2.5 h-2.5" />
                          {formatNetworkRate(container.networkTxRateBytesPerSec)}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[9px]">
                        {formatBytes(container.networkRxBytes)} / {formatBytes(container.networkTxBytes)}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewLogs(container)}
                        title="Logs"
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRestartContainer(container)}
                        title="Restart"
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredContainers.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-xs">
            No containers match filter.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
        <span>Docker Engine on Ubuntu LXC (192.168.18.225)</span>
        <span>Click column headers to sort</span>
      </div>

    </section>
  );
};
