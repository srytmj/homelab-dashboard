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
      const res = await fetch(`/api/containers/${container.id}/restart`, {
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

        {/* Modal Content */}
        <div className="p-5">
          <p className="text-slate-300 text-sm mb-3">
            Are you sure you want to trigger a reboot for this container?
          </p>
          
          <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 font-mono text-xs mb-4">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Container:</span>
              <span className="text-cyan-400 font-bold">{container.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Short ID:</span>
              <span className="text-slate-300">{container.shortId}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Current Status:</span>
              <span className="text-emerald-400">{container.status}</span>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-mono mb-4 flex items-center gap-2 ${
                feedback.success
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {feedback.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRestart}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Restarting...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Execute Restart</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
