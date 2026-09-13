import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, ArrowRight, Terminal, Pin } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  containers: ContainerMetric[] | undefined;
  isPrivacyMode?: boolean;
}

type PaletteGroup = 'Pages' | 'Pinned containers';

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
  { path: '/git-projects', label: 'Git projects' },
  { path: '/terminal', label: 'Terminal' },
  { path: '/sentinel', label: 'Sentinel' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  containers = [],
  isPrivacyMode = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const pinnedItems: PaletteItem[] = containers
      .filter((c) => c.isPinned)
      .map((c) => {
        const url = c.publicUrl || c.tailscaleUrl || c.lanUrl;
        return {
          id: `container-${c.id}`,
          group: 'Pinned containers',
          label: c.name,
          sublabel: url ? redactText(url, isPrivacyMode) : 'No reachable URL — pin it with a LAN/Tailscale port',
          icon: <Pin className="h-3.5 w-3.5 fill-current" />,
          run: () => {
            if (url) window.open(url, '_blank', 'noreferrer');
          },
        };
      });

    return [...pageItems, ...pinnedItems];
  }, [containers, isPrivacyMode, navigate]);

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
  const groups: PaletteGroup[] = ['Pages', 'Pinned containers'];

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
            placeholder="Jump to a page or a pinned container…"
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
                  const itemIndex = runningIndex;
                  const isSelected = itemIndex === selected;
                  return (
                    <button
                      key={item.id}
                      onClick={() => activate(item)}
                      onMouseEnter={() => setSelected(itemIndex)}
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
                      {item.group === 'Pinned containers' && (
                        <ExternalLink className="h-3 w-3 shrink-0 text-cockpit-muted" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {items.filter((i) => i.group === 'Pinned containers').length === 0 && !query && (
            <p className="px-4 py-3 text-[12px] text-cockpit-muted">
              Nothing pinned yet — pin a container from the Fleet table to launch it from here.
            </p>
          )}
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
