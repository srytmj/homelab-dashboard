import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X, Check } from 'lucide-react';
import { ContainerMetric } from '../types.js';

interface RestartModalProps {
  container: ContainerMetric | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RestartModal: React.FC<RestartModalProps> = ({ container, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!container) return null;

  const handleRestart = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/containers/${container.id}/restart`, { method: 'POST' });
      const data = await res.json();
      setFeedback({ success: data.success, message: data.message });
      if (data.success) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <h3 className="panel-title">Restart {container.name}?</h3>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-[13px] leading-relaxed text-cockpit-muted">
            The container stops and starts again. Anything streaming through it drops for a few seconds.
          </p>

          <div className="rounded-lg border border-cockpit-border bg-cockpit-bg px-4 py-1">
            <div className="data-row">
              <span className="text-cockpit-muted">Container</span>
              <span className="metric text-[12.5px]">{container.name}</span>
            </div>
            <div className="data-row">
              <span className="text-cockpit-muted">Short ID</span>
              <span className="metric text-[12.5px]">{container.shortId}</span>
            </div>
            <div className="data-row">
              <span className="text-cockpit-muted">Current status</span>
              <span className="metric text-[12.5px]">{container.status}</span>
            </div>
          </div>

          {feedback && (
            <div
              className={`flex animate-fadeIn items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] ${
                feedback.success ? 'bg-state-good/10 text-state-good' : 'bg-state-bad/10 text-state-bad'
              }`}
            >
              {feedback.success ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button onClick={onClose} disabled={isSubmitting} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleRestart} disabled={isSubmitting} className="btn-danger">
              <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              {isSubmitting ? 'Restarting…' : 'Restart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
