import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Download, RefreshCw, X } from 'lucide-react';
import { GitProjectStatus } from '../types.js';
import { authFetch } from '../utils/api.js';

interface GitPullModalProps {
  project: GitProjectStatus;
  onClose: () => void;
  onSuccess: () => void;
}

interface CheckPullResult {
  ok: boolean;
  message?: string;
  riskyFiles: string[];
  changedFiles: string[];
}

type Stage = 'checking' | 'ready' | 'pulling' | 'done';

export const GitPullModal: React.FC<GitPullModalProps> = ({ project, onClose, onSuccess }) => {
  const [stage, setStage] = useState<Stage>('checking');
  const [check, setCheck] = useState<CheckPullResult | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    authFetch(`/api/git-projects/${encodeURIComponent(project.containerName)}/check-pull`, { method: 'POST' })
      .then((res) => res.json())
      .then((data: CheckPullResult) => {
        if (!cancelled) {
          setCheck(data);
          setStage('ready');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [project.containerName]);

  const handlePull = async () => {
    setStage('pulling');
    try {
      const res = await authFetch(`/api/git-projects/${encodeURIComponent(project.containerName)}/pull`, {
        method: 'POST',
      });
      const data = await res.json();
      setResult(data);
      setStage('done');
      if (data.success) {
        onSuccess();
        setTimeout(onClose, 1800);
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Network error' });
      setStage('done');
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Pull &amp; rebuild · {project.containerName}</h3>
            <p className="panel-sub">
              {project.repoOwner}/{project.repoName}@{project.branch}
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {stage === 'checking' && (
            <div className="flex items-center gap-2 text-[13px] text-cockpit-muted">
              <RefreshCw className="h-4 w-4 animate-spin text-cockpit-accent" />
              Checking what would change…
            </div>
          )}

          {stage === 'ready' && check && !check.ok && (
            <p className="text-[12.5px] text-state-bad">{check.message || 'Could not check this project.'}</p>
          )}

          {stage === 'ready' && check?.ok && (
            <>
              <p className="text-[12.5px] text-cockpit-muted">
                {check.changedFiles.length === 0
                  ? 'No new commits on this branch — nothing to pull.'
                  : `${check.changedFiles.length} file(s) would change.`}
              </p>

              {check.riskyFiles.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-lg border border-state-bad/40 bg-state-bad/[0.07] px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-state-bad" />
                  <div className="text-[12.5px] leading-relaxed text-cockpit-text">
                    <p className="font-semibold text-state-bad">Possible database migration</p>
                    <p className="mt-1 text-cockpit-muted">
                      These changed files look like they touch a schema or migration — this is a pattern match,
                      not a guarantee. Check them before pulling if you're not sure:
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
            </>
          )}

          {stage === 'pulling' && (
            <div className="flex items-center gap-2 text-[13px] text-cockpit-muted">
              <RefreshCw className="h-4 w-4 animate-spin text-cockpit-accent" />
              Pulling and rebuilding — this can take a while…
            </div>
          )}

          {stage === 'done' && result && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] ${
                result.success ? 'bg-state-good/10 text-state-good' : 'bg-state-bad/10 text-state-bad'
              }`}
            >
              {result.success ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button onClick={onClose} disabled={stage === 'pulling'} className="btn-ghost">
              {stage === 'done' ? 'Close' : 'Cancel'}
            </button>
            {stage === 'ready' && check?.ok && check.changedFiles.length > 0 && (
              <button onClick={handlePull} className={check.riskyFiles.length > 0 ? 'btn-danger' : 'btn-primary'}>
                <Download className="h-3.5 w-3.5" />
                {check.riskyFiles.length > 0 ? 'Pull anyway' : 'Pull & rebuild'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
