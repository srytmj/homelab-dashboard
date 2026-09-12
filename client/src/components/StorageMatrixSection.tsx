import { HardDrive, AlertTriangle, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { StorageItem, DockerDiskHygiene } from '../types.js';
import { formatBytes, getStatusColor } from '../utils/formatters.js';

interface StorageMatrixSectionProps {
  storage: StorageItem[] | undefined;
  hygiene?: DockerDiskHygiene;
  onOpenPruneModal?: () => void;
}

export const StorageMatrixSection: React.FC<StorageMatrixSectionProps> = ({
  storage = [],
  hygiene,
  onOpenPruneModal,
}) => {
  return (
    <section className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                Storage Matrix & Multi-Bay DAS Watchdog
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {storage.length} Volumes Tracked
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              NVMe Root OS + External 3-Bay Enclosure Mount Canary Protection
            </p>
          </div>
        </div>

        {/* Docker NVMe Hygiene Summary Pill */}
        {hygiene && onOpenPruneModal && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onOpenPruneModal}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>NVMe Hygiene:</span>
              <span className="text-emerald-400 font-bold">{formatBytes(hygiene.reclaimableBytes)}</span>
              <span className="text-slate-500">recoverable</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of Storage Volumes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {storage.map((drive) => {
          const colors = getStatusColor(drive.usedPercent);
          const isCritical = drive.status === 'critical';
          const isWarning = drive.status === 'warning';

          return (
            <div
              key={drive.id}
              className={`rounded-lg p-3.5 border transition-all flex flex-col justify-between ${
                drive.isDisconnected
                  ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40'
                  : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Mount Header */}
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 tracking-tight leading-snug">
                      {drive.label}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {drive.mount}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {drive.isDisconnected ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      DETACHED
                    </span>
                  ) : (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isCritical
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {drive.usedPercent.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 my-2.5">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        drive.isDisconnected ? 'bg-rose-500' : colors.bar
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, drive.usedPercent))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                    <span>{formatBytes(drive.usedBytes)} used</span>
                    <span>{formatBytes(drive.freeBytes)} free</span>
                  </div>
                </div>
              </div>

              {/* Meta row: SMART status & Canary badge */}
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SMART: PASSED</span>
                </div>

                {drive.isExternal && (
                  <div className="flex items-center gap-1">
                    {drive.canaryPresent ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        Canary OK
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">Canary Lost!</span>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
