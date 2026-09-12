import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Terminal, Layers, ArrowUpDown } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { Sparkline } from './Sparkline.js';
import { formatBytes, getStatusColor } from '../utils/formatters.js';

interface ContainerGridSectionProps {
  containers: ContainerMetric[] | undefined;
  onViewLogs: (container: ContainerMetric) => void;
  onRestartContainer: (container: ContainerMetric) => void;
}

export const ContainerGridSection: React.FC<ContainerGridSectionProps> = ({
  containers = [],
  onViewLogs,
  onRestartContainer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'exited'>('all');
  const [sortBy, setSortBy] = useState<'cpu' | 'ram' | 'name'>('cpu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredContainers = useMemo(() => {
    return containers
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.image.toLowerCase().includes(search.toLowerCase()) ||
          c.ports.some((p) => p.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (statusFilter === 'running') return c.state === 'running';
        if (statusFilter === 'exited') return c.state !== 'running';
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'cpu') diff = a.cpuPercent - b.cpuPercent;
        else if (sortBy === 'ram') diff = a.memoryBytes - b.memoryBytes;
        else if (sortBy === 'name') diff = a.name.localeCompare(b.name);

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [containers, search, statusFilter, sortBy, sortOrder]);

  const toggleSort = (column: 'cpu' | 'ram' | 'name') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <section className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 pb-3 border-b border-slate-800/70">
        
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                Container Engine Fleet (Live Snapshot)
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                {filteredContainers.length} of {containers.length} active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Real-time resource telemetry streamed directly from /var/run/docker.sock
            </p>
          </div>
        </div>

        {/* Controls: Search, Filter, Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, port, image..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 w-48 sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['all', 'running', 'exited'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  statusFilter === mode
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-400">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <button
              onClick={() => toggleSort('cpu')}
              className={`hover:text-white px-1 ${sortBy === 'cpu' ? 'text-cyan-400 font-bold' : ''}`}
            >
              CPU
            </button>
            <span>/</span>
            <button
              onClick={() => toggleSort('ram')}
              className={`hover:text-white px-1 ${sortBy === 'ram' ? 'text-indigo-400 font-bold' : ''}`}
            >
              RAM
            </button>
            <span>/</span>
            <button
              onClick={() => toggleSort('name')}
              className={`hover:text-white px-1 ${sortBy === 'name' ? 'text-slate-200 font-bold' : ''}`}
            >
              A-Z
            </button>
          </div>
        </div>

      </div>

      {/* Table of Containers */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3.5 font-bold">Service / Container</th>
              <th className="py-2.5 px-3 font-bold">State</th>
              <th className="py-2.5 px-3 font-bold cursor-pointer hover:text-cyan-400" onClick={() => toggleSort('cpu')}>
                <div className="flex items-center gap-1">
                  <span>CPU Usage & Trend</span>
                  {sortBy === 'cpu' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="py-2.5 px-3 font-bold cursor-pointer hover:text-indigo-400" onClick={() => toggleSort('ram')}>
                <div className="flex items-center gap-1">
                  <span>RAM Alloc & Trend</span>
                  {sortBy === 'ram' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                </div>
              </th>
              <th className="py-2.5 px-3 font-bold hidden md:table-cell">Net I/O (RX / TX)</th>
              <th className="py-2.5 px-3 font-bold hidden xl:table-cell">Ports</th>
              <th className="py-2.5 px-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredContainers.map((container) => {
              const isRunning = container.state === 'running';
              const cpuColors = getStatusColor(container.cpuPercent);

              return (
                <tr
                  key={container.id}
                  className="hover:bg-slate-900/60 transition-colors group"
                >
                  {/* Service & Image */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      {/* Pulse Status Dot */}
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        {isRunning && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            isRunning ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        />
                      </span>

                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span className="text-slate-100 group-hover:text-cyan-400 transition-colors">
                            {container.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
                            #{container.shortId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={container.image}>
                          {container.image}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* State / Uptime */}
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isRunning
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isRunning ? 'RUNNING' : 'STOPPED'}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{container.uptime}</div>
                  </td>

                  {/* CPU % + Sparkline */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14">
                        <span className={`font-bold ${isRunning ? cpuColors.text : 'text-slate-500'}`}>
                          {isRunning ? `${container.cpuPercent.toFixed(1)}%` : '0.0%'}
                        </span>
                      </div>
                      <div className="hidden sm:block">
                        <Sparkline
                          data={container.sparklineCpu}
                          color={container.cpuPercent > 10 ? 'amber' : 'cyan'}
                          width={65}
                          height={20}
                        />
                      </div>
                    </div>
                  </td>

                  {/* RAM MB/GB + Sparkline */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-20">
                        <div className="font-bold text-slate-200">
                          {isRunning ? formatBytes(container.memoryBytes) : '0 B'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isRunning ? `${container.memoryPercent.toFixed(1)}% limit` : '—'}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <Sparkline
                          data={container.sparklineMemory}
                          color="indigo"
                          width={65}
                          height={20}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Net I/O */}
                  <td className="py-2.5 px-3 hidden md:table-cell text-slate-400">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-emerald-400">↓ {formatBytes(container.networkRxBytes)}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-sky-400">↑ {formatBytes(container.networkTxBytes)}</span>
                    </div>
                  </td>

                  {/* Ports */}
                  <td className="py-2.5 px-3 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[170px]">
                      {container.ports.slice(0, 2).map((port, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400"
                        >
                          {port}
                        </span>
                      ))}
                      {container.ports.length > 2 && (
                        <span className="text-[10px] text-slate-500">
                          +{container.ports.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Logs Trigger */}
                      <button
                        onClick={() => onViewLogs(container)}
                        title="Inspect Live Logs"
                        className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>

                      {/* Restart Trigger */}
                      <button
                        onClick={() => onRestartContainer(container)}
                        title="Restart Container"
                        className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-slate-800 transition-colors"
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
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No containers match your search query "{search}".
          </div>
        )}
      </div>
    </section>
  );
};
