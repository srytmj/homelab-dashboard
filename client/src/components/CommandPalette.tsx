import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, ArrowRight, LayoutGrid, Terminal, Pin } from 'lucide-react';
import { ContainerMetric, NativeConsoleItem } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  consoles: NativeConsoleItem[] | undefined;
  containers: ContainerMetric[] | undefined;
  isPrivacyMode?: boolean;
}

type PaletteGroup = 'Pages' | 'Consoles' | 'Pinned containers';

interface PaletteItem {
  id: string;
  group: PaletteGroup;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  run: () => void;
}

const PAGES = [
  { path: '/', label: 'Overview' },
  { path: '/fleet', label: 'Fleet' },
  { path: '/infra', label: 'Infra' },
  { path: '/sentinel', label: 'Sentinel' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  consoles = [],
  containers = [],
  isPrivacyMode = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoadedViaTailscale =
    typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('100.') || window.location.hostname.endsWith('.ts.net'));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const pageItems: PaletteItem[] = PAGES.map((p) => ({
      id: `page-${p.path}`,
      group: 'Pages',
      label: p.label,
      icon: <ArrowRight className="h-3.5 w-3.5" />,
      run: () => navigate(p.path),
    }));

    const consoleItems: PaletteItem[] = consoles.map((item) => {
      const host = isLoadedViaTailscale ? item.tailscaleHost : item.lanHost;
      const url = `${item.protocol}://${host}:${item.port}${item.path || ''}`;
      return {
        id: `console-${item.id}`,
        group: 'Consoles',
        label: item.name,
        sublabel: redactText(url, isPrivacyMode),
        icon: <LayoutGrid className="h-3.5 w-3.5" />,
        run: () => window.open(url, '_blank', 'noreferrer'),
      };
    });

    const pinnedItems: PaletteItem[] = containers
      .filter((c) => c.isPinned)
      .map((c) => {
        const url = c.publicUrl || (isLoadedViaTailscale ? c.tailscaleUrl || c.lanUrl : c.lanUrl || c.tailscaleUrl);
        return {
          id: `container-${c.id}`,
          group: 'Pinned containers',
          label: c.name,
          sublabel: url ? redactText(url, isPrivacyMode) : 'No reachable URL',
          icon: <Pin className="h-3.5 w-3.5 fill-current" />,
          run: () => {
            if (url) window.open(url, '_blank', 'noreferrer');
          },
        };
      });

    return [...pageItems, ...consoleItems, ...pinnedItems];
  }, [consoles, containers, isLoadedViaTailscale, isPrivacyMode, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sublabel?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!isOpen) return null;

  const activate = (item: PaletteItem) => {
    item.run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selected]) activate(filtered[selected]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let runningIndex = -1;
  const groups: PaletteGroup[] = ['Pages', 'Consoles', 'Pinned containers'];

  return (
    <div className="overlay items-start pt-[12vh]" onClick={onClose}>
      <div
        className="panel modal-panel w-full max-w-lg overflow-hidden shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-cockpit-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-cockpit-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a page, console or pinned container…"
            className="w-full bg-transparent text-[13.5px] text-cockpit-text placeholder-cockpit-muted focus:outline-none"
          />
          <kbd className="label rounded border border-cockpit-border px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-cockpit-muted">Nothing matches "{query}".</p>
          )}

          {groups.map((group) => {
            const groupItems = filtered.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;

            return (
              <div key={group} className="px-2 py-1">
                <p className="label px-2 py-1.5">{group}</p>
                {groupItems.map((item) => {
                  runningIndex += 1;
                  const isSelected = runningIndex === selected;
                  return (
                    <button
                      key={item.id}
                      onClick={() => activate(item)}
                      onMouseEnter={() => setSelected(runningIndex)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                        isSelected ? 'bg-cockpit-accent/10 text-cockpit-accent' : 'text-cockpit-text'
                      }`}
                    >
                      <span className={isSelected ? 'text-cockpit-accent' : 'text-cockpit-muted'}>{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{item.label}</span>
                        {item.sublabel && (
                          <span className="block truncate font-mono text-[11px] text-cockpit-muted">
                            {item.sublabel}
                          </span>
                        )}
                      </span>
                      {item.group !== 'Pages' && <ExternalLink className="h-3 w-3 shrink-0 text-cockpit-muted" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-cockpit-border px-4 py-2 font-mono text-[10.5px] text-cockpit-muted">
          <span className="flex items-center gap-1">
            <Terminal className="h-3 w-3" /> Ctrl+K anywhere
          </span>
          <span>↑↓ to move</span>
          <span>Enter to open</span>
        </div>
      </div>
    </div>
  );
};
