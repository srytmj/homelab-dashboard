import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pin,
  Server,
} from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { Sparkline } from './Sparkline.js';
import { formatBytes, formatNetworkRate, redactText, getStatusColor } from '../utils/formatters.js';

interface ContainerGridSectionProps {
  containers: ContainerMetric[] | undefined;
  isPrivacyMode?: boolean;
  onViewLogs: (container: ContainerMetric) => void;
  onRestartContainer: (container: ContainerMetric) => void;
  onPinContainer: (container: ContainerMetric) => void;
}

type SortKey = 'cpu' | 'ram' | 'name' | 'network';

const PAGE_SIZES = [10, 25, 50, 100];
const HOST_DROPDOWN_THRESHOLD = 5;

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}

const WebUiMenu: React.FC<{ container: ContainerMetric; isPrivacyMode: boolean }> = ({
  container,
  isPrivacyMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const ref = useClickOutside(() => setIsOpen(false));

  const links = [
    { label: 'Public domain', url: container.publicUrl },
    { label: 'Tailscale', url: container.tailscaleUrl },
    { label: 'LAN', url: container.lanUrl },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  if (links.length === 0) {
    return <span className="font-mono text-[11px] text-cockpit-muted">internal</span>;
  }

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        title="Choose which address to open"
        className="inline-flex items-center gap-1 rounded-md border border-cockpit-border px-2 py-1 font-mono text-[11px] text-cockpit-accent transition-colors hover:border-cockpit-accent/40"
      >
        <ExternalLink className="h-3 w-3" />:{container.primaryPort}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {isOpen && (
        <div className="modal-panel absolute left-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-panel shadow-lg shadow-black/30">
          {links.map((link) => (
            <div
              key={link.label}
              className="flex items-center justify-between gap-2 border-b border-cockpit-border px-3 py-2 last:border-b-0 hover:bg-cockpit-panelHover"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                className="min-w-0 flex-1"
              >
                <span className="block text-[11.5px] font-semibold text-cockpit-text">{link.label}</span>
                <span className="block truncate font-mono text-[10.5px] text-cockpit-muted">
                  {redactText(link.url, isPrivacyMode)}
                </span>
              </a>
              <button onClick={() => copy(link.url)} title="Copy URL" className="icon-btn shrink-0 p-1">
                {copiedUrl === link.url ? (
                  <Check className="h-3 w-3 animate-popIn text-state-good" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HostFilter: React.FC<{
  hosts: string[];
  value: string;
  onChange: (host: string) => void;
}> = ({ hosts, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useClickOutside(() => setIsOpen(false));

  if (hosts.length <= HOST_DROPDOWN_THRESHOLD) {
    return (
      <div className="seg">
        <button onClick={() => onChange('all')} className={`seg-btn ${value === 'all' ? 'seg-btn-on' : ''}`}>
          All docker
        </button>
        {hosts.map((host) => (
          <button
            key={host}
            onClick={() => onChange(host)}
            className={`seg-btn ${value === host ? 'seg-btn-on' : ''}`}
          >
            {host}
          </button>
        ))}
      </div>
    );
  }

  const filteredHosts = hosts.filter((h) => h.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen((v) => !v)} className="seg-btn seg-btn-on inline-flex items-center gap-1.5">
        <Server className="h-3 w-3" />
        {value === 'all' ? 'All docker' : value}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {isOpen && (
        <div className="modal-panel absolute left-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-panel shadow-lg shadow-black/30">
          <div className="border-b border-cockpit-border p-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docker host…"
              className="field w-full"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-cockpit-panelHover ${
                value === 'all' ? 'text-cockpit-accent' : 'text-cockpit-text'
              }`}
            >
              All docker
            </button>
            {filteredHosts.map((host) => (
              <button
                key={host}
                onClick={() => {
                  onChange(host);
                  setIsOpen(false);
                }}
                className={`block w-full truncate px-3 py-1.5 text-left text-[12.5px] hover:bg-cockpit-panelHover ${
                  value === host ? 'text-cockpit-accent' : 'text-cockpit-text'
                }`}
              >
                {host}
              </button>
            ))}
            {filteredHosts.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-cockpit-muted">No host matches "{query}".</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ContainerGridSection: React.FC<ContainerGridSectionProps> = ({
  containers = [],
  isPrivacyMode = false,
  onViewLogs,
  onRestartContainer,
  onPinContainer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'exited'>('all');
  const [hostFilter, setHostFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('cpu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const hostNames = useMemo(
    () => Array.from(new Set(containers.map((c) => c.dockerHost))).sort(),
    [containers]
  );

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
        if (hostFilter !== 'all' && c.dockerHost !== hostFilter) return false;
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
  }, [containers, search, statusFilter, hostFilter, sortBy, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredContainers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleContainers = filteredContainers.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, hostFilter, pageSize]);

  const toggleSort = (column: SortKey) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

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
    <section className="panel overflow-hidden animate-fade-in-up">
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

          {hostNames.length > 1 && <HostFilter hosts={hostNames} value={hostFilter} onChange={setHostFilter} />}
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
                          {container.isPinned && (
                            <Pin className="h-3 w-3 shrink-0 fill-cockpit-accent text-cockpit-accent" />
                          )}
                          <span className="font-semibold text-cockpit-text">{container.name}</span>
                          <span className="font-mono text-[10.5px] text-cockpit-muted">#{container.shortId}</span>
                        </div>
                        <div className="truncate font-mono text-[11px] text-cockpit-muted" title={container.image}>
                          {container.image}
                        </div>
                        {hostNames.length > 1 && (
                          <div className="mt-0.5 truncate font-mono text-[10px] text-cockpit-muted">
                            {container.dockerHost}
                          </div>
                        )}
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
                    <WebUiMenu container={container} isPrivacyMode={isPrivacyMode} />
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
                      <button
                        onClick={() => onPinContainer(container)}
                        title={container.isPinned ? 'Edit pin' : 'Pin to command palette'}
                        className={`icon-btn hover:border-cockpit-accent/40 hover:text-cockpit-accent ${
                          container.isPinned ? 'border-cockpit-accent/30 text-cockpit-accent' : ''
                        }`}
                      >
                        <Pin className={`h-3.5 w-3.5 ${container.isPinned ? 'fill-current' : ''}`} />
                      </button>
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
