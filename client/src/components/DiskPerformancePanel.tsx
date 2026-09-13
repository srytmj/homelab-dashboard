import React, { useEffect, useState } from 'react';
import { StorageItem } from '../types.js';
import { formatBytes, formatNetworkRate } from '../utils/formatters.js';
import { DiskActivityGraph } from './DiskActivityGraph.js';

interface DiskPerformancePanelProps {
  storage: StorageItem[] | undefined;
}

export const DiskPerformancePanel: React.FC<DiskPerformancePanelProps> = ({ storage = [] }) => {
  const withPerf = storage.filter((s) => s.activeTimePercent !== undefined);
  const [selectedId, setSelectedId] = useState<string | null>(withPerf[0]?.id ?? null);

  useEffect(() => {
    if (!selectedId && withPerf.length > 0) {
      setSelectedId(withPerf[0].id);
      return;
    }
    if (selectedId && !withPerf.some((s) => s.id === selectedId) && withPerf.length > 0) {
      setSelectedId(withPerf[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withPerf.length]);

  return (
    <section className="panel flex flex-col">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Disk performance</h2>
          <p className="panel-sub">Live throughput and active time per volume</p>
        </div>
      </div>

      {withPerf.length === 0 ? (
        <p className="text-sm text-cockpit-text-dim py-6">
          Performance data is not available. This reads /proc/diskstats, which only exists on a Linux host.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 border-b border-cockpit-border/50 pb-2 mb-4">
            {withPerf.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  selectedId === item.id
                    ? 'bg-cockpit-accent/10 text-cockpit-accent'
                    : 'text-cockpit-text-dim hover:text-cockpit-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {(() => {
            const selected = withPerf.find((s) => s.id === selectedId) ?? withPerf[0];
            return (
              <div className="flex flex-col gap-4">
                <DiskActivityGraph data={selected.sparklineActiveTime ?? []} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-cockpit-text-dim">Active time</p>
                    <p className="text-lg font-medium tabular-nums text-cockpit-text">
                      {(selected.activeTimePercent ?? 0).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cockpit-text-dim">Avg response time</p>
                    <p className="text-lg font-medium tabular-nums text-cockpit-text">
                      {(selected.avgResponseMs ?? 0).toFixed(1)} ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cockpit-text-dim">Read speed</p>
                    <p className="text-lg font-medium tabular-nums text-cockpit-text">
                      {formatNetworkRate(selected.readRateBytesPerSec ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cockpit-text-dim">Write speed</p>
                    <p className="text-lg font-medium tabular-nums text-cockpit-text">
                      {formatNetworkRate(selected.writeRateBytesPerSec ?? 0)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-cockpit-text-dim">
                  {selected.mount} &middot; {formatBytes(selected.usedBytes)} used of {formatBytes(selected.totalBytes)}
                </p>
              </div>
            );
          })()}
        </>
      )}
    </section>
  );
};
