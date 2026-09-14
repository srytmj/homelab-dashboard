import React from 'react';
import { Sparkles, HardDrive, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';
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
  const rootDrive = storage.find((s) => s.isPhysicalRoot || s.mount.includes('/') || s.mount === '/');
  const hasPhysicalRoot = Boolean(rootDrive?.isPhysicalRoot && rootDrive.allocations?.length);

  return (
    <section className="panel flex flex-col">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Storage &amp; DAS watchdog</h2>
          <p className="panel-sub">
            {hasPhysicalRoot
              ? 'Proxmox Physical SSD (256 GB) + external DAS bays'
              : 'Root filesystem + external DAS bays'}
          </p>
        </div>
        <span className={`pill ${detached > 0 ? 'pill-bad' : 'pill-neutral'}`}>
          {detached > 0 ? `${detached} detached` : `${storage.length} volumes`}
        </span>
      </div>

      <div className="flex-1 px-5 py-2">
        {storage.map((drive) => {
          const tone = getStatusColor(drive.usedPercent);
          const isDetached = drive.isDisconnected;

          // Tiered Display for Physical Root SSD (256 GB)
          if (drive.isPhysicalRoot && drive.allocations && drive.allocations.length > 0) {
            const freePercent = Math.max(0, 100 - drive.usedPercent);
            const smartStatus = drive.smartStatus || 'PASSED';
            const diskModel = drive.physicalDisk?.model || 'MidasForce SSD 256GB';
            const diskDevice = drive.physicalDisk?.devpath || '/dev/sda';

            return (
              <div key={drive.id} className="border-b border-cockpit-border py-4 last:border-b-0">
                {/* TIER 1: Main Physical Drive Capacity & Combined Health */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cockpit-accent/15 text-cockpit-accent">
                      <HardDrive className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-bold text-cockpit-text">{drive.label}</span>
                        <span className="rounded bg-cockpit-panelHover px-1.5 py-0.5 font-mono text-[10px] text-cockpit-muted">
                          {diskModel} · {diskDevice}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-cockpit-muted">
                        Proxmox VE Hypervisor Storage Pool · LVM-Thin Provisioned
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="pill pill-good">
                      <ShieldCheck className="h-3 w-3" />
                      SMART {smartStatus}
                    </span>
                    <span className={`metric text-[14px] ${tone.text}`}>{drive.usedPercent.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Main Physical SSD Progress Bar */}
                <div className="track mt-3 h-2.5 bg-cockpit-border/40">
                  <span
                    className={`track-fill ${tone.bar}`}
                    style={{ width: `${Math.min(100, Math.max(2, drive.usedPercent))}%` }}
                  />
                </div>

                {/* Main Physical Stats */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 font-mono text-[11px] tabular-nums text-cockpit-muted">
                  <span className="text-cockpit-text">
                    <strong className="text-cockpit-text">{formatBytes(drive.totalBytes)}</strong> total ·{' '}
                    <span className="text-state-warn">{formatBytes(drive.usedBytes)} used</span> ·{' '}
                    <span className="text-state-good">{formatBytes(drive.freeBytes)} free</span>
                  </span>
                  <span className="text-state-good">{freePercent.toFixed(1)}% actual free space</span>
                </div>

                {/* TIER 2: Allocation Breakdown & Workload Sub-bars */}
                <div className="mt-3.5 rounded-lg border border-cockpit-border/70 bg-cockpit-bg/50 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cockpit-muted">
                      <Layers className="h-3.5 w-3.5 text-cockpit-accent" />
                      Storage Allocations &amp; Container Workloads
                    </span>
                    <span className="font-mono text-[10.5px] text-cockpit-muted">
                      Pools: <span className="text-cockpit-text">local</span> (dir) ·{' '}
                      <span className="text-cockpit-text">local-lvm</span> (thin ~157 GB)
                    </span>
                  </div>

                  {/* Proportional distribution segmented bar */}
                  <div className="my-2 flex h-2 w-full overflow-hidden rounded-full bg-cockpit-border/30 p-0.5">
                    {drive.allocations.map((alloc, idx) => {
                      const colors = [
                        'bg-sky-400', // PVE Host
                        'bg-cockpit-accent', // LXC 100 docker-host
                        'bg-purple-400', // LXC 101 apps-host
                      ];
                      const widthPercent = (alloc.allocatedBytes / drive.totalBytes) * 100;
                      return (
                        <div
                          key={alloc.id}
                          className={`h-full ${colors[idx % colors.length]} transition-all duration-300 first:rounded-l-full`}
                          style={{ width: `${Math.max(1, widthPercent)}%` }}
                          title={`${alloc.name}: ${formatBytes(alloc.allocatedBytes)} allocated`}
                        />
                      );
                    })}
                    <div
                      className="h-full bg-cockpit-border/50 rounded-r-full"
                      style={{
                        width: `${Math.max(0, 100 - drive.allocations.reduce((acc, a) => acc + (a.allocatedBytes / drive.totalBytes) * 100, 0))}%`,
                      }}
                      title="Unallocated / Headroom"
                    />
                  </div>

                  {/* Sub-bars list */}
                  <div className="space-y-2.5 pt-1">
                    {drive.allocations.map((alloc, idx) => {
                      const allocTone = getStatusColor(alloc.usedPercent);
                      const barColor =
                        idx === 0
                          ? 'bg-sky-400'
                          : idx === 1
                          ? 'bg-cockpit-accent'
                          : 'bg-purple-400';

                      return (
                        <div key={alloc.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11.5px]">
                            <span className="flex items-center gap-1.5 font-medium text-cockpit-text">
                              <span className={`h-2 w-2 rounded-full ${barColor}`} />
                              {alloc.name}
                            </span>
                            <span className="font-mono text-[11px] tabular-nums text-cockpit-muted">
                              <strong className="text-cockpit-text">{formatBytes(alloc.usedBytes)}</strong> used /{' '}
                              {formatBytes(alloc.allocatedBytes)} allocated{' '}
                              <span className={`ml-1 font-bold ${allocTone.text}`}>
                                ({alloc.usedPercent.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                          <div className="track h-1.5 bg-cockpit-border/40">
                            <span
                              className={`track-fill ${barColor}`}
                              style={{ width: `${Math.min(100, Math.max(2, alloc.usedPercent))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          // Fallback UI when Proxmox API is unreachable
          if (drive.unreachableHostFallback) {
            return (
              <div key={drive.id} className="border-b border-cockpit-border py-3.5 last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-cockpit-text">{drive.label}</span>
                    <span className="pill pill-warn">
                      <AlertTriangle className="h-3 w-3" />
                      LXC Virtual Disk Fallback
                    </span>
                  </div>
                  <span className={`metric shrink-0 text-[12.5px] ${tone.text}`}>{drive.usedPercent.toFixed(1)}%</span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] text-state-warn">
                  Proxmox hypervisor API unreachable. Showing container virtual root statvfs (~150 GB) instead of physical 256 GB drive.
                </div>

                <div className="track mt-2">
                  <span
                    className={`track-fill ${tone.bar}`}
                    style={{ width: `${Math.min(100, Math.max(3, drive.usedPercent))}%` }}
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 font-mono text-[10.5px] tabular-nums text-cockpit-muted">
                  <span>
                    {drive.mount} · {formatBytes(drive.usedBytes)} used · {formatBytes(drive.freeBytes)} free
                  </span>
                  <span>virtual root</span>
                </div>
              </div>
            );
          }

          // Standard External DAS Mounts & Drives
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
