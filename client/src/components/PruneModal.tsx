import { useState } from 'react';
import { Trash2, AlertOctagon, Check, X, HardDrive } from 'lucide-react';
import { DockerDiskHygiene } from '../types.js';
import { formatBytes } from '../utils/formatters.js';
import { authFetch } from '../utils/api.js';

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
      const res = await authFetch('/api/docker/prune', { method: 'POST' });
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
        setResultMessage(data.message || 'Prune operation failed');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResultMessage(err.message || 'Network error during prune');
    } finally {
      setLoading(false);
    }
  };

  const reclaimableGB = hygiene ? (hygiene.reclaimableBytes / (1024 * 1024 * 1024)).toFixed(2) : '0';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                Docker NVMe Storage Prune
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Clean dangling layers & build caches safely
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs text-slate-400 block font-sans">Reclaimable SSD Storage</span>
                <span className="text-base font-bold text-slate-100">
                  {hygiene ? formatBytes(hygiene.reclaimableBytes) : '0 GB'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              ~{reclaimableGB} GB
            </span>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              This operation executes <code>docker system prune -f</code> on the container runner host. It frees dangling images, builder caches, and unused networks without stopping or deleting active containers or persistent DAS volumes.
            </span>
          </div>

          {resultMessage && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {isSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertOctagon className="w-4 h-4 text-rose-400" />}
              <span>{resultMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2.5 text-xs font-mono">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrune}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Pruning...' : 'Prune Docker Storage'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
