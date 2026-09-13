import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AuthScreen } from './components/AuthScreen.js';
import { useCockpitData } from './hooks/useCockpitData.js';
import { useTheme } from './hooks/useTheme.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { DasWatchdogAlert } from './components/DasWatchdogAlert.js';
import { CommandPalette } from './components/CommandPalette.js';
import { LogModal } from './components/LogModal.js';
import { RestartModal } from './components/RestartModal.js';
import { PruneModal } from './components/PruneModal.js';
import { PinDomainModal } from './components/PinDomainModal.js';
import { HomePage } from './pages/HomePage.js';
import { FleetPage } from './pages/FleetPage.js';
import { InfraPage } from './pages/InfraPage.js';
import { SentinelPage } from './pages/SentinelPage.js';
import { GitProjectsPage } from './pages/GitProjectsPage.js';
import { ProcessesPage } from './pages/ProcessesPage.js';
import { AiAgentsPage } from './pages/AiAgentsPage.js';
// Lazy-loaded: xterm.js is heavy and only needed by owners who use SSH.
const TerminalPage = lazy(() => import('./pages/TerminalPage.js').then((m) => ({ default: m.TerminalPage })));
import { ContainerMetric } from './types.js';

function CockpitDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { snapshot, isConnected, lastUpdated, refetch } = useCockpitData();
  const { theme, toggleTheme } = useTheme();

  const [activeLogContainer, setActiveLogContainer] = useState<ContainerMetric | null>(null);
  const [activeRestartContainer, setActiveRestartContainer] = useState<ContainerMetric | null>(null);
  const [activePinContainer, setActivePinContainer] = useState<ContainerMetric | null>(null);
  const [isPruneModalOpen, setIsPruneModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const throughput = useMemo(() => {
    const containers = snapshot?.containers || [];
    return {
      rx: containers.reduce((sum, c) => sum + c.networkRxRateBytesPerSec, 0),
      tx: containers.reduce((sum, c) => sum + c.networkTxRateBytesPerSec, 0),
    };
  }, [snapshot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        theme={theme}
        onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        onToggleFullscreen={toggleFullscreen}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onRefresh={refetch}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-start gap-4">
        <Sidebar />

        <main className="w-full min-w-0 flex-1 space-y-6 px-5 py-7 lg:px-8">
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

          <Routes>
            <Route path="/" element={<HomePage snapshot={snapshot} throughput={throughput} isPrivacyMode={isPrivacyMode} />} />
            <Route
              path="/fleet"
              element={
                <FleetPage
                  containers={snapshot?.containers}
                  isPrivacyMode={isPrivacyMode}
                  onViewLogs={(c) => setActiveLogContainer(c)}
                  onRestartContainer={(c) => setActiveRestartContainer(c)}
                  onPinContainer={(c) => setActivePinContainer(c)}
                />
              }
            />
            <Route
              path="/infra"
              element={
                <InfraPage snapshot={snapshot} isPrivacyMode={isPrivacyMode} onOpenPruneModal={() => setIsPruneModalOpen(true)} />
              }
            />
            <Route path="/processes" element={<ProcessesPage />} />
            <Route path="/sentinel" element={<SentinelPage sentinel={snapshot?.sentinel} />} />
            <Route path="/ai-agents" element={<AiAgentsPage />} />
            <Route path="/git-projects" element={<GitProjectsPage snapshot={snapshot} onRefetch={refetch} />} />
            <Route
              path="/terminal"
              element={
                <Suspense fallback={<p className="label">Loading terminal…</p>}>
                  <TerminalPage />
                </Suspense>
              }
            />
          </Routes>
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        containers={snapshot?.containers}
        isPrivacyMode={isPrivacyMode}
      />

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

      {activePinContainer && (
        <PinDomainModal
          container={activePinContainer}
          onClose={() => setActivePinContainer(null)}
          onSaved={() => refetch()}
        />
      )}

      {isPruneModalOpen && (
        <PruneModal
          hygiene={snapshot?.dockerHygiene}
          onClose={() => setIsPruneModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      <footer className="border-t border-cockpit-border bg-cockpit-topbar/80 backdrop-blur-xl px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2.5 font-mono text-[11px] text-cockpit-muted sm:flex-row">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-cockpit-text">Homelab Cockpit</span>
            <span className="rounded bg-cockpit-border/60 px-1.5 py-0.5 text-[10.5px] font-medium text-cockpit-accent">
              v{snapshot?.appVersion?.version || '1.1.0'}
              {snapshot?.appVersion?.commitSha && snapshot.appVersion.commitSha !== 'unknown'
                ? ` (${snapshot.appVersion.commitSha.slice(0, 7)})`
                : ''}
            </span>
            {snapshot?.host.pve.nodeName && (
              <span>· {snapshot.host.pve.nodeName}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-cockpit-muted">
            <span>
              Branch: <span className="text-cockpit-text">{snapshot?.appVersion?.branch || 'main'}</span>
            </span>
            <span>·</span>
            <span>Polling every 2s over WebSocket</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CockpitDashboard />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
