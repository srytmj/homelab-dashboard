import React, { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw, Terminal, Copy, Check, ExternalLink, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { Sparkline } from './Sparkline.js';
import { formatBytes, formatNetworkRate, redactText, getStatusColor } from '../utils/formatters.js';

interface ContainerGridSectionProps {
  containers: ContainerMetric[] | undefined;
  isPrivacyMode?: boolean;
  onViewLogs: (container: ContainerMetric) => void;
  onRestartContainer: (container: ContainerMetric) => void;
}

type SortKey = 'cpu' | 'ram' | 'name' | 'network';

const PAGE_SIZES = [10, 25, 50, 100];

export const ContainerGridSection: React.FC<ContainerGridSectionProps> = ({
  containers = [],
  isPrivacyMode = false,
  onViewLogs,
  onRestartContainer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'exited'>('all');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'tailscale' | 'lan'>('all');
  const [urlMode, setUrlMode] = useState<'auto' | 'tailscale' | 'lan'>('auto');
  const [sortBy, setSortBy] = useState<SortKey>('cpu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const isLoadedViaTailscale =
    typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('100.') || window.location.hostname.endsWith('.ts.net'));

  const filteredContainers = useMemo(() => {
    return containers
      .filter((c) => {
        const q = search.toLowerCase();
        const matchesSearch =
          c.name.toLowerCase().includes(q) ||
          c.image.toLowerCase().includes(q) ||
          c.ports.some((p) => p.toLowerCase().includes(q));

        if (!matchesSearch) return false;
        if (statusFilter === 'running' && c.state !== 'running') return false;
        if (statusFilter === 'exited' && c.state === 'running') return false;
        if (networkFilter === 'tailscale' && !c.tailscaleEnabled) return false;
        if (networkFilter === 'lan' && c.tailscaleEnabled) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'cpu') diff = a.cpuPercent - b.cpuPercent;
        else if (sortBy === 'ram') diff = a.memoryBytes - b.memoryBytes;
        else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        else diff =
          a.networkRxRateBytesPerSec + a.networkTxRateBytesPerSec -
          (b.networkRxRateBytesPerSec + b.networkTxRateBytesPerSec);
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [containers, search, statusFilter, networkFilter, sortBy, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredContainers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleContainers = filteredContainers.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, networkFilter, pageSize]);

  const toggleSort = (column: SortKey) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getContainerTargetUrl = (container: ContainerMetric): string | undefined => {
    if (urlMode === 'tailscale') return container.tailscaleUrl;
    if (urlMode === 'lan') return container.lanUrl;
    return isLoadedViaTailscale
      ? container.tailscaleUrl || container.lanUrl
      : container.lanUrl || container.tailscaleUrl;
  };

  const tailscaleCount = containers.filter((c) => c.tailscaleEnabled).length;
  const runningCount = containers.filter((c) => c.state === 'running').length;

  const SortHeader: React.FC<{ column: SortKey; children: React.ReactNode; className?: string }> = ({
    column,
    children,
    className = '',
  }) => (
    <th className={`px-4 py-2.5 font-medium ${className}`}>
      <button
        onClick={() => toggleSort(column)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-cockpit-text ${
          sortBy === column ? 'text-cockpit-accent' : ''
        }`}
      >
        {children}
        {sortBy === column && <span aria-hidden="true">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
      </button>
    </th>
  );

  return (
    <section className="panel overflow-hidden">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Container fleet</h2>
          <p className="panel-sub">
            {runningCount} running of {containers.length} · live throughput &amp; L7 probes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cockpit-muted" />
            <input
              type="text"
              placeholder="Filter name, image, port"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field w-52 pl-8"
            />
          </div>

          <div className="seg">
            {([
              ['all', 'All'],
              ['running', 'Running'],
              ['exited', 'Stopped'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`seg-btn ${statusFilter === mode ? 'seg-btn-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="seg">
            {([
              ['all', 'All nets'],
              ['tailscale', `Tailscale ${tailscaleCount}`],
              ['lan', 'LAN'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setNetworkFilter(mode)}
                className={`seg-btn ${networkFilter === mode ? 'seg-btn-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="seg" title="Which address the service links point at">
            <span className="label px-2">Links</span>
            {([
              ['auto', 'Auto'],
              ['lan', 'LAN'],
              ['tailscale', 'TS'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setUrlMode(mode)}
                className={`seg-btn ${urlMode === mode ? 'seg-btn-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-cockpit-border font-mono text-[10px] uppercase tracking-[0.09em] text-cockpit-muted">
              <SortHeader column="name">Service</SortHeader>
              <th className="px-4 py-2.5 font-medium">Health</th>
              <th className="px-4 py-2.5 font-medium">Web UI</th>
              <SortHeader column="cpu">CPU</SortHeader>
              <SortHeader column="ram">Memory</SortHeader>
              <SortHeader column="network">Throughput</SortHeader>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody key={`${currentPage}-${pageSize}`} className="animate-fadeIn">
            {visibleContainers.map((container) => {
              const isRunning = container.state === 'running';
              const cpuTone = getStatusColor(container.cpuPercent);
              const targetUrl = getContainerTargetUrl(container);
              const isCopied = copiedUrl === targetUrl;
              const probe = container.httpHealth;

              return (
                <tr
                  key={container.id}
                  className="group border-b border-cockpit-border transition-colors last:border-b-0 hover:bg-cockpit-panelHover"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${isRunning ? 'bg-state-good' : 'bg-cockpit-muted'}`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-cockpit-text">{container.name}</span>
                          <span className="font-mono text-[10.5px] text-cockpit-muted">#{container.shortId}</span>
                        </div>
                        <div className="truncate font-mono text-[11px] text-cockpit-muted" title={container.image}>
                          {container.image}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`pill ${isRunning ? 'pill-good' : 'pill-neutral'}`}>
                        {isRunning ? 'Running' : 'Stopped'}
                      </span>
                      {isRunning && probe?.status === 'healthy' && (
                        <span className="pill pill-neutral normal-case tabular-nums">
                          {probe.statusCode || 200} · {probe.latencyMs}ms
                        </span>
                      )}
                      {isRunning && probe?.status === 'critical' && <span className="pill pill-bad">502 error</span>}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-cockpit-muted">{container.uptime}</div>
                  </td>

                  <td className="px-4 py-3">
                    {targetUrl ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={`Open ${redactText(targetUrl, isPrivacyMode)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-cockpit-border px-2 py-1 font-mono text-[11px] text-cockpit-accent transition-colors hover:border-cockpit-accent/40"
                        >
                          <ExternalLink className="h-3 w-3" />:{container.primaryPort}
                        </a>
                        <button
                          onClick={() => copyToClipboard(targetUrl)}
                          title="Copy URL"
                          className="icon-btn p-1"
                        >
                          {isCopied ? <Check className="h-3 w-3 animate-popIn text-state-good" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-cockpit-muted">internal</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`metric w-12 text-[12.5px] ${isRunning ? cpuTone.text : 'text-cockpit-muted'}`}>
                        {isRunning ? container.cpuPercent.toFixed(1) : '0.0'}%
                      </span>
                      <Sparkline
                        data={container.sparklineCpu}
                        tone={container.cpuPercent > 75 ? 'warn' : 'accent'}
                        width={52}
                        height={18}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="metric w-16 text-[12.5px]">
                        {isRunning ? formatBytes(container.memoryBytes) : '0 B'}
                      </span>
                      <Sparkline data={container.sparklineMemory} tone="muted" width={52} height={18} />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 font-mono text-[12px] tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-cockpit-text">
                        <ArrowDown className="h-3 w-3 text-cockpit-accent" />
                        {formatNetworkRate(container.networkRxRateBytesPerSec)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-cockpit-muted">
                        <ArrowUp className="h-3 w-3" />
                        {formatNetworkRate(container.networkTxRateBytesPerSec)}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] tabular-nums text-cockpit-muted">
                      total {formatBytes(container.networkRxBytes)} / {formatBytes(container.networkTxBytes)}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
                      <button onClick={() => onViewLogs(container)} title="View logs" className="icon-btn">
                        <Terminal className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onRestartContainer(container)}
                        title="Restart container"
                        className="icon-btn hover:border-state-warn/40 hover:text-state-warn"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredContainers.length === 0 && (
          <p className="animate-fadeIn px-5 py-10 text-center text-[13px] text-cockpit-muted">
            No containers match this filter.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cockpit-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="label">Rows</span>
          <div className="seg">
            {PAGE_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={`seg-btn ${pageSize === size ? 'seg-btn-on' : ''}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-cockpit-muted">
          <span className="tabular-nums">
            {filteredContainers.length === 0
              ? '0 of 0'
              : `${pageStart + 1}–${Math.min(pageStart + pageSize, filteredContainers.length)} of ${filteredContainers.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="icon-btn disabled:pointer-events-none disabled:opacity-40"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 tabular-nums text-cockpit-text">
              {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= pageCount}
              className="icon-btn disabled:pointer-events-none disabled:opacity-40"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
