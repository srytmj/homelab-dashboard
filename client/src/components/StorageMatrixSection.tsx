import React from 'react';
import { Database, HardDrive, Disc, CheckCircle2 } from 'lucide-react';
import { StorageItem } from '../types.js';
import { formatBytes, getStatusColor } from '../utils/formatters.js';

interface StorageMatrixSectionProps {
  storage: StorageItem[] | undefined;
}

export const StorageMatrixSection: React.FC<StorageMatrixSectionProps> = ({ storage = [] }) => {
  const totalStorageBytes = storage.reduce((acc, curr) => acc + curr.totalBytes, 0);
  const totalUsedBytes = storage.reduce((acc, curr) => acc + curr.usedBytes, 0);
  const totalPercent = totalStorageBytes > 0 ? (totalUsedBytes / totalStorageBytes) * 100 : 0;

  return (
    <section className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
              Storage Matrix & External DAS Enclosures
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              NVMe Root OS + 3-Bay External Multi-drive DAS Storage Pools
            </p>
          </div>
        </div>

        {/* Global Storage Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Total Homelab Pool:</span>
          <span className="text-emerald-400 font-bold">{formatBytes(totalUsedBytes)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold">{formatBytes(totalStorageBytes)}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
            {totalPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Grid of Storage Drives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {storage.map((disk) => {
          const statusColors = getStatusColor(disk.usedPercent);

          return (
            <div
              key={disk.id}
              className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {disk.isExternal ? (
                      <Disc className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <HardDrive className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-slate-200 truncate" title={disk.label}>
                      {disk.label.split(':')[0]}
                    </span>
                  </div>

                  {/* SMART Badge */}
                  <div className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>SMART</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-mono truncate mb-2" title={disk.label}>
                  {disk.label.includes(':') ? disk.label.split(':')[1].trim() : disk.label}
                </p>

                {/* Mount info */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2.5">
                  <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-semibold truncate max-w-[130px]">
                    {disk.mount}
                  </span>
                  <span>{disk.filesystem}</span>
                </div>
              </div>

              {/* Progress & Capacity */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Used Capacity</span>
                  <span className={`font-bold ${statusColors.text}`}>
                    {disk.usedPercent.toFixed(1)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${statusColors.bar}`}
                    style={{ width: `${Math.min(100, Math.max(3, disk.usedPercent))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{formatBytes(disk.usedBytes)} used</span>
                  <span className="text-slate-500">{formatBytes(disk.freeBytes)} free</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
