import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, TerminalSquare, ShieldAlert, Cpu, HardDrive, Network, Activity } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { redactText, formatBytes } from '../utils/formatters.js';

interface HomePageBetaProps {
  snapshot: CockpitSnapshot | null;
  throughput: { rx: number; tx: number };
  isPrivacyMode: boolean;
}

export const HomePageBeta: React.FC<HomePageBetaProps> = ({ snapshot, throughput, isPrivacyMode }) => {
  const pve = snapshot?.host.pve;
  const dockerHost = snapshot?.host.dockerHost;
  
  const runningCount = snapshot?.containers.filter((c) => c.state === 'running').length ?? 0;
  const totalCount = snapshot?.containers.length ?? 0;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-cockpit-text pb-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-cockpit-text text-cockpit-bg px-2 py-0.5 text-xs font-bold tracking-widest uppercase mb-1">Preview</div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-cockpit-text uppercase leading-none mt-2">
            System Overview
          </h1>
          <p className="font-mono text-sm text-cockpit-muted mt-2 uppercase tracking-wide">
             Experimental Dashboard Interface
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center">
          <Link to="/" className="group flex items-center gap-2 border border-cockpit-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-cockpit-text hover:bg-cockpit-text hover:text-cockpit-bg transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="mt-0.5">Return to Legacy</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        
        {/* Core Vitals - Strict Brutalist Grid */}
        <div className="md:col-span-8 grid grid-cols-2 gap-4">
          
          <div className="col-span-2 border border-cockpit-border p-4 bg-cockpit-panel shadow-sm">
            <div className="flex items-center justify-between w-full border-b border-cockpit-border/50 pb-3 mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-cockpit-muted">Primary Node</span>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{pve?.nodeName || 'UNNAMED-NODE'}</h2>
                <div className="font-mono text-xs mt-1 text-cockpit-muted uppercase">
                  Proxmox VE · {redactText(pve?.ip || '0.0.0.0', isPrivacyMode)}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-cockpit-border p-4 bg-cockpit-panel shadow-sm flex flex-col justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cockpit-muted mb-4 flex items-center gap-2">
              <Cpu className="h-3 w-3" /> Compute
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums leading-none">{pve?.cpuCores || '--'}</div>
              <div className="font-mono text-xs text-cockpit-muted mt-1 uppercase">Allocated Cores</div>
            </div>
          </div>

          <div className="border border-cockpit-border p-4 bg-cockpit-panel shadow-sm flex flex-col justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cockpit-muted mb-4 flex items-center gap-2">
              <HardDrive className="h-3 w-3" /> Memory
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums leading-none">{formatBytes(dockerHost?.ramTotalBytes ?? 0)}</div>
              <div className="font-mono text-xs text-cockpit-muted mt-1 uppercase">Total Capacity</div>
            </div>
          </div>

          <div className="border border-cockpit-border p-4 bg-cockpit-panel shadow-sm flex flex-col justify-between border-l-4 border-l-green-500">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cockpit-muted mb-4 flex items-center gap-2">
              <LayoutGrid className="h-3 w-3" /> Workloads
            </div>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-black tabular-nums leading-none">{runningCount}</div>
              <div className="font-mono text-sm text-cockpit-muted mb-1 pb-0.5">/ {totalCount} RUNNING</div>
            </div>
          </div>

          <div className="border border-cockpit-border p-4 bg-cockpit-panel shadow-sm flex flex-col justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cockpit-muted mb-4 flex items-center gap-2">
              <Network className="h-3 w-3" /> Network Throughput
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline border-b border-cockpit-border/30 pb-1">
                <span className="font-mono text-xs text-cockpit-muted">RX</span>
                <span className="font-mono text-sm font-bold tabular-nums text-cockpit-text">{formatBytes(throughput.rx)}/s</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xs text-cockpit-muted">TX</span>
                <span className="font-mono text-sm font-bold tabular-nums text-cockpit-text">{formatBytes(throughput.tx)}/s</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Alerts & Actions */}
        <div className="md:col-span-4 space-y-4">
          
          <div className="border border-yellow-500 bg-yellow-500/5 p-4 relative">
            <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-black" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500 mb-2 mt-1">Prototype Notice</h3>
            <p className="text-xs text-cockpit-text/80 leading-relaxed font-mono">
              The layout is in stark/brutalist mode. It removes excessive blur and gradients in favor of structural clarity, hard contrasts, and uniform metric blocks.
            </p>
          </div>

          <div className="border border-cockpit-border bg-cockpit-bg p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cockpit-muted mb-3 flex items-center gap-2">
              <TerminalSquare className="h-3 w-3" /> Quick Actions
            </h3>
            
            <Link to="/fleet" className="flex items-center justify-between border border-cockpit-border p-3 hover:bg-cockpit-text hover:text-cockpit-bg hover:border-cockpit-text transition-all group">
              <span className="font-mono text-xs font-bold uppercase">Inspect Fleet</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
            
            <Link to="/infra" className="flex items-center justify-between border border-cockpit-border p-3 hover:bg-cockpit-text hover:text-cockpit-bg hover:border-cockpit-text transition-all group">
              <span className="font-mono text-xs font-bold uppercase">Infrastructure</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
          
        </div>

      </div>
    </div>
  );
};
