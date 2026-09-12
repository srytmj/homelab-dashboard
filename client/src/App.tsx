import { useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AuthScreen } from './components/AuthScreen.js';
import { useCockpitData } from './hooks/useCockpitData.js';
import { Header } from './components/Header.js';
import { DasWatchdogAlert } from './components/DasWatchdogAlert.js';
import { HostHealthSection } from './components/HostHealthSection.js';
import { TailscaleMatrixSection } from './components/TailscaleMatrixSection.js';
import { StorageMatrixSection } from './components/StorageMatrixSection.js';
import { SslTrackerSection } from './components/SslTrackerSection.js';
import { SentinelWidget } from './components/SentinelWidget.js';
import { ContainerGridSection } from './components/ContainerGridSection.js';
import { LogModal } from './components/LogModal.js';
import { RestartModal } from './components/RestartModal.js';
import { PruneModal } from './components/PruneModal.js';
import { CommandDeckModal } from './components/CommandDeckModal.js';
import { ContainerMetric } from './types.js';

function CockpitDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { snapshot, isConnected, lastUpdated, refetch } = useCockpitData();

  const [activeLogContainer, setActiveLogContainer] = useState<ContainerMetric | null>(null);
  const [activeRestartContainer, setActiveRestartContainer] = useState<ContainerMetric | null>(null);
  const [isPruneModalOpen, setIsPruneModalOpen] = useState(false);
  const [isCommandDeckOpen, setIsCommandDeckOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const throughput = useMemo(() => {
    const containers = snapshot?.containers || [];
    return {
      rx: containers.reduce((sum, c) => sum + c.networkRxRateBytesPerSec, 0),
      tx: containers.reduce((sum, c) => sum + c.networkTxRateBytesPerSec, 0),
    };
  }, [snapshot]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cockpit-bg">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-cockpit-accent border-t-transparent" />
        <span className="label">Checking session</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-cockpit-bg text-cockpit-text">
      <Header
        snapshot={snapshot}
        isConnected={isConnected}
        lastUpdated={lastUpdated}
        isPrivacyMode={isPrivacyMode}
        isFullscreen={isFullscreen}
        onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        onToggleFullscreen={toggleFullscreen}
        onOpenCommandDeck={() => setIsCommandDeckOpen(true)}
        onRefresh={refetch}
      />

      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-5 py-7 lg:px-8">
        <DasWatchdogAlert storage={snapshot?.storage} />

        {snapshot?.host.pve && !snapshot.host.pve.connected && (
          <p className="rounded-panel border border-cockpit-border bg-cockpit-panel px-5 py-3.5 text-[12.5px] leading-relaxed text-cockpit-muted">
            <span className="font-semibold text-cockpit-text">Proxmox API not connected.</span> Set{' '}
            <code className="font-mono text-cockpit-accent">PROXMOX_TOKEN_ID</code> and{' '}
            <code className="font-mono text-cockpit-accent">PROXMOX_TOKEN_SECRET</code> in{' '}
            <code className="font-mono text-cockpit-accent">.env</code> to stream real hardware sensors and vzdump
            history from the PVE node. Showing simulated telemetry until then.
          </p>
        )}

        <section id="overview" className="scroll-mt-32">
          <HostHealthSection host={snapshot?.host} throughput={throughput} isPrivacyMode={isPrivacyMode} />
        </section>

        <section id="fleet" className="scroll-mt-32">
          <ContainerGridSection
            containers={snapshot?.containers}
            isPrivacyMode={isPrivacyMode}
            onViewLogs={(c) => setActiveLogContainer(c)}
            onRestartContainer={(c) => setActiveRestartContainer(c)}
          />
        </section>

        <section id="infra" className="grid scroll-mt-32 items-start gap-4 lg:grid-cols-3">
          <StorageMatrixSection
            storage={snapshot?.storage}
            hygiene={snapshot?.dockerHygiene}
            onOpenPruneModal={() => setIsPruneModalOpen(true)}
          />
          <TailscaleMatrixSection tailscale={snapshot?.tailscale} isPrivacyMode={isPrivacyMode} />
          <SslTrackerSection certificates={snapshot?.sslCertificates} isPrivacyMode={isPrivacyMode} />
        </section>

        <section id="sentinel" className="scroll-mt-32">
          <SentinelWidget sentinel={snapshot?.sentinel} />
        </section>
      </main>

      {isCommandDeckOpen && (
        <CommandDeckModal
          consoles={snapshot?.consoles}
          isPrivacyMode={isPrivacyMode}
          onClose={() => setIsCommandDeckOpen(false)}
        />
      )}

      {activeLogContainer && (
        <LogModal container={activeLogContainer} onClose={() => setActiveLogContainer(null)} />
      )}

      {activeRestartContainer && (
        <RestartModal
          container={activeRestartContainer}
          onClose={() => setActiveRestartContainer(null)}
          onSuccess={() => refetch()}
        />
      )}

      {isPruneModalOpen && (
        <PruneModal
          hygiene={snapshot?.dockerHygiene}
          onClose={() => setIsPruneModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      <footer className="border-t border-cockpit-border bg-cockpit-topbar px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 font-mono text-[11px] text-cockpit-muted sm:flex-row">
          <span>Homelab Cockpit · Lenovo ThinkCentre M710q Tiny</span>
          <span>Polling every 2s over WebSocket</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <CockpitDashboard />
    </AuthProvider>
  );
}

export default App;
