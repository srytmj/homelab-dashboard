import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { Theme } from '../hooks/useTheme.js';
import { BetaHeader } from '../components/BetaHeader.js';
import { BetaSidebar } from '../components/BetaSidebar.js';
import { DasWatchdogAlert } from '../components/DasWatchdogAlert.js';

interface BetaLayoutProps {
  snapshot: CockpitSnapshot | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  isPrivacyMode: boolean;
  isFullscreen: boolean;
  theme: Theme;
  onTogglePrivacy: () => void;
  onToggleFullscreen: () => void;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onRefresh: () => void;
}

export const BetaLayout: React.FC<BetaLayoutProps> = (props) => {
  const location = useLocation();
  const isOverview = location.pathname === '/beta' || location.pathname === '/beta/';
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-cockpit-bg text-cockpit-text transition-colors duration-250 font-sans">
      <BetaHeader {...props} />
      
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-start gap-4">
        <BetaSidebar />
        
        <main className="w-full min-w-0 flex-1 space-y-8 p-4 sm:p-6 lg:p-8 mt-2">
          {isOverview && !isWarningDismissed && (
            <div className="border-4 border-yellow-500 bg-yellow-500/10 p-3 sm:p-4 shadow-[4px_4px_0_rgba(234,179,8,1)] flex items-start justify-between gap-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="bg-yellow-500 text-black px-1.5 py-0.5 text-xs font-black uppercase tracking-widest leading-none mt-0.5">
                  NOTICE
                </span>
                <p className="font-mono text-xs uppercase tracking-widest text-cockpit-text">
                  Beta Brutalist UI Active. High contrast density layout. Sub-pages and tools function normally.
                </p>
              </div>
              <button
                onClick={() => setIsWarningDismissed(true)}
                title="Dismiss notice"
                className="p-1 border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-none shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <DasWatchdogAlert storage={props.snapshot?.storage} />

          {props.snapshot?.host.pve && !props.snapshot.host.pve.connected && (
            <div className="border-2 border-cockpit-text bg-cockpit-bg p-4 flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase font-black tracking-widest text-cockpit-text bg-cockpit-border/20 inline-block px-2 py-1 w-max">System Notice</span>
              <p className="font-mono text-xs uppercase tracking-widest leading-relaxed">
                Proxmox API unlinked. Confirm <code className="font-bold underline">PROXMOX_TOKEN_ID</code> configuration. Operating on telemetry simulation.
              </p>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};
