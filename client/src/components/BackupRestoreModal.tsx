import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl shadow-black/60 my-auto animate-scale-up">
        <div className="panel-head shrink-0">
          <div>
            <h3 className="panel-title">Restore from backup</h3>
            <p className="panel-sub">Pulls the latest snapshot from your rclone remote</p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5 overflow-y-auto flex-1 scrollbar-thin">
          <div className="flex items-start gap-3 rounded-xl border border-state-bad/30 bg-state-bad/10 p-3.5 text-[12.5px] text-state-bad">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">This will overwrite local data</p>
              <p className="mt-0.5 text-cockpit-muted">
                Files in the configured paths will be overwritten with the snapshot in the remote. Stop any services
                writing to them before restoring.
              </p>
            </div>
          </div>

          <div>
            <p className="label mb-2">Paths to restore</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-cockpit-border bg-cockpit-panel p-2">
              <ul className="space-y-1 font-mono text-[11.5px] text-cockpit-muted">
                {sourcePaths.map((p) => (
                  <li key={p} className="truncate">
                    {p}
                  </li>
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
    </div>,
    document.body
  );
};
