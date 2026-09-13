import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Check, GitBranch, Pin, PinOff, Trash2, X, ArrowUpCircle } from 'lucide-react';
import { NotificationEntry } from '../types.js';
import { authFetch } from '../utils/api.js';

const POLL_MS = 8000;
const SEEN_KEY = 'cockpit-notifications-last-seen';
const DESKTOP_KEY = 'cockpit-desktop-notifications';

const ICONS: Record<NotificationEntry['type'], React.ReactNode> = {
  pin: <Pin className="h-3.5 w-3.5 text-cockpit-accent" />,
  unpin: <PinOff className="h-3.5 w-3.5 text-cockpit-muted" />,
  'git-track': <GitBranch className="h-3.5 w-3.5 text-cockpit-accent" />,
  'git-untrack': <GitBranch className="h-3.5 w-3.5 text-cockpit-muted" />,
  'git-pull-start': <GitBranch className="h-3.5 w-3.5 text-state-warn" />,
  'git-pull-success': <Check className="h-3.5 w-3.5 text-state-good" />,
  'git-pull-failed': <X className="h-3.5 w-3.5 text-state-bad" />,
  'git-auto-deploy': <GitBranch className="h-3.5 w-3.5 text-cockpit-accent" />,
  'app-update-start': <ArrowUpCircle className="h-3.5 w-3.5 text-cockpit-accent" />,
  'app-update-success': <Check className="h-3.5 w-3.5 text-state-good" />,
  'app-update-failed': <X className="h-3.5 w-3.5 text-state-bad" />,
};

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const NotificationsPanel: React.FC = () => {
  const [entries, setEntries] = useState<NotificationEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [desktopEnabled, setDesktopEnabled] = useState(() => {
    try {
      return localStorage.getItem(DESKTOP_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const lastSeenRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      lastSeenRef.current = localStorage.getItem(SEEN_KEY);
    } catch {
      // localStorage unavailable — unread tracking just won't persist
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      authFetch('/api/notifications')
        .then((res) => res.json())
        .then((data: NotificationEntry[]) => {
          if (cancelled) return;
          const freshOnes = lastSeenRef.current
            ? data.slice(0, Math.max(0, data.findIndex((e) => e.id === lastSeenRef.current)))
            : [];
          if (desktopEnabled && freshOnes.length > 0 && Notification.permission === 'granted') {
            freshOnes.slice(0, 3).forEach((entry) => {
              new Notification('Homelab Cockpit', { body: entry.message });
            });
          }
          setEntries(data);
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopEnabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = lastSeenRef.current
    ? entries.findIndex((e) => e.id === lastSeenRef.current)
    : entries.length;
  const hasUnread = unreadCount > 0;

  const handleOpen = () => {
    setIsOpen((open) => !open);
    if (entries[0]) {
      lastSeenRef.current = entries[0].id;
      try {
        localStorage.setItem(SEEN_KEY, entries[0].id);
      } catch {
        // best effort only
      }
    }
  };

  const toggleDesktop = async () => {
    if (!desktopEnabled) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    const next = !desktopEnabled;
    setDesktopEnabled(next);
    try {
      localStorage.setItem(DESKTOP_KEY, String(next));
    } catch {
      // best effort only
    }
  };

  const handleClear = async () => {
    await authFetch('/api/notifications/clear', { method: 'POST' });
    setEntries([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={handleOpen} title="Notifications" className={`icon-btn relative ${hasUnread ? 'text-cockpit-accent' : ''}`}>
        {hasUnread ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cockpit-accent" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-panel border border-cockpit-border bg-cockpit-panel shadow-xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-cockpit-border px-4 py-3">
            <span className="text-[12.5px] font-semibold text-cockpit-text">Notifications</span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDesktop}
                title={desktopEnabled ? 'Desktop notifications on' : 'Enable desktop notifications'}
                className={`text-[10.5px] font-mono uppercase tracking-wide ${
                  desktopEnabled ? 'text-cockpit-accent' : 'text-cockpit-muted hover:text-cockpit-text'
                }`}
              >
                Desktop
              </button>
              {entries.length > 0 && (
                <button onClick={handleClear} title="Clear all" className="text-cockpit-muted hover:text-cockpit-text">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px] text-cockpit-muted">Nothing yet.</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2.5 border-b border-cockpit-border px-4 py-2.5 last:border-b-0">
                  <span className="mt-0.5 shrink-0">{ICONS[entry.type]}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] text-cockpit-text">{entry.message}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-cockpit-muted">{timeAgo(entry.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
