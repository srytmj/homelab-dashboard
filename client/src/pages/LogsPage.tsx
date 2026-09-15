import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import { AuditCategory, AuditLevel, AuditLogEntry } from '../types.js';

const POLL_MS = 5000;

const CATEGORIES: (AuditCategory | 'all')[] = [
  'all',
  'auth',
  'pin',
  'bookmark',
  'container',
  'git',
  'backup',
  'config',
  'app-update',
  'system',
];

const LEVELS: (AuditLevel | 'all')[] = ['all', 'info', 'warn', 'error'];

const LEVEL_PILL: Record<AuditLevel, string> = {
  info: 'pill-neutral',
  warn: 'pill-warn',
  error: 'pill-bad',
};

export const LogsPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [category, setCategory] = useState<AuditCategory | 'all'>('all');
  const [level, setLevel] = useState<AuditLevel | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    authFetch('/api/audit-log')
      .then((res) => res.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (level !== 'all' && e.level !== level) return false;
      if (q && !e.message.toLowerCase().includes(q) && !(e.actor || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, category, level, search]);

  const clear = async () => {
    if (!window.confirm('Clear the entire audit log? This cannot be undone.')) return;
    await authFetch('/api/audit-log/clear', { method: 'POST' });
    load();
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">System log</h2>
          <p className="panel-sub">Every state-changing action and error, in one place — auth, pins, containers, git, backup, config.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="icon-btn" title="Refresh now">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={clear} className="btn-danger flex items-center gap-1.5 text-[11.5px] py-1.5 px-2.5" title="Clear log">
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-cockpit-border/60 px-4 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search message or actor…"
          className="field w-full max-w-xs"
        />
        <div className="seg">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`seg-btn ${category === c ? 'seg-btn-on' : ''}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="seg">
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(l)} className={`seg-btn ${level === l ? 'seg-btn-on' : ''}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-cockpit-border/50">
        {isLoading && <div className="px-4 py-6 text-center text-[12.5px] text-cockpit-muted">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-[12.5px] text-cockpit-muted">No log entries match this filter.</div>
        )}
        {filtered.slice(0, 500).map((entry) => (
          <div key={entry.id} className="data-row items-start gap-3 px-4 py-2.5">
            <span className={`pill ${LEVEL_PILL[entry.level]} shrink-0`}>{entry.level}</span>
            <span className="label shrink-0 w-20 !normal-case !tracking-normal text-cockpit-muted">{entry.category}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-cockpit-text break-words">{entry.message}</p>
              {entry.detail && (
                <p className="mt-0.5 font-mono text-[10.5px] text-cockpit-muted break-all">{entry.detail.slice(0, 300)}</p>
              )}
            </div>
            <span className="metric shrink-0 text-[11px] text-cockpit-muted whitespace-nowrap">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
