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
    <div className="rounded-panel border border-state-bad/40 bg-state-bad/[0.07] px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-state-bad/15 text-state-bad">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <div>
          <h3 className="flex items-center gap-2 text-[13.5px] font-bold text-state-bad">
            External DAS mount disconnected
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-state-bad" />
          </h3>
          <p className="mt-1 max-w-[80ch] text-[12.5px] leading-relaxed text-cockpit-muted">
            The <code className="font-mono text-cockpit-text">.mounted</code> canary file is missing. Containers writing
            to these paths will fill the internal NVMe instead. Stop those containers or remount the enclosure.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {disconnectedDrives.map((drive) => (
              <span
                key={drive.id}
                className="rounded-md border border-state-bad/30 px-2 py-1 font-mono text-[11px] text-state-bad"
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
