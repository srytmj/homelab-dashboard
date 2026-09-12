import { useState } from 'react';
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
import { Info } from 'lucide-react';

function CockpitDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { snapshot, isConnected, lastUpdated, refetch } = useCockpitData();

  const [activeLogContainer, setActiveLogContainer] = useState<ContainerMetric | null>(null);
  const [activeRestartContainer, setActiveRestartContainer] = useState<ContainerMetric | null>(null);
  const [isPruneModalOpen, setIsPruneModalOpen] = useState(false);
  const [isCommandDeckOpen, setIsCommandDeckOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center font-mono text-xs text-slate-500 gap-2">
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span>Initializing Homelab Cockpit security...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-[#F8FAFC] flex flex-col font-sans">
      {/* Header */}
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

      {/* Main Cockpit Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-5 space-y-5">
        
        {/* DAS Canary Alert (Pulsing Red if any DAS mount has disconnected) */}
        <DasWatchdogAlert storage={snapshot?.storage} />

        {/* Notice for Proxmox API Token setup if demo or unconfigured */}
        {snapshot?.host.pve && !snapshot.host.pve.connected && (
          <div className="rounded bg-indigo-950/40 border border-indigo-500/30 p-3 flex items-start gap-2.5 text-xs font-mono">
            <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div className="text-slate-300">
              <span className="font-bold text-indigo-300">Proxmox VE API Integration:</span> Set your{' '}
              <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">PROXMOX_TOKEN_ID</code> &{' '}
              <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">PROXMOX_TOKEN_SECRET</code> in{' '}
              <code className="text-amber-400">.env</code> to stream live hardware sensors & vzdump backups from your Lenovo M710q Tiny PVE node (192.168.18.224). Displaying high-fidelity simulated telemetry.
            </div>
          </div>
        )}

        {/* 1. Real-time Node, Hardware & Proxmox Backup Vitals */}
        <HostHealthSection
          host={snapshot?.host}
          isPrivacyMode={isPrivacyMode}
        />

        {/* 2. Tailscale Mesh Network & Peer Tracking */}
        <TailscaleMatrixSection
          tailscale={snapshot?.tailscale}
          isPrivacyMode={isPrivacyMode}
        />

        {/* 3. Storage Matrix & Docker NVMe Hygiene */}
        <StorageMatrixSection
          storage={snapshot?.storage}
          hygiene={snapshot?.dockerHygiene}
          onOpenPruneModal={() => setIsPruneModalOpen(true)}
        />

        {/* 4. SSL Certificate & Domain Expiry Tracker (NPM Companion) */}
        <SslTrackerSection
          certificates={snapshot?.sslCertificates}
          isPrivacyMode={isPrivacyMode}
        />

        {/* 5. Homelab Sentinel (Telegram & Gemini AI Companion) */}
        <SentinelWidget sentinel={snapshot?.sentinel} />

        {/* 6. Container Fleet & Explicit Tailscale vs LAN Route */}
        <ContainerGridSection
          containers={snapshot?.containers}
          isPrivacyMode={isPrivacyMode}
          onViewLogs={(c) => setActiveLogContainer(c)}
          onRestartContainer={(c) => setActiveRestartContainer(c)}
        />
      </main>

      {/* Modals */}
      {isCommandDeckOpen && (
        <CommandDeckModal
          consoles={snapshot?.consoles}
          isPrivacyMode={isPrivacyMode}
          onClose={() => setIsCommandDeckOpen(false)}
        />
      )}

      {activeLogContainer && (
        <LogModal
          container={activeLogContainer}
          onClose={() => setActiveLogContainer(null)}
        />
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#090d16] py-3.5 px-4 text-center text-[11px] font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span className="text-slate-400 font-semibold">Homelab Cockpit</span>
            <span>— Lenovo ThinkCentre M710q Tiny</span>
          </div>
          <div>
            <span>1x Owner Auth Guard • Tailscale Mesh Tracking • Zero AI Slop</span>
          </div>
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
