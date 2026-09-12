import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { redactText } from '../utils/formatters.js';
import { HostSummaryTiles } from '../components/HostSummaryTiles.js';

interface HomePageProps {
  snapshot: CockpitSnapshot | null;
  throughput: { rx: number; tx: number };
  isPrivacyMode: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ snapshot, throughput, isPrivacyMode }) => {
  const runningCount = snapshot?.containers.filter((c) => c.state === 'running').length ?? 0;
  const totalCount = snapshot?.containers.length ?? 0;
  const pinnedCount = snapshot?.containers.filter((c) => c.isPinned).length ?? 0;

  return (
    <div className="space-y-4">
      <section className="panel px-5 py-4">
        <p className="label">This machine</p>
        <h1 className="mt-1 text-[19px] font-extrabold tracking-tight text-cockpit-text">
          Lenovo ThinkCentre M710q Tiny
        </h1>
        <p className="mt-1 font-mono text-[12px] text-cockpit-muted">
          Intel i5-7500 · 4C/4T · 32GB RAM · Proxmox VE {redactText('192.168.18.224', isPrivacyMode)} · Docker LXC{' '}
          {redactText('192.168.18.225', isPrivacyMode)}
        </p>
      </section>

      <HostSummaryTiles host={snapshot?.host} throughput={throughput} />

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
              {snapshot?.storage.length ?? 0}
              <span className="metric-unit">volumes tracked</span>
            </p>
            <p className="mt-1 text-[11.5px] text-cockpit-muted">Storage, Tailscale mesh, SSL certificates</p>
          </div>
          <ArrowRight className="h-4 w-4 text-cockpit-muted" />
        </Link>
      </div>
    </div>
  );
};
