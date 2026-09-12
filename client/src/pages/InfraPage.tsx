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

export const InfraPage: React.FC<InfraPageProps> = ({ snapshot, isPrivacyMode, onOpenPruneModal }) => (
  <div className="space-y-4">
    <HostDetailPanels host={snapshot?.host} isPrivacyMode={isPrivacyMode} />

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
