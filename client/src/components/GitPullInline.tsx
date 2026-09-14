import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, RefreshCw, RotateCcw } from 'lucide-react';
import { GitProjectStatus, GitPullState } from '../types.js';
import { authFetch } from '../utils/api.js';

interface CheckPullResult {
  ok: boolean;
  message?: string;
  riskyFiles: string[];
  changedFiles: string[];
}

interface GitPullInlineProps {
  project: GitProjectStatus;
  onDone: () => void;
}

const STATUS_LABEL: Record<GitPullState['status'], string> = {
  idle: 'Idle',
  pulling: 'Pulling…',
  rebuilding: 'Rebuilding…',
  success: 'Done',
  failed: 'Failed',
};

export const GitPullInline: React.FC<GitPullInlineProps> = ({ project, onDone }) => {
  const [check, setCheck] = useState<CheckPullResult | null>(null);
  const [pullState, setPullState] = useState<GitPullState | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logRef = useRef<HTMLDivElement>(null);
  const isRunning = pullState?.status === 'pulling' || pullState?.status === 'rebuilding';

  // Pick up whatever's already happening server-side — this project may
  // have been started from another tab, or the owner navigated away and
  // came back, so this can't assume the run starts fresh from here.
  useEffect(() => {
    authFetch(`/api/git-projects/${encodeURIComponent(project.containerName)}/pull-status`)
      .then((res) => res.json())
      .then(setPullState)
      .catch(() => {});
  }, [project.containerName]);

  useEffect(() => {
    if (pullState && pullState.status !== 'idle') return; // already running or finished, nothing to check
    authFetch(`/api/git-projects/${encodeURIComponent(project.containerName)}/check-pull`, { method: 'POST' })
      .then((res) => res.json())
      .then(setCheck)
      .catch(() => setCheck({ ok: false, message: 'Network error', riskyFiles: [], changedFiles: [] }));
  }, [project.containerName, pullState]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      authFetch(`/api/git-projects/${encodeURIComponent(project.containerName)}/pull-status`)
        .then((res) => res.json())
        .then((data: GitPullState) => {
          setPullState(data);
          if (data.status === 'success' || data.status === 'failed') {
            onDone();
          }
        })
        .catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, project.containerName]);

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTo({ top: logRef.current.scrollHeight });
    }
  }, [pullState?.log.length, autoScroll]);

  const startPull = async () => {
    setAutoScroll(true);
    const res = await authFetch(`/api/git-projects/${encodeURIComponent(project.containerName)}/pull`, {
      method: 'POST',
    });
    const data = await res.json();
    if (data.started) {
      setPullState({ status: 'pulling', log: [] });
    }
  };

  const handleReset = async () => {
    try {
      await authFetch(`/api/git-projects/${encodeURIComponent(project.containerName)}/reset-pull`, {
        method: 'POST',
      });
    } catch {}
    setPullState(null);
    setCheck(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (autoScroll !== isNearBottom) {
      setAutoScroll(isNearBottom);
    }
  };

  const showLog = pullState && pullState.status !== 'idle';

  return (
    <div className="animate-fadeIn space-y-3 border-t border-cockpit-border bg-cockpit-bg px-4 py-3.5">
      {!showLog && check === null && (
        <div className="flex items-center gap-2 text-[12.5px] text-cockpit-muted">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-cockpit-accent" />
          Checking what would change…
        </div>
      )}

      {!showLog && check && !check.ok && (
        <p className="text-[12px] text-state-bad">{check.message || 'Could not check this project.'}</p>
      )}

      {!showLog && check?.ok && (
        <>
          <p className="text-[12px] text-cockpit-muted">
            {check.changedFiles.length === 0
              ? 'Already up to date — nothing new to pull.'
              : `${check.changedFiles.length} file(s) would change.`}
          </p>

          {check.riskyFiles.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-state-bad/40 bg-state-bad/[0.07] px-3.5 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-state-bad" />
              <div className="text-[12px] leading-relaxed text-cockpit-text">
                <p className="font-semibold text-state-bad">Possible database migration</p>
                <p className="mt-1 text-cockpit-muted">
                  These changed files look like they touch a schema or migration — check them before pulling if
                  you're not sure:
                </p>
                <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-cockpit-text">
                  {check.riskyFiles.map((f) => (
                    <li key={f} className="truncate">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {check.changedFiles.length > 0 ? (
              <button onClick={startPull} className={check.riskyFiles.length > 0 ? 'btn-danger' : 'btn-primary'}>
                <Download className="h-3.5 w-3.5" />
                {check.riskyFiles.length > 0 ? 'Pull anyway' : 'Pull & rebuild'}
              </button>
            ) : (
              <button onClick={startPull} className="btn-ghost" title="Runs pull & rebuild anyway, even with nothing new to pull — useful if the running container doesn't actually match what's checked out">
                <RefreshCw className="h-3.5 w-3.5" />
                Rebuild anyway
              </button>
            )}
          </div>
        </>
      )}

      {showLog && pullState && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
            <div className="flex items-center gap-2 min-w-0">
              {isRunning && <RefreshCw className="h-3.5 w-3.5 animate-spin text-cockpit-accent shrink-0" />}
              <span
                className={
                  pullState.status === 'success'
                    ? 'font-medium text-state-good'
                    : pullState.status === 'failed'
                      ? 'font-medium text-state-bad'
                      : 'font-medium text-cockpit-text'
                }
              >
                {STATUS_LABEL[pullState.status]}
              </span>
              {pullState.message && <span className="truncate text-cockpit-muted">— {pullState.message}</span>}
            </div>

            <div className="flex items-center gap-2">
              {isRunning ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded border border-state-bad/30 bg-state-bad/10 px-2.5 py-1 text-[11px] font-medium text-state-bad hover:bg-state-bad/20 transition-colors"
                  title="Batalkan proses pull & rebuild"
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startPull}
                    className="btn-primary flex items-center gap-1.5 px-2.5 py-1 text-[11px] h-auto"
                    title="Ulangi proses pull & rebuild"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-ghost px-2.5 py-1 text-[11px] h-auto"
                    title="Tutup log dan kembali ke pengecekan project"
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            ref={logRef}
            onScroll={handleScroll}
            className="max-h-56 overflow-y-auto rounded-lg border border-cockpit-border bg-cockpit-panel p-3 font-mono text-[11px] leading-relaxed text-cockpit-muted"
          >
            {pullState.log.length === 0 ? (
              <span>Waiting for output…</span>
            ) : (
              pullState.log.map((line, i) => <div key={i}>{line}</div>)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
