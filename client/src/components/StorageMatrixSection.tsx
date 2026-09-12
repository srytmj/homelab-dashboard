import React from 'react';
import { Sparkles } from 'lucide-react';
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
  const detached = storage.filter((s) => s.isDisconnected || s.canaryPresent === false).length;

  return (
    <section className="panel flex flex-col">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Storage &amp; DAS watchdog</h2>
          <p className="panel-sub">NVMe root + external bays</p>
        </div>
        <span className={`pill ${detached > 0 ? 'pill-bad' : 'pill-neutral'}`}>
          {detached > 0 ? `${detached} detached` : `${storage.length} volumes`}
        </span>
      </div>

      <div className="flex-1 px-5 py-1">
        {storage.map((drive) => {
          const tone = getStatusColor(drive.usedPercent);
          const isDetached = drive.isDisconnected;

          return (
            <div key={drive.id} className="border-b border-cockpit-border py-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-cockpit-text">{drive.label}</span>
                {isDetached ? (
                  <span className="pill pill-bad shrink-0">Detached</span>
                ) : (
                  <span className={`metric shrink-0 text-[12.5px] ${tone.text}`}>{drive.usedPercent.toFixed(1)}%</span>
                )}
              </div>

              <div className="track mt-2">
                <span
                  className={`track-fill ${isDetached ? 'bg-state-bad' : tone.bar}`}
                  style={{ width: `${Math.min(100, Math.max(3, drive.usedPercent))}%` }}
                />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 font-mono text-[10.5px] tabular-nums text-cockpit-muted">
                <span>
                  {drive.mount} · {formatBytes(drive.usedBytes)} used · {formatBytes(drive.freeBytes)} free
                </span>
                <span className={drive.isExternal && !drive.canaryPresent ? 'text-state-bad' : ''}>
                  {drive.isExternal
                    ? drive.canaryPresent
                      ? 'canary ok'
                      : 'canary lost'
                    : `smart ${(drive.smartStatus || 'passed').toLowerCase()}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {hygiene && onOpenPruneModal && (
        <button
          onClick={onOpenPruneModal}
          className="group flex items-center justify-between gap-2 border-t border-cockpit-border px-5 py-3 text-[12.5px] transition-colors duration-150 hover:bg-cockpit-panelHover"
        >
          <span className="inline-flex items-center gap-2 text-cockpit-muted">
            <Sparkles className="h-3.5 w-3.5 text-cockpit-accent" />
            Docker image cache
          </span>
          <span className="metric text-[12.5px] text-cockpit-accent">
            {formatBytes(hygiene.reclaimableBytes)} reclaimable
          </span>
        </button>
      )}
    </section>
  );
};
