import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { StorageItem } from '../types.js';

interface DasWatchdogAlertProps {
  storage: StorageItem[] | undefined;
}

export const DasWatchdogAlert: React.FC<DasWatchdogAlertProps> = ({ storage = [] }) => {
  const disconnectedDrives = storage.filter((s) => s.isExternal && (s.isDisconnected || s.canaryPresent === false));

  if (disconnectedDrives.length === 0) {
    return null;
  }

  return (
    <div className="border-2 border-state-bad bg-state-bad/10 px-5 py-4 shadow-[4px_4px_0_rgba(var(--state-bad)/0.4)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-state-bad bg-state-bad/20 text-state-bad">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <div>
          <h3 className="flex items-center gap-2 text-[13.5px] font-bold uppercase tracking-wide text-state-bad">
            External DAS mount disconnected
            <span className="h-2 w-2 animate-pulse bg-state-bad inline-block" />
          </h3>
          <p className="mt-1 max-w-[80ch] text-[12.5px] leading-relaxed text-cockpit-muted">
            The <code className="font-mono text-cockpit-text font-bold">.mounted</code> canary file is missing. Containers writing
            to these paths will fill the internal NVMe instead. Stop those containers or remount the enclosure.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {disconnectedDrives.map((drive) => (
              <span
                key={drive.id}
                className="border border-state-bad/60 px-2 py-1 font-mono text-[11px] font-bold text-state-bad bg-state-bad/10"
              >
                {drive.mount} · {drive.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
