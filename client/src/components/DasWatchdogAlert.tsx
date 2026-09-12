import { AlertTriangle } from 'lucide-react';
import { StorageItem } from '../types.js';

interface DasWatchdogAlertProps {
  storage: StorageItem[] | undefined;
}

export const DasWatchdogAlert: React.FC<DasWatchdogAlertProps> = ({ storage = [] }) => {
  const disconnectedDrives = storage.filter(s => s.isExternal && (s.isDisconnected || s.canaryPresent === false));

  if (disconnectedDrives.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-rose-950/80 border-2 border-rose-500/80 p-4 shadow-xl shadow-rose-950/50 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-200 flex items-center gap-2">
            <span>CRITICAL: DAS External Mount Disconnect Detected!</span>
            <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-mono">
              NVMe Root Spillover Risk
            </span>
          </h3>
          <p className="text-xs font-mono text-rose-300">
            One or more external USB-DAS mount points have detached or lost the <code>.mounted</code> canary. Containers writing to these paths may rapidly fill the internal NVMe SSD!
          </p>
          <div className="mt-2 flex flex-wrap gap-2 pt-1">
            {disconnectedDrives.map(drive => (
              <span
                key={drive.id}
                className="px-2.5 py-1 rounded bg-slate-900 border border-rose-500/60 text-xs font-mono font-bold text-rose-300"
              >
                {drive.mount} ({drive.label}) — DISCONNECTED
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
