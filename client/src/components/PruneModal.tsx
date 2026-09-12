import { useState } from 'react';
import { Trash2, AlertOctagon, Check, X, HardDrive } from 'lucide-react';
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
        setResultMessage(data.message || 'Prune operation failed');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResultMessage(err.message || 'Network error during prune');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                Docker NVMe Disk Hygiene
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Reclaim unused image layers & build cache
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Estimated Reclaimable:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {hygiene ? formatBytes(hygiene.reclaimableBytes) : '14.8 GB'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Dangling Images:</span>
            <span className="text-cyan-300 font-semibold">{hygiene?.danglingImagesCount || 8} layers</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Build Cache:</span>
            <span className="text-slate-200 font-semibold">{hygiene ? formatBytes(hygiene.buildCacheBytes) : '9.4 GB'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Last Prune:</span>
            <span className="text-slate-400">{hygiene?.lastPrunedTime || 'Never'}</span>
          </div>
        </div>

        {/* Safe notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
          <AlertOctagon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            This action runs a safe prune: only untagged/dangling image layers and builder cache will be removed. Active containers and named volumes will <strong>not</strong> be touched.
          </span>
        </div>

        {/* Result Message */}
        {resultMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
              isSuccess
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
            }`}
          >
            {isSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertOctagon className="w-4 h-4 text-rose-400" />}
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrune}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Pruning SSD...' : 'Confirm Safe Prune'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
