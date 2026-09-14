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

export const BETA_NAV_ROUTES = [
  { path: '/beta', end: true, label: 'Overview', icon: Home },
  { path: '/beta/fleet', end: false, label: 'Fleet', icon: Boxes },
  { path: '/beta/infra', end: false, label: 'Infra', icon: Server },
  { path: '/beta/git-projects', end: false, label: 'Git projects', icon: GitBranch },
  { path: '/beta/processes', end: false, label: 'Processes', icon: Cpu },
  { path: '/beta/terminal', end: false, label: 'Terminal', icon: TerminalSquare },
  { path: '/beta/sentinel', end: false, label: 'Sentinel', icon: Bot },
  { path: '/beta/ai-agents', end: false, label: 'AI Agents', icon: Sparkles },
];

const STORAGE_KEY = 'cockpit-beta-sidebar-collapsed';

export const BetaSidebar: React.FC = () => {
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
        // localStorage unavailable
      }
      return next;
    });
  };

  return (
    <aside
      className={`sticky top-4 hidden shrink-0 flex-col md:flex mt-6 ml-6 space-y-4 transition-all duration-150 ${
        isCollapsed ? 'w-[64px]' : 'w-[220px]'
      }`}
    >
      <div className={`font-mono text-[10px] font-black tracking-widest text-cockpit-muted uppercase border-b-2 border-cockpit-text pb-2 ${
        isCollapsed ? 'text-center' : ''
      }`}>
        {isCollapsed ? 'DIR' : 'Directory'}
      </div>
      <nav className="flex flex-col gap-2">
        {BETA_NAV_ROUTES.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.end}
              title={route.label}
              className={({ isActive }) =>
                `flex items-center gap-3 border-2 text-[12px] font-black tracking-widest uppercase transition-none ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'border-cockpit-text bg-cockpit-text text-cockpit-bg shadow-none'
                    : 'border-transparent text-cockpit-text hover:border-cockpit-text hover:translate-x-[2px] hover:translate-y-[2px]'
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
        className="flex items-center justify-center border-2 border-cockpit-text bg-cockpit-bg p-2 text-cockpit-text hover:bg-cockpit-text hover:text-cockpit-bg shadow-[2px_2px_0_rgba(var(--cockpit-text)/1)] active:translate-y-[1px] transition-none"
      >
        {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};
