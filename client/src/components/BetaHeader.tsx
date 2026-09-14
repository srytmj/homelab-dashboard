import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Server,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Terminal,
  LogOut,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { Theme } from '../hooks/useTheme.js';
import { ClockWeatherWidget } from './ClockWeatherWidget.js';
import { BETA_NAV_ROUTES } from './BetaSidebar.js';

interface BetaHeaderProps {
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

export const BetaHeader: React.FC<BetaHeaderProps> = ({
  snapshot,
  isConnected,
  lastUpdated,
  isPrivacyMode,
  isFullscreen,
  theme,
  onTogglePrivacy,
  onToggleFullscreen,
  onToggleTheme,
  onOpenCommandPalette,
  onRefresh,
}) => {
  const { username, logout } = useAuth();
  const pve = snapshot?.host.pve;
  const pveOnline = pve?.connected ?? false;
  const allHealthy = isConnected && pveOnline;

  const bgStateClass = allHealthy ? 'bg-state-good' : 'bg-state-warn';
  const textStateClass = allHealthy ? 'text-state-good' : 'text-state-warn';

  return (
    <header className="sticky top-0 z-40 border-b-4 border-cockpit-text bg-cockpit-bg shadow-[0_4px_0_rgba(var(--cockpit-text)/1)]">
      <div className="mx-auto w-full px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Primary bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 sm:border-4 border-cockpit-text ${textStateClass}`}>
                <Server className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-widest text-cockpit-text uppercase leading-none">Cockpit</h1>
                  <span className="bg-cockpit-text text-cockpit-bg px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Beta</span>
                  {snapshot?.isDemoMode && <span className="bg-state-warn text-cockpit-bg px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Demo</span>}
                </div>
                <p className="font-mono mt-0.5 sm:mt-1 truncate tracking-widest text-[9.5px] sm:text-[10px] uppercase font-bold text-cockpit-muted">
                  {pve?.nodeName ? `NODE: ${pve.nodeName}` : 'SYSTEM ACTIVE'}
                </p>
              </div>
            </div>

            {/* Weather widget visible on desktop */}
            <div className="hidden lg:block shrink-0">
               <ClockWeatherWidget />
            </div>

            {/* Mobile quick sign out */}
            <button
              onClick={logout}
              title={username ? `Sign out ${username}` : 'Sign out'}
              className="sm:hidden flex items-center justify-center p-1.5 border-2 border-cockpit-text hover:bg-state-bad hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Link
              to="/"
              className="group flex items-center justify-center gap-1.5 border-2 border-cockpit-text bg-cockpit-bg px-2 sm:px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-cockpit-text hover:text-cockpit-bg active:translate-y-[2px] transition-none whitespace-nowrap"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Legacy UI</span>
            </Link>

            <button
              onClick={onOpenCommandPalette}
              title="Open Command Deck (Ctrl+K)"
              className="group flex items-center justify-center gap-1.5 border-2 border-cockpit-text bg-cockpit-bg px-2 sm:px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-cockpit-text hover:text-cockpit-bg active:translate-y-[2px] transition-none whitespace-nowrap"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">CMD</span>
            </button>

            <div className="flex border-2 border-cockpit-text bg-cockpit-bg shrink-0">
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-1.5 hover:bg-cockpit-text hover:text-cockpit-bg transition-none active:bg-cockpit-muted"
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </button>

              <div className="w-0.5 bg-cockpit-text"></div>

              <button
                onClick={onTogglePrivacy}
                title="Toggle Privacy"
                className={`p-1.5 hover:bg-cockpit-text hover:text-cockpit-bg transition-none active:bg-cockpit-muted ${isPrivacyMode ? 'text-state-warn' : ''}`}
              >
                {isPrivacyMode ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </button>

              <div className="w-0.5 bg-cockpit-text hidden sm:block"></div>

              <button
                onClick={onToggleFullscreen}
                title="Fullscreen"
                className="p-1.5 hover:bg-cockpit-text hover:text-cockpit-bg transition-none active:bg-cockpit-muted hidden sm:block"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={onRefresh}
              title={lastUpdated ? `Last update ${lastUpdated.toLocaleTimeString()} — click to refresh` : 'Refresh'}
              className={`flex items-center gap-1.5 border-2 border-cockpit-text px-2 sm:px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-cockpit-text hover:text-cockpit-bg active:translate-y-[2px] transition-none whitespace-nowrap`}
            >
              <span className={`h-2 w-2 shadow-[2px_2px_0_rgba(var(--cockpit-text)/1)] border border-cockpit-text ${bgStateClass}`} />
              <span className="hidden xs:inline">Sync</span>
              <RefreshCw className="h-3 w-3" />
            </button>

            <button
              onClick={logout}
              title={username ? `Sign out ${username}` : 'Sign out'}
              className="hidden sm:flex items-center justify-center p-1.5 border-2 border-cockpit-text hover:bg-state-bad hover:text-white hover:border-state-bad active:translate-y-[2px] transition-none"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Beta Nav */}
        <nav className="flex items-center gap-1.5 mt-2.5 pb-1 overflow-x-auto scrollbar-none whitespace-nowrap md:hidden font-mono text-[10px] font-black uppercase tracking-wider border-t-2 border-cockpit-border/40 pt-2">
          {BETA_NAV_ROUTES.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.end}
              className={({ isActive }: { isActive: boolean }) =>
                `px-2.5 py-1 border-2 transition-none shrink-0 ${
                  isActive
                    ? 'border-cockpit-text bg-cockpit-text text-cockpit-bg shadow-[2px_2px_0_rgba(var(--cockpit-text)/1)]'
                    : 'border-cockpit-text/30 bg-cockpit-bg text-cockpit-text hover:border-cockpit-text'
                }`
              }
            >
              {route.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};
