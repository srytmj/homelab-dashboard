import { useState } from 'react';
import { useCockpitData } from './hooks/useCockpitData.js';
import { Header } from './components/Header.js';
import { HostHealthSection } from './components/HostHealthSection.js';
import { StorageMatrixSection } from './components/StorageMatrixSection.js';
import { ContainerGridSection } from './components/ContainerGridSection.js';
import { LogModal } from './components/LogModal.js';
import { RestartModal } from './components/RestartModal.js';
import { ContainerMetric } from './types.js';
import { Info } from 'lucide-react';

export function App() {
  const { snapshot, isConnected, lastUpdated, refetch } = useCockpitData();

  const [activeLogContainer, setActiveLogContainer] = useState<ContainerMetric | null>(null);
  const [activeRestartContainer, setActiveRestartContainer] = useState<ContainerMetric | null>(null);

  return (
    <div className="min-h-screen bg-[#070b14] text-[#F8FAFC] flex flex-col font-sans">
      {/* Header */}
      <Header
        snapshot={snapshot}
        isConnected={isConnected}
        lastUpdated={lastUpdated}
        onRefresh={refetch}
      />

      {/* Main Cockpit Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Notice for Proxmox API Token setup if demo or unconfigured */}
        {snapshot?.host.pve && !snapshot.host.pve.connected && (
          <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/30 p-3.5 flex items-start gap-3 text-xs font-mono">
            <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-slate-300">
              <span className="font-bold text-indigo-300">Proxmox VE API Integration:</span> Set your{' '}
              <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">PROXMOX_TOKEN_ID</code> &{' '}
              <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">PROXMOX_TOKEN_SECRET</code> in{' '}
              <code className="text-amber-400">.env</code> to stream live hardware sensors from your Lenovo M710q Tiny PVE node (192.168.18.224). Displaying high-fidelity simulated telemetry.
            </div>
          </div>
        )}

        {/* 1. Real-time Node & Hardware Health */}
        <HostHealthSection host={snapshot?.host} />

        {/* 2. Storage Matrix */}
        <StorageMatrixSection storage={snapshot?.storage} />

        {/* 3. Container Live Grid */}
        <ContainerGridSection
          containers={snapshot?.containers}
          onViewLogs={(c) => setActiveLogContainer(c)}
          onRestartContainer={(c) => setActiveRestartContainer(c)}
        />
      </main>

      {/* Modals */}
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#090d16] py-4 px-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-slate-400 font-semibold">Homelab Cockpit</span>
            <span>— Lenovo ThinkCentre M710q Tiny</span>
          </div>
          <div>
            <span>WebSocket Live Stream (2s) • Fastify + Vite + React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
