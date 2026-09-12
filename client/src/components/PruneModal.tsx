import React, { useState } from 'react';
import { Trash2, AlertOctagon, Check, X } from 'lucide-react';
import { DockerDiskHygiene } from '../types.js';
import { formatBytes } from '../utils/formatters.js';

interface PruneModalProps {
  hygiene: DockerDiskHygiene | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

export const PruneModal: React.FC<PruneModalProps> = ({ hygiene, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePrune = async () => {
    setLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch('/api/docker/prune', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setResultMessage(data.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      } else {
        setIsSuccess(false);
        setResultMessage(data.message || 'Prune failed');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResultMessage(err.message || 'Network error during prune');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Reclaim Docker disk space</h3>
            <p className="panel-sub">Unused image layers and build cache</p>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-cockpit-border bg-cockpit-bg px-4 py-1">
            <div className="data-row">
              <span className="text-cockpit-muted">Reclaimable</span>
              <span className="metric text-[12.5px] text-cockpit-accent">
                {hygiene ? formatBytes(hygiene.reclaimableBytes) : '—'}
              </span>
            </div>
            <div className="data-row">
              <span className="text-cockpit-muted">Dangling images</span>
              <span className="metric text-[12.5px]">{hygiene?.danglingImagesCount ?? 0} layers</span>
            </div>
            <div className="data-row">
              <span className="text-cockpit-muted">Build cache</span>
              <span className="metric text-[12.5px]">{hygiene ? formatBytes(hygiene.buildCacheBytes) : '—'}</span>
            </div>
            <div className="data-row">
              <span className="text-cockpit-muted">Last prune</span>
              <span className="metric text-[12.5px]">{hygiene?.lastPrunedTime || 'Never'}</span>
            </div>
          </div>

          <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-cockpit-muted">
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-cockpit-accent" />
            Only untagged layers and builder cache are removed. Running containers and named volumes stay untouched.
          </p>

          {resultMessage && (
            <div
              className={`flex animate-fadeIn items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] ${
                isSuccess ? 'bg-state-good/10 text-state-good' : 'bg-state-bad/10 text-state-bad'
              }`}
            >
              {isSuccess ? <Check className="h-4 w-4" /> : <AlertOctagon className="h-4 w-4" />}
              <span>{resultMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button onClick={onClose} disabled={loading} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handlePrune} disabled={loading} className="btn-danger">
              <Trash2 className="h-3.5 w-3.5" />
              {loading ? 'Pruning…' : 'Prune now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
