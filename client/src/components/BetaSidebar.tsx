import React from 'react';
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

export const BetaSidebar: React.FC = () => {
  return (
    <aside className="sticky top-4 hidden w-[220px] shrink-0 flex-col md:flex mt-6 ml-6 space-y-6">
      <div className="font-mono text-[10px] font-black tracking-widest text-cockpit-muted uppercase border-b-2 border-cockpit-text pb-2">
        Directory
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
                `flex items-center gap-3 px-3 py-2 border-2 text-[12px] font-black tracking-widest uppercase transition-none ${
                  isActive
                    ? 'border-cockpit-text bg-cockpit-text text-cockpit-bg shadow-none'
                    : 'border-transparent text-cockpit-text hover:border-cockpit-text hover:translate-x-[2px] hover:translate-y-[2px]'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{route.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
