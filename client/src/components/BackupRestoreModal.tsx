import React, { useState } from 'react';
import { AlertTriangle, Check, RotateCcw, X } from 'lucide-react';
import { authFetch } from '../utils/api.js';
import { BackupRunResult } from '../types.js';

interface BackupRestoreModalProps {
  sourcePaths: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ sourcePaths, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BackupRunResult | null>(null);

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      setResult(data);
      if (data.lastResult === 'success') {
        onSuccess();
        setTimeout(onClose, 1800);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Restore from backup</h3>
            <p className="panel-sub">Overwrites live paths with your last backup</p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-state-bad/40 bg-state-bad/[0.07] px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-state-bad" />
            <div className="text-[12.5px] leading-relaxed text-cockpit-text">
              <p className="font-semibold text-state-bad">This replaces what's currently here</p>
              <p className="mt-1 text-cockpit-muted">
                Every path below is overwritten with whatever's in your configured rclone remote. Anything
                changed locally since the last backup is lost.
              </p>
              <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-cockpit-text">
                {sourcePaths.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] ${
                result.lastResult === 'success' ? 'bg-state-good/10 text-state-good' : 'bg-state-bad/10 text-state-bad'
              }`}
            >
              {result.lastResult === 'success' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span>{result.lastResult === 'success' ? 'Restore complete.' : result.lastError || 'Restore failed.'}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button onClick={onClose} disabled={isSubmitting} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleRestore} disabled={isSubmitting} className="btn-danger">
              <RotateCcw className={`h-3.5 w-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? 'Restoring…' : 'Restore now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
