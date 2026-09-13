import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ProcessMetric } from '../types.js';
import { authFetch } from '../utils/api.js';
import { formatBytes, formatNetworkRate, getStatusColor } from '../utils/formatters.js';

type SortKey = 'cpu' | 'mem' | 'name' | 'disk';

const POLL_MS = 3000;

export const ProcessesPage: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessMetric[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('cpu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      authFetch('/api/processes')
        .then((res) => res.json())
        .then((data: ProcessMetric[]) => {
          if (!cancelled) {
            setProcesses(data);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setIsLoading(false);
        });
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const toggleSort = (column: SortKey) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return processes
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.command.toLowerCase().includes(q) ||
          p.user.toLowerCase().includes(q) ||
          String(p.pid).includes(q)
      )
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'cpu') diff = a.cpuPercent - b.cpuPercent;
        else if (sortBy === 'mem') diff = a.memBytes - b.memBytes;
        else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        else
          diff =
            (a.diskReadBytesPerSec ?? 0) + (a.diskWriteBytesPerSec ?? 0) -
            ((b.diskReadBytesPerSec ?? 0) + (b.diskWriteBytesPerSec ?? 0));
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [processes, search, sortBy, sortOrder]);

  const hasDiskData = processes.some((p) => p.diskReadBytesPerSec !== undefined);

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
          <h2 className="panel-title">Processes</h2>
          <p className="panel-sub">
            {isLoading ? 'Loading…' : `${processes.length} processes`} · top {processes.length} by CPU, refreshed
            every {POLL_MS / 1000}s
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cockpit-muted" />
          <input
            type="text"
            placeholder="Filter name, user, PID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field w-56 pl-8"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-cockpit-border font-mono text-[10px] uppercase tracking-[0.09em] text-cockpit-muted">
              <SortHeader column="name">Process</SortHeader>
              <th className="px-4 py-2.5 font-medium">PID</th>
              <th className="px-4 py-2.5 font-medium">User</th>
              <SortHeader column="cpu">CPU</SortHeader>
              <SortHeader column="mem">Memory</SortHeader>
              <SortHeader column="disk">Disk I/O</SortHeader>
            </tr>
          </thead>
          <tbody className="animate-fadeIn">
            {filtered.map((p) => {
              const cpuTone = getStatusColor(p.cpuPercent);
              return (
                <tr
                  key={p.pid}
                  className="border-b border-cockpit-border transition-colors last:border-b-0 hover:bg-cockpit-panelHover"
                >
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <span className="block font-semibold text-cockpit-text">{p.name}</span>
                      <span className="block truncate font-mono text-[10.5px] text-cockpit-muted" title={p.command}>
                        {p.command}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-cockpit-muted">{p.pid}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-cockpit-muted">{p.user}</td>
                  <td className="px-4 py-3">
                    <span className={`metric text-[12.5px] ${cpuTone.text}`}>{p.cpuPercent.toFixed(1)}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="metric text-[12.5px]">{formatBytes(p.memBytes)}</span>
                    <span className="ml-1.5 font-mono text-[10.5px] text-cockpit-muted">
                      {p.memPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] tabular-nums text-cockpit-muted">
                    {p.diskReadBytesPerSec === undefined
                      ? '—'
                      : `${formatNetworkRate(p.diskReadBytesPerSec)} / ${formatNetworkRate(p.diskWriteBytesPerSec ?? 0)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isLoading && filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-[13px] text-cockpit-muted">No processes match this filter.</p>
        )}
      </div>

      {!hasDiskData && !isLoading && processes.length > 0 && (
        <p className="border-t border-cockpit-border px-5 py-3 text-[11.5px] text-cockpit-muted">
          Per-process disk I/O reads /proc/[pid]/io and is only available on Linux, for processes the daemon has
          permission to inspect.
        </p>
      )}
    </section>
  );
};
