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
  LayoutGrid,
  List,
  X,
  Square,
  Play,
} from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { Sparkline } from './Sparkline.js';
import { formatBytes, formatNetworkRate, redactText, getStatusColor } from '../utils/formatters.js';
import { PowerAction } from './RestartModal.js';

interface ContainerGridSectionProps {
  containers: ContainerMetric[] | undefined;
  isPrivacyMode?: boolean;
  onViewLogs: (container: ContainerMetric) => void;
  onPowerAction: (container: ContainerMetric, action: PowerAction) => void;
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
  onPowerAction,
  onPinContainer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'exited'>('all');
  const [pinnedFilter, setPinnedFilter] = useState<'all' | 'pinned'>('all');
  const [hostFilter, setHostFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    try {
      return (localStorage.getItem('cockpit-fleet-view') as 'table' | 'cards') || 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleSetViewMode = (mode: 'table' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('cockpit-fleet-view', mode);
    } catch {}
  };

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
        if (pinnedFilter === 'pinned' && !c.isPinned) return false;
        if (hostFilter !== 'all' && c.dockerHost !== hostFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'cpu') diff = a.cpuPercent - b.cpuPercent;
        else if (sortBy === 'ram') diff = a.memoryBytes - b.memoryBytes;
        else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        else
          diff =
            a.networkRxRateBytesPerSec +
            a.networkTxRateBytesPerSec -
            (b.networkRxRateBytesPerSec + b.networkTxRateBytesPerSec);
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [containers, search, statusFilter, pinnedFilter, hostFilter, sortBy, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredContainers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleContainers = filteredContainers.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pinnedFilter, hostFilter, pageSize]);

  const toggleSort = (column: SortKey) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'name' ? 'asc' : 'desc');
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
      <div className="panel-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="panel-title">Container fleet</h2>
          <p className="panel-sub">
            {runningCount} running of {containers.length} · live throughput &amp; L7 probes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:flex-initial min-w-[160px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cockpit-muted" />
            <input
              type="text"
              placeholder="Filter name, image, port"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field w-full sm:w-44 lg:w-56 !pl-9 pr-7 text-[12.5px]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-cockpit-muted hover:text-cockpit-text"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
            <button
              onClick={() => setPinnedFilter('all')}
              className={`seg-btn ${pinnedFilter === 'all' ? 'seg-btn-on' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setPinnedFilter('pinned')}
              className={`seg-btn inline-flex items-center gap-1 ${pinnedFilter === 'pinned' ? 'seg-btn-on' : ''}`}
            >
              <Pin className="h-3 w-3" />
              Pinned
            </button>
          </div>

          {hostNames.length > 1 && <HostFilter hosts={hostNames} value={hostFilter} onChange={setHostFilter} />}

          {/* Card View Sort Controls */}
          {viewMode === 'cards' && (
            <div className="flex items-center gap-1.5" title="Sort fleet containers">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const key = e.target.value as SortKey;
                    setSortBy(key);
                    setSortOrder(key === 'name' ? 'asc' : 'desc');
                  }}
                  className="field py-1 pl-2.5 pr-7 text-[12px] bg-cockpit-panel cursor-pointer rounded-lg border-cockpit-border focus:border-cockpit-accent text-cockpit-text"
                >
                  <option value="name">Sort: Name</option>
                  <option value="cpu">Sort: CPU</option>
                  <option value="ram">Sort: RAM</option>
                  <option value="network">Sort: Network</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cockpit-muted" />
              </div>
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                title={sortOrder === 'asc' ? 'Ascending (A-Z / Min-Max) - Click for Descending' : 'Descending (Z-A / Max-Min) - Click for Ascending'}
                className="icon-btn h-[33px] px-2 flex items-center gap-1 border border-cockpit-border hover:border-cockpit-accent/40 rounded-lg"
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="h-3.5 w-3.5 text-cockpit-accent" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 text-cockpit-accent" />
                )}
                <span className="text-[10px] font-mono uppercase text-cockpit-muted">
                  {sortOrder}
                </span>
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="seg hidden sm:inline-flex" title="Switch layout view">
            <button
              onClick={() => handleSetViewMode('table')}
              className={`seg-btn px-2 ${viewMode === 'table' ? 'seg-btn-on' : ''}`}
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleSetViewMode('cards')}
              className={`seg-btn px-2 ${viewMode === 'cards' ? 'seg-btn-on' : ''}`}
              title="Grid cards view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'cards' ? (
        /* Card / Grid View */
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 animate-fadeIn">
            {visibleContainers.map((container) => {
              const isRunning = container.state === 'running';
              const cpuTone = getStatusColor(container.cpuPercent);
              const probe = container.httpHealth;

              return (
                <div
                  key={container.id}
                  className="container-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${isRunning ? 'bg-state-good' : 'bg-cockpit-muted'}`}
                        />
                        <span className="font-bold text-cockpit-text truncate text-[14px]" title={container.name}>
                          {container.name}
                        </span>
                        <span className="font-mono text-[10.5px] text-cockpit-muted shrink-0">
                          #{container.shortId}
                        </span>
                      </div>
                      <button
                        onClick={() => onPinContainer(container)}
                        title={container.isPinned ? 'Edit pin' : 'Pin to command palette'}
                        className={`icon-btn p-1.5 shrink-0 hover:border-cockpit-accent/40 hover:text-cockpit-accent ${
                          container.isPinned ? 'border-cockpit-accent/30 text-cockpit-accent' : ''
                        }`}
                      >
                        <Pin className={`h-3 w-3 ${container.isPinned ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="mt-1 truncate font-mono text-[11px] text-cockpit-muted" title={container.image}>
                      {container.image}
                    </div>

                    {hostNames.length > 1 && (
                      <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] text-cockpit-muted bg-cockpit-border/40 px-1.5 py-0.5 rounded">
                        <Server className="h-2.5 w-2.5" />
                        {container.dockerHost}
                      </div>
                    )}

                    {/* Health & Uptime */}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-cockpit-border/60 pt-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                      <span className="font-mono text-[10.5px] text-cockpit-muted whitespace-nowrap">
                        {container.uptime}
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-cockpit-border/50 bg-cockpit-panel/40 p-2 text-center">
                      <div>
                        <p className="label text-[9.5px]">CPU</p>
                        <p className={`metric mt-0.5 text-[12.5px] ${isRunning ? cpuTone.text : 'text-cockpit-muted'}`}>
                          {isRunning ? container.cpuPercent.toFixed(1) : '0.0'}%
                        </p>
                      </div>
                      <div className="border-x border-cockpit-border/40">
                        <p className="label text-[9.5px]">RAM</p>
                        <p className="metric mt-0.5 text-[12.5px]">
                          {isRunning ? formatBytes(container.memoryBytes) : '0 B'}
                        </p>
                      </div>
                      <div>
                        <p className="label text-[9.5px]">NET</p>
                        <div className="mt-0.5 font-mono text-[10.5px] tabular-nums text-cockpit-text">
                          <div className="flex items-center justify-center gap-0.5">
                            <ArrowDown className="h-2.5 w-2.5 text-cockpit-accent" />
                            {formatNetworkRate(container.networkRxRateBytesPerSec)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-cockpit-border/60 pt-3">
                    <WebUiMenu container={container} isPrivacyMode={isPrivacyMode} />
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onViewLogs(container)} title="View logs" className="icon-btn p-1.5">
                        <Terminal className="h-3.5 w-3.5" />
                      </button>
                      {isRunning ? (
                        <button
                          onClick={() => onPowerAction(container, 'stop')}
                          title="Stop container"
                          className="icon-btn p-1.5 hover:border-state-bad/40 hover:text-state-bad"
                        >
                          <Square className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onPowerAction(container, 'start')}
                          title="Start container"
                          className="icon-btn p-1.5 hover:border-state-good/40 hover:text-state-good"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onPowerAction(container, 'restart')}
                        title="Restart container"
                        className="icon-btn p-1.5 hover:border-state-warn/40 hover:text-state-warn"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredContainers.length === 0 && (
            <p className="animate-fadeIn px-5 py-10 text-center text-[13px] text-cockpit-muted">
              No containers match this filter.
            </p>
          )}
        </div>
      ) : (
        /* Responsive Table View */
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-[13px] min-w-[680px]">
            <thead>
              <tr className="border-b border-cockpit-border font-mono text-[10px] uppercase tracking-[0.09em] text-cockpit-muted">
                <SortHeader column="name" className="w-auto">Service</SortHeader>
                <th className="px-4 py-2.5 font-medium w-32 whitespace-nowrap">Health</th>
                <th className="px-4 py-2.5 font-medium w-24 whitespace-nowrap">Web UI</th>
                <SortHeader column="cpu" className="w-24 whitespace-nowrap">CPU</SortHeader>
                <SortHeader column="ram" className="w-28 whitespace-nowrap">Memory</SortHeader>
                <SortHeader column="network" className="w-36 whitespace-nowrap">Throughput</SortHeader>
                <th className="px-4 py-2.5 text-right font-medium w-32 whitespace-nowrap">Actions</th>
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
                    <td className="px-4 py-3 min-w-[160px] max-w-[280px]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${isRunning ? 'bg-state-good' : 'bg-cockpit-muted'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            {container.isPinned && (
                              <Pin className="h-3 w-3 shrink-0 fill-cockpit-accent text-cockpit-accent" />
                            )}
                            <span className="font-semibold text-cockpit-text truncate">{container.name}</span>
                            <span className="font-mono text-[10.5px] text-cockpit-muted shrink-0">#{container.shortId}</span>
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

                    <td className="px-4 py-3 whitespace-nowrap">
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

                    <td className="px-4 py-3 whitespace-nowrap">
                      <WebUiMenu container={container} isPrivacyMode={isPrivacyMode} />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`metric text-[12.5px] tabular-nums shrink-0 ${isRunning ? cpuTone.text : 'text-cockpit-muted'}`}>
                          {isRunning ? container.cpuPercent.toFixed(1) : '0.0'}%
                        </span>
                        <div className="hidden xl:block shrink-0">
                          <Sparkline
                            data={container.sparklineCpu}
                            tone={container.cpuPercent > 75 ? 'warn' : 'accent'}
                            width={48}
                            height={18}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="metric text-[12.5px] tabular-nums shrink-0">
                          {isRunning ? formatBytes(container.memoryBytes) : '0 B'}
                        </span>
                        <div className="hidden xl:block shrink-0">
                          <Sparkline data={container.sparklineMemory} tone="muted" width={48} height={18} />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[12px] tabular-nums">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5 text-cockpit-text">
                            <ArrowDown className="h-3 w-3 text-cockpit-accent shrink-0" />
                            {formatNetworkRate(container.networkRxRateBytesPerSec)}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-cockpit-muted">
                            <ArrowUp className="h-3 w-3 shrink-0" />
                            {formatNetworkRate(container.networkTxRateBytesPerSec)}
                          </span>
                        </div>
                        <div className="text-[10px] text-cockpit-muted truncate">
                          {formatBytes(container.networkRxBytes)} / {formatBytes(container.networkTxBytes)}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                        {isRunning ? (
                          <button
                            onClick={() => onPowerAction(container, 'stop')}
                            title="Stop container"
                            className="icon-btn hover:border-state-bad/40 hover:text-state-bad"
                          >
                            <Square className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onPowerAction(container, 'start')}
                            title="Start container"
                            className="icon-btn hover:border-state-good/40 hover:text-state-good"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onPowerAction(container, 'restart')}
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
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cockpit-border px-4 sm:px-5 py-3">
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
