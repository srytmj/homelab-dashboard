import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X, Check } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { authFetch } from '../utils/api.js';

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
      const res = await authFetch(`/api/containers/${container.id}/restart`, {
        method: 'POST',
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-amber-500/40 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a101f] border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Confirm Service Restart</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 font-mono text-xs">
          <p className="text-slate-300">
            Are you sure you want to trigger a graceful restart for container{' '}
            <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded">{container.name}</strong>?
          </p>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div>Image: <span className="text-slate-200">{container.image}</span></div>
            <div>Uptime: <span className="text-slate-200">{container.uptime}</span></div>
            {container.tailscaleUrl && (
              <div>Tailscale Route: <span className="text-indigo-300">{container.tailscaleUrl}</span></div>
            )}
          </div>

          {feedback && (
            <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
              feedback.success ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}>
              {feedback.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[#0a101f] border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRestart}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Restarting...' : 'Restart Container'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
