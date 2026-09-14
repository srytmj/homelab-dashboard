import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { redactText, formatBytes } from '../utils/formatters.js';
import { HostSummaryTiles } from '../components/HostSummaryTiles.js';
import { AppUpdateBanner } from '../components/AppUpdateBanner.js';
import { BookmarksSection } from '../components/BookmarksSection.js';

interface HomePageProps {
  snapshot: CockpitSnapshot | null;
  throughput: { rx: number; tx: number };
  isPrivacyMode: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ snapshot, throughput, isPrivacyMode }) => {
  const runningCount = snapshot?.containers.filter((c) => c.state === 'running').length ?? 0;
  const totalCount = snapshot?.containers.length ?? 0;
  const pinnedCount = snapshot?.containers.filter((c) => c.isPinned).length ?? 0;
  const pve = snapshot?.host.pve;
  const dockerHost = snapshot?.host.dockerHost;
  const physicalDrive = snapshot?.storage.find((s) => s.isPhysicalRoot);

  return (
    <div className="space-y-4 animate-fade-in-up">

      <div className="flex items-center justify-between rounded-panel border border-blue-500/30 bg-blue-500/10 px-5 py-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-blue-400">Try the new Dashboard Experience</h2>
          <p className="mt-1 text-[12.5px] text-cockpit-muted">We're redesigning the UI! Toggle to the Beta view to check out our progress while the legacy UI is still available.</p>
        </div>
        <Link to="/beta" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Switch to Beta UI
        </Link>
      </div>

      <section className="panel px-5 py-4">
        <p className="label">This machine</p>
        <h1 className="mt-1 text-[19px] font-extrabold tracking-tight text-cockpit-text">
          {pve?.nodeName || 'Homelab node'}
        </h1>
        <p className="mt-1 font-mono text-[12px] text-cockpit-muted">
          {pve ? `${pve.cpuModel || `${pve.cpuCores} cores`} · ${formatBytes(dockerHost?.ramTotalBytes ?? 0)} RAM · ` : ''}
          Proxmox VE {redactText(pve?.ip || '—', isPrivacyMode)} · Docker {dockerHost?.hostname || 'host'}{' '}
          {redactText(dockerHost?.ip || '—', isPrivacyMode)}
        </p>
      </section>

      <HostSummaryTiles host={snapshot?.host} throughput={throughput} />

      <AppUpdateBanner />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/fleet" className="panel flex items-center justify-between px-5 py-4 transition-colors hover:bg-cockpit-panelHover">
          <div>
            <p className="label">Container fleet</p>
            <p className="metric-lg mt-1">
              {runningCount}
              <span className="metric-unit">of {totalCount} running</span>
            </p>
            {pinnedCount > 0 && (
              <p className="mt-1 text-[11.5px] text-cockpit-muted">{pinnedCount} pinned to the command palette</p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-cockpit-muted" />
        </Link>

        <Link to="/infra" className="panel flex items-center justify-between px-5 py-4 transition-colors hover:bg-cockpit-panelHover">
          <div>
            <p className="label">Infrastructure</p>
            <p className="metric-lg mt-1">
              {physicalDrive ? formatBytes(physicalDrive.totalBytes) : (snapshot?.storage.length ?? 0)}
              <span className="metric-unit">{physicalDrive ? 'Physical SSD' : 'volumes tracked'}</span>
            </p>
            <p className="mt-1 text-[11.5px] text-cockpit-muted">
              {physicalDrive
                ? `${formatBytes(physicalDrive.freeBytes)} free (${(100 - physicalDrive.usedPercent).toFixed(0)}%) · ${snapshot?.storage.length ?? 0} volumes`
                : 'Storage, Tailscale mesh, SSL certificates'}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-cockpit-muted" />
        </Link>
      </div>

      <BookmarksSection />
    </div>
  );
};
