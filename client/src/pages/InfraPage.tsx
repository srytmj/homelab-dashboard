import React from 'react';
import { CockpitSnapshot } from '../types.js';
import { HostDetailPanels } from '../components/HostDetailPanels.js';
import { StorageMatrixSection } from '../components/StorageMatrixSection.js';
import { TailscaleMatrixSection } from '../components/TailscaleMatrixSection.js';
import { SslTrackerSection } from '../components/SslTrackerSection.js';

interface InfraPageProps {
  snapshot: CockpitSnapshot | null;
  isPrivacyMode: boolean;
  onOpenPruneModal: () => void;
}

const DockerHostsPanel: React.FC<{ snapshot: CockpitSnapshot | null }> = ({ snapshot }) => {
  const hosts = snapshot?.dockerHosts ?? [];
  if (hosts.length <= 1) return null;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3 className="panel-title">Docker hosts</h3>
          <p className="panel-sub">Each entry is a separate daemon this dashboard reaches</p>
        </div>
      </div>
      <div className="px-5 py-1.5">
        {hosts.map((host) => (
          <div key={host.name} className="data-row">
            <span className="flex items-center gap-2 text-cockpit-text">
              <span className={`h-1.5 w-1.5 rounded-full ${host.connected ? 'bg-state-good' : 'bg-state-warn'}`} />
              {host.name}
            </span>
            <span className="flex items-center gap-2">
              <span className="pill pill-neutral tabular-nums">{host.containerCount} containers</span>
              <span className={`pill ${host.connected ? 'pill-good' : 'pill-warn'}`}>
                {host.connected ? 'Connected' : 'Simulated'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const InfraPage: React.FC<InfraPageProps> = ({ snapshot, isPrivacyMode, onOpenPruneModal }) => (
  <div className="space-y-4">
    <HostDetailPanels host={snapshot?.host} isPrivacyMode={isPrivacyMode} />

    <DockerHostsPanel snapshot={snapshot} />

    <div className="grid items-start gap-4 lg:grid-cols-3">
      <StorageMatrixSection
        storage={snapshot?.storage}
        hygiene={snapshot?.dockerHygiene}
        onOpenPruneModal={onOpenPruneModal}
      />
      <TailscaleMatrixSection tailscale={snapshot?.tailscale} isPrivacyMode={isPrivacyMode} />
      <SslTrackerSection certificates={snapshot?.sslCertificates} isPrivacyMode={isPrivacyMode} />
    </div>
  </div>
);
