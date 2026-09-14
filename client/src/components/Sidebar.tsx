import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Boxes,
  Server,
  GitBranch,
  Cpu,
  TerminalSquare,
  Bot,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export const NAV_ROUTES = [
  { path: '/', label: 'Overview', icon: Home },
  { path: '/beta', label: 'Beta UI', icon: LayoutGrid, isBeta: true },
  { path: '/fleet', label: 'Fleet', icon: Boxes },
  { path: '/infra', label: 'Infra', icon: Server },
  { path: '/git-projects', label: 'Git projects', icon: GitBranch },
  { path: '/processes', label: 'Processes', icon: Cpu },
  { path: '/terminal', label: 'Terminal', icon: TerminalSquare },
  { path: '/sentinel', label: 'Sentinel', icon: Bot },
  { path: '/ai-agents', label: 'AI Agents', icon: Sparkles },
];

const STORAGE_KEY = 'cockpit-sidebar-collapsed';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable — collapse state just won't persist
      }
      return next;
    });
  };

  return (
    <aside
      className={`sticky top-4 z-10 my-4 ml-4 hidden max-h-[calc(100vh-2rem)] shrink-0 flex-col self-start rounded-panel border border-cockpit-border bg-cockpit-panel/80 backdrop-blur-xl shadow-panel transition-all duration-200 md:flex ${
        isCollapsed ? 'w-[60px]' : 'w-[190px]'
      }`}
    >
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5">
        {NAV_ROUTES.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === '/'}
              title={route.label}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-cockpit-accent/10 text-cockpit-accent'
                    : 'text-cockpit-muted hover:bg-cockpit-panelHover hover:text-cockpit-text'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{route.label}</span>}
              </div>
              {!isCollapsed && route.isBeta && (
                <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/30">
                  Beta
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center justify-center border-t border-cockpit-border/60 py-2.5 text-cockpit-muted transition-colors duration-150 hover:bg-cockpit-panelHover hover:text-cockpit-text"
      >
        {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};
