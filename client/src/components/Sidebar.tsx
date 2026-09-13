import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
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
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-cockpit-accent/10 text-cockpit-accent'
                    : 'text-cockpit-muted hover:bg-cockpit-panelHover hover:text-cockpit-text'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{route.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="m-2 flex items-center justify-center gap-2 rounded-lg border border-cockpit-border bg-cockpit-bg py-1.5 text-cockpit-muted transition-colors hover:text-cockpit-text"
      >
        {isCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
};
