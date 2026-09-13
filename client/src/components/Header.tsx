import React from 'react';
import { NavLink } from 'react-router-dom';
import { Server, RefreshCw, Eye, EyeOff, Maximize2, Minimize2, Terminal, LogOut, Sun, Moon } from 'lucide-react';
import { CockpitSnapshot } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { Theme } from '../hooks/useTheme.js';
import { NAV_ROUTES } from './Sidebar.js';
import { ClockWeatherWidget } from './ClockWeatherWidget.js';
import { NotificationsPanel } from './NotificationsPanel.js';

interface HeaderProps {
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

export const Header: React.FC<HeaderProps> = ({
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

  return (
    <header className="sticky top-0 z-40 border-b border-cockpit-border bg-cockpit-topbar/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto w-full max-w-[1400px] px-5 lg:px-8">
        {/* Primary bar */}
        <div className="flex items-center justify-between gap-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-cockpit-border bg-cockpit-panel text-cockpit-accent">
              <Server className="h-[18px] w-[18px]" />
              <span
                className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-cockpit-topbar ${
                  allHealthy ? 'bg-state-good' : 'bg-state-warn'
                }`}
                title={allHealthy ? 'All systems nominal' : 'Degraded — check node status'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-extrabold tracking-tight text-cockpit-text">Cockpit</h1>
                {username && <span className="pill pill-neutral normal-case">{username}</span>}
                {snapshot?.isDemoMode && <span className="pill pill-warn">Demo data</span>}
              </div>
              <p className="label mt-0.5 normal-case tracking-normal">
                Owner POV{pve?.nodeName ? ` · ${pve.nodeName}` : ''}
              </p>
            </div>
          </div>

          <ClockWeatherWidget />

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCommandPalette}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-cockpit-accent/30 bg-cockpit-accent/10 px-3 py-1.5 text-[12.5px] font-semibold text-cockpit-accent transition-all duration-150 hover:bg-cockpit-accent/20 active:scale-95"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Command Deck</span>
              <kbd className="hidden rounded border border-cockpit-accent/30 px-1 font-mono text-[10px] normal-case opacity-80 sm:inline">
                Ctrl K
              </kbd>
            </button>

            <NotificationsPanel />

            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="icon-btn"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={onTogglePrivacy}
              title={isPrivacyMode ? 'Privacy mode on — IPs and domains hidden' : 'Hide IPs and domains'}
              className={`icon-btn ${isPrivacyMode ? 'border-state-warn/40 text-state-warn' : ''}`}
            >
              {isPrivacyMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen (wall display)'}
              className="icon-btn"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={onRefresh}
              title={lastUpdated ? `Last update ${lastUpdated.toLocaleTimeString()} — click to refresh` : 'Refresh'}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
                isConnected
                  ? 'border-state-good/30 bg-state-good/10 text-state-good'
                  : 'border-state-bad/30 bg-state-bad/10 text-state-bad'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-state-good' : 'bg-state-bad'}`} />
              <span className="font-semibold">{isConnected ? 'Live' : 'Reconnecting'}</span>
              {lastUpdated && (
                <span className="hidden opacity-70 sm:inline">{lastUpdated.toLocaleTimeString()}</span>
              )}
              <RefreshCw className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={logout}
              title={username ? `Sign out ${username}` : 'Sign out'}
              className="icon-btn hover:border-state-bad/40 hover:text-state-bad"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Nav for small screens */}
        <nav className="flex items-center gap-1 pb-2 md:hidden">
          {NAV_ROUTES.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === '/'}
              className={({ isActive }: { isActive: boolean }) =>
                `rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  isActive ? 'bg-cockpit-accent/10 text-cockpit-accent' : 'text-cockpit-muted'
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
