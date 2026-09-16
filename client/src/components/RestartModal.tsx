import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Square, Play, X, Check } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { authFetch } from '../utils/api.js';

export type PowerAction = 'restart' | 'stop' | 'start';

interface RestartModalProps {
  container: ContainerMetric | null;
  action?: PowerAction;
  onClose: () => void;
  onSuccess: () => void;
}

const COPY: Record<PowerAction, { title: string; body: string; verb: string; verbing: string; icon: React.ReactNode }> = {
  restart: {
    title: 'Restart',
    body: 'The container stops and starts again. Anything streaming through it drops for a few seconds.',
    verb: 'Restart',
    verbing: 'Restarting…',
    icon: <RefreshCw className="h-3.5 w-3.5" />,
  },
  stop: {
    title: 'Stop',
    body: 'The container is stopped and will not restart on its own. Anything it serves goes offline until you start it again.',
    verb: 'Stop',
    verbing: 'Stopping…',
    icon: <Square className="h-3.5 w-3.5" />,
  },
  start: {
    title: 'Start',
    body: 'The container is started from its current image and configuration.',
    verb: 'Start',
    verbing: 'Starting…',
    icon: <Play className="h-3.5 w-3.5" />,
  },
};

export const RestartModal: React.FC<RestartModalProps> = ({ container, action = 'restart', onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!container) return null;
  const copy = COPY[action];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/containers/${container.id}/${action}`, { method: 'POST' });
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

  return createPortal(
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-md shadow-2xl shadow-black/50">
        <div className="panel-head">
          <h3 className="panel-title">{copy.title} {container.name}?</h3>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-[13px] leading-relaxed text-cockpit-muted">{copy.body}</p>

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
            <button onClick={handleConfirm} disabled={isSubmitting} className="btn-danger">
              {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : copy.icon}
              {isSubmitting ? copy.verbing : copy.verb}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
