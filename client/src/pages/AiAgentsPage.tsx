import React, { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  Flame,
  Clock,
  Calendar,
  Zap,
  Info,
  RefreshCw,
  Radio,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { authFetch } from '../utils/api.js';
import { AiTelemetryResponse } from '../types.js';

export const AiAgentsPage: React.FC = () => {
  const [data, setData] = useState<AiTelemetryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'claude' | 'gemini'>('all');
  const [showDocs, setShowDocs] = useState(false);
  const [, setTick] = useState(0);

  const fetchTelemetry = async () => {
    try {
      const res = await authFetch('/api/ai-agents/telemetry');
      if (!res.ok) {
        throw new Error(`Failed to fetch AI telemetry (${res.status})`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error loading AI telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  // Timer tick for live cooldown second countdown
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredAgents = useMemo(() => {
    if (!data?.agents) return [];
    return data.agents.filter((agent) => {
      if (filter === 'active') return agent.status === 'running';
      if (filter === 'claude') return agent.provider.toLowerCase().includes('claude') || agent.id.includes('claude');
      if (filter === 'gemini') return agent.provider.toLowerCase().includes('antigravity') || agent.id.includes('antigravity');
      return true;
    });
  }, [data, filter]);

  const formatCountdown = (targetDateStr?: string) => {
    if (!targetDateStr) return 'No active cooldown';
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((target - now) / 1000));
    if (diff <= 0) return 'Slot freed';
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-cockpit-text">
            <Sparkles className="h-6 w-6 text-cockpit-accent animate-pulse" />
            AI Agents Monitor
          </h1>
          <p className="text-xs text-cockpit-muted mt-1">
            Real-time usage tracking, 5-hour rolling windows, cooldown counters, and weekly burn rates via T3 Code.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className="btn btn-secondary inline-flex items-center gap-1.5 text-xs"
          >
            <Info className="h-3.5 w-3.5 text-cockpit-accent" />
            <span>T3 Setup & Docs</span>
            {showDocs ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </button>
          <button
            onClick={fetchTelemetry}
            className="btn btn-secondary inline-flex items-center gap-1.5 text-xs"
            title="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-panel border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Docs / How It Works Collapsible Banner */}
      {showDocs && (
        <div className="panel animate-fade-in-up border border-cockpit-accent/30 bg-cockpit-panel/90 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-cockpit-text font-semibold text-sm">
              <Info className="h-4 w-4 text-cockpit-accent" />
              <span>How AI Telemetry Works & Prerequisites</span>
            </div>
            <span className="pill text-[10.5px] bg-cockpit-accent/15 text-cockpit-accent border-cockpit-accent/30">
              Zero-API-Key Architecture
            </span>
          </div>
          <div className="text-xs text-cockpit-muted space-y-2.5 leading-relaxed">
            <p>
              This dashboard monitors AI agents authenticated through <strong>T3 Code</strong> (such as your{' '}
              <span className="text-cockpit-text font-medium">Claude Pro Subscription</span> and{' '}
              <span className="text-cockpit-text font-medium">Google Account OAuth</span> for Gemini/Antigravity).
              It tracks message turns and calculates sliding 5-hour limits and weekly reset cycles without requiring separate metered API keys.
            </p>
            <div className="rounded-lg bg-cockpit-bg/60 p-3 border border-cockpit-border space-y-1.5 font-mono text-[11px]">
              <div className="text-cockpit-text font-semibold">Requirements for other Homelab setups:</div>
              <div>• <strong>T3 Data Directory:</strong> Default path is <code className="text-cockpit-accent">~/.t3</code> (configurable via <code className="text-cockpit-accent">T3_DATA_DIR</code> environment variable).</div>
              <div>• <strong>Docker Deployment:</strong> Mount the host T3 directory into the container: <code className="text-cockpit-accent">-v ~/.t3:/root/.t3:ro</code>.</div>
              <div>• <strong>Files Read:</strong> <code className="text-cockpit-accent">~/.t3/caches/*.json</code> (agent metadata) and <code className="text-cockpit-accent">~/.t3/userdata/state.sqlite</code> (read-only turn history).</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="panel p-4 animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between text-cockpit-muted text-xs">
            <span>Active Agents</span>
            <Radio className="h-4 w-4 text-cockpit-success animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cockpit-text">
              {data?.summary.activeAgentsNow ?? 0}
            </span>
            <span className="text-xs text-cockpit-muted">/ {data?.summary.totalAgents ?? 4} registered</span>
          </div>
          <div className="mt-1 text-[11px] text-cockpit-success flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cockpit-success inline-block"></span>
            Real-time multi-agent sync
          </div>
        </div>

        <div className="panel p-4 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between text-cockpit-muted text-xs">
            <span>Turns Today</span>
            <Flame className="h-4 w-4 text-cockpit-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cockpit-text">
              {data?.summary.totalTurnsToday ?? 0}
            </span>
            <span className="text-xs text-cockpit-muted">prompts</span>
          </div>
          <div className="mt-1 text-[11px] text-cockpit-muted">
            All-time: <span className="text-cockpit-text font-mono">{data?.summary.totalTurnsAllTime ?? 0}</span>
          </div>
        </div>

        <div className="panel p-4 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between text-cockpit-muted text-xs">
            <span>5-Hour Rolling Peak</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cockpit-text">
              {data ? Math.max(...data.agents.map((a) => a.rolling5h.usagePercent), 0) : 0}%
            </span>
            <span className="text-xs text-cockpit-muted">window load</span>
          </div>
          <div className="mt-1 text-[11px] text-cockpit-muted">
            Safe zone (&lt;85% threshold)
          </div>
        </div>

        <div className="panel p-4 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between text-cockpit-muted text-xs">
            <span>Telemetry Engine</span>
            <Zap className="h-4 w-4 text-cockpit-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-semibold font-mono text-cockpit-text">
              {data?.isT3Detected ? 'T3 Code Linked' : 'Offline'}
            </span>
          </div>
          <div className="mt-1 text-[10.5px] text-cockpit-muted truncate" title={data?.t3Path}>
            {data?.t3Path || '~/.t3'}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-cockpit-border pb-3">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'claude', 'gemini'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filter === tab
                  ? 'bg-cockpit-accent text-white shadow-sm shadow-cockpit-accent/30'
                  : 'bg-cockpit-panel text-cockpit-muted hover:text-cockpit-text hover:bg-cockpit-border/40'
              }`}
            >
              {tab === 'all' && 'All Agents'}
              {tab === 'active' && 'Active Only'}
              {tab === 'claude' && 'Claude'}
              {tab === 'gemini' && 'Gemini / Antigravity'}
            </button>
          ))}
        </div>
        <span className="text-xs text-cockpit-muted font-mono">
          Showing {filteredAgents.length} agents
        </span>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredAgents.map((agent) => {
          const isClaude = agent.provider.toLowerCase().includes('claude') || agent.id.includes('claude');
          const isRunning = agent.status === 'running';
          const usage5h = agent.rolling5h.usagePercent;
          const usageColor =
            usage5h >= 85 ? 'bg-red-500 text-red-500' : usage5h >= 60 ? 'bg-amber-400 text-amber-400' : 'bg-cockpit-accent text-cockpit-accent';

          return (
            <div
              key={agent.id}
              className={`panel relative overflow-hidden p-5 transition-all duration-300 hover:border-cockpit-accent/50 ${
                isRunning ? 'border-cockpit-accent/40 shadow-lg shadow-cockpit-accent/5' : ''
              }`}
            >
              {/* Top Card Bar */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      isClaude
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    {isClaude ? <Bot className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-cockpit-text text-sm">{agent.displayName}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isRunning
                            ? 'bg-cockpit-success/15 text-cockpit-success border border-cockpit-success/30'
                            : 'bg-cockpit-border/40 text-cockpit-muted'
                        }`}
                      >
                        {isRunning && <span className="h-1.5 w-1.5 rounded-full bg-cockpit-success animate-ping"></span>}
                        {isRunning ? 'Running turn' : 'Idle'}
                      </span>
                    </div>
                    <div className="text-[11px] text-cockpit-muted truncate max-w-[240px] mt-0.5">
                      {agent.account} · <span className="text-cockpit-accent">{agent.plan}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded bg-cockpit-border/40 px-2 py-1 font-mono text-[10.5px] text-cockpit-text border border-cockpit-border">
                    {agent.currentModel}
                  </span>
                </div>
              </div>

              {/* 5-Hour Rolling Limit Section */}
              <div className="mt-5 rounded-xl border border-cockpit-border bg-cockpit-bg/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-cockpit-text font-medium">
                    <Clock className="h-3.5 w-3.5 text-cockpit-accent" />
                    5-Hour Rolling Window
                  </span>
                  <div className="font-mono text-xs">
                    <span className="font-bold text-cockpit-text">{agent.rolling5h.turnsCount}</span>
                    <span className="text-cockpit-muted"> / ~{agent.rolling5h.estimatedLimit} turns</span>
                    <span className={`ml-2 font-semibold ${usageColor.split(' ')[1]}`}>
                      ({agent.rolling5h.usagePercent}%)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-cockpit-border/60">
                  <div
                    className={`h-full transition-all duration-500 ${usageColor.split(' ')[0]}`}
                    style={{ width: `${Math.max(agent.rolling5h.usagePercent, 2)}%` }}
                  />
                </div>

                {/* Cooldown Timer */}
                <div className="flex items-center justify-between text-[11px] text-cockpit-muted pt-1">
                  <span>
                    {agent.rolling5h.turnsCount > 0 ? (
                      <>
                        Earliest turn frees:{' '}
                        <strong className="text-cockpit-text font-mono">
                          {formatCountdown(agent.rolling5h.resetAt)}
                        </strong>
                      </>
                    ) : (
                      'Quota fully refreshed'
                    )}
                  </span>
                  {agent.rolling5h.resetAt && (
                    <span className="font-mono text-[10px]">
                      {new Date(agent.rolling5h.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Weekly History Section */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-cockpit-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-cockpit-muted" />
                    Past 7 Days Activity
                  </span>
                  <span className="font-mono text-[11px]">
                    <span className="text-cockpit-text font-semibold">{agent.weekly.turnsCount}</span>
                    <span className="text-cockpit-muted"> / ~{agent.weekly.estimatedLimit} weekly turns ({agent.weekly.usagePercent}%)</span>
                  </span>
                </div>

                {/* Weekly Mini Bars */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {agent.weekly.dailyCounts.map((day) => {
                    const maxVal = Math.max(...agent.weekly.dailyCounts.map((d) => d.count), 1);
                    const heightPercent = Math.max(Math.round((day.count / maxVal) * 100), 12);

                    return (
                      <div key={day.date} className="flex flex-col items-center gap-1">
                        <div className="relative flex h-14 w-full items-end justify-center rounded bg-cockpit-bg/40 p-0.5">
                          <div
                            className={`w-full rounded-sm transition-all duration-300 ${
                              day.count > 0 ? 'bg-cockpit-accent/80 hover:bg-cockpit-accent' : 'bg-cockpit-border/30'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                            title={`${day.date}: ${day.count} turns`}
                          />
                        </div>
                        <span className="font-mono text-[9.5px] text-cockpit-muted">{day.dayName}</span>
                        <span className="font-mono text-[9px] text-cockpit-text font-medium">{day.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Turns Activity Stream */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cockpit-accent animate-pulse" />
            <h2 className="font-semibold text-cockpit-text text-sm">Recent Interactions Stream</h2>
          </div>
          <span className="text-xs text-cockpit-muted font-mono">Live turn timeline</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-cockpit-border text-cockpit-muted text-[11px]">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Agent</th>
                <th className="pb-2 font-medium">Model</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cockpit-border/40">
              {data?.recentTurns && data.recentTurns.length > 0 ? (
                data.recentTurns.map((turn) => {
                  const isRunning = turn.state === 'running';
                  return (
                    <tr key={turn.turnId} className="hover:bg-cockpit-panel/60 transition-colors">
                      <td className="py-2.5 text-cockpit-muted text-[11px]">
                        {new Date(turn.requestedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 text-cockpit-text font-medium">
                        {turn.agentName}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded bg-cockpit-border/40 px-1.5 py-0.5 text-[10px] text-cockpit-accent">
                          {turn.model}
                        </span>
                      </td>
                      <td className="py-2.5 text-cockpit-muted">
                        {turn.durationSeconds !== undefined ? `${turn.durationSeconds}s` : isRunning ? 'In progress...' : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isRunning
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-cockpit-success/15 text-cockpit-success border border-cockpit-success/30'
                          }`}
                        >
                          {isRunning ? 'Processing' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-cockpit-muted">
                    No recent interaction turns recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
