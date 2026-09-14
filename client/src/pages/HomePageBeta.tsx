import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, TerminalSquare, ShieldAlert, Cpu, HardDrive, Network, Activity, ArrowRight } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { redactText, formatBytes } from '../utils/formatters.js';
import { AppUpdateBanner } from '../components/AppUpdateBanner.js';
import { BookmarksSection } from '../components/BookmarksSection.js';

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-4 border-cockpit-text pb-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
             <div className="bg-cockpit-text text-cockpit-bg px-2 py-0.5 text-xs font-bold tracking-widest uppercase mb-1">Preview</div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-cockpit-text uppercase leading-none mt-2">
            System Overview
          </h1>
          <p className="font-mono text-xs text-cockpit-muted mt-2 uppercase tracking-wide font-bold">
             Experimental Brutalist Layout
          </p>
        </div>
      </div>

      <AppUpdateBanner />

      <div className="grid gap-6 md:grid-cols-12 items-start">
        
        {/* Core Vitals - Strict Brutalist Grid */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="sm:col-span-2 border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)]">
            <div className="flex items-center justify-between w-full border-b-2 border-cockpit-text pb-3 mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text">Primary Node</span>
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black tracking-widest uppercase">{pve?.nodeName || 'UNNAMED-NODE'}</h2>
                <div className="font-mono text-[11px] font-bold mt-1 text-cockpit-muted uppercase">
                  Proxmox VE · {redactText(pve?.ip || '0.0.0.0', isPrivacyMode)}
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-4 flex items-center gap-2">
              <Cpu className="h-3 w-3" /> Compute
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums leading-none tracking-tighter">{pve?.cpuCores || '--'}</div>
              <div className="font-mono text-[10px] font-bold text-cockpit-muted mt-2 uppercase tracking-widest">Allocated Cores</div>
            </div>
          </div>

          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-4 flex items-center gap-2">
              <HardDrive className="h-3 w-3" /> Memory
            </div>
            <div>
              <div className="text-3xl font-black tabular-nums leading-none tracking-tighter">{formatBytes(dockerHost?.ramTotalBytes ?? 0)}</div>
              <div className="font-mono text-[10px] font-bold text-cockpit-muted mt-2 uppercase tracking-widest">Total Capacity</div>
            </div>
          </div>

          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between border-l-8 border-l-state-good">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-4 flex items-center gap-2">
              <LayoutGrid className="h-3 w-3" /> Workloads
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black tabular-nums leading-none tracking-tighter">{runningCount}</div>
              <div className="font-mono text-[11px] font-bold text-cockpit-muted uppercase tracking-widest">/ {totalCount} RUNNING</div>
            </div>
          </div>

          <div className="border-2 border-cockpit-text p-4 bg-cockpit-bg shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)] flex flex-col justify-between">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-text mb-4 flex items-center gap-2">
              <Network className="h-3 w-3" /> Network Throughput
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline border-b-2 border-cockpit-border/50 pb-1 border-dotted">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-muted">RX</span>
                <span className="font-mono text-sm font-black tabular-nums text-cockpit-text">{formatBytes(throughput.rx)}/s</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cockpit-muted">TX</span>
                <span className="font-mono text-sm font-black tabular-nums text-cockpit-text">{formatBytes(throughput.tx)}/s</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Alerts & Actions */}
        <div className="md:col-span-4 space-y-6">
          
          <div className="border-4 border-yellow-500 bg-yellow-500/5 p-4 relative shadow-[4px_4px_0_rgba(234,179,8,1)]">
            <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500 flex items-center justify-center border-l-4 border-b-4 border-yellow-500">
              <ShieldAlert className="h-4 w-4 text-black" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-yellow-500 mb-2 mt-1">Prototype Elements</h3>
            <p className="text-[11px] text-cockpit-text leading-relaxed font-mono font-bold">
              The layout is in stark/brutalist mode. It removes excessive blur and gradients in favor of structural clarity, hard contrasts, and uniform metric blocks.
            </p>
          </div>

          <div className="border-2 border-cockpit-text bg-cockpit-bg p-4 space-y-4 shadow-[4px_4px_0_rgba(var(--cockpit-text)/1)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cockpit-text mb-4 flex items-center gap-2 border-b-2 border-cockpit-text pb-2">
              <TerminalSquare className="h-3 w-3" /> Quick Actions
            </h3>
            
            <Link to="/beta/fleet" className="flex items-center justify-between border-2 border-cockpit-text p-3 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-all group active:scale-[0.98]">
              <span className="font-mono text-[11px] font-black uppercase tracking-widest">Inspect Fleet</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link to="/beta/infra" className="flex items-center justify-between border-2 border-cockpit-text p-3 hover:bg-cockpit-text hover:text-cockpit-bg hover:translate-x-[2px] transition-all group active:scale-[0.98]">
              <span className="font-mono text-[11px] font-black uppercase tracking-widest">Infrastructure</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
        </div>

      </div>

      {/* Reusing BookmarksSection - relies on global .beta-ui styling injection for brutalist appearance! */}
      <BookmarksSection />
      
    </div>
  );
};
