import React, { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { NativeConsoleItem } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface CommandDeckModalProps {
  consoles: NativeConsoleItem[] | undefined;
  isPrivacyMode: boolean;
  onClose: () => void;
}

export const CommandDeckModal: React.FC<CommandDeckModalProps> = ({ consoles = [], isPrivacyMode, onClose }) => {
  const [accessMode, setAccessMode] = useState<'lan' | 'tailscale'>('lan');

  const getTargetUrl = (item: NativeConsoleItem) => {
    const host = accessMode === 'tailscale' ? item.tailscaleHost : item.lanHost;
    return `${item.protocol}://${host}:${item.port}${item.path || ''}`;
  };

  return (
    <div className="overlay">
      <div className="panel modal-panel w-full max-w-3xl shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Command deck</h3>
            <p className="panel-sub">Direct links into every native console</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="seg">
              <button
                onClick={() => setAccessMode('lan')}
                className={`seg-btn ${accessMode === 'lan' ? 'seg-btn-on' : ''}`}
              >
                LAN
              </button>
              <button
                onClick={() => setAccessMode('tailscale')}
                className={`seg-btn ${accessMode === 'tailscale' ? 'seg-btn-on' : ''}`}
              >
                Tailscale
              </button>
            </div>
            <button onClick={onClose} className="icon-btn" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid max-h-[60vh] gap-2.5 overflow-y-auto p-5 sm:grid-cols-2">
          {consoles.map((item) => {
            const host = accessMode === 'tailscale' ? item.tailscaleHost : item.lanHost;

            return (
              <a
                key={item.id}
                href={getTargetUrl(item)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border border-cockpit-border bg-cockpit-bg px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-cockpit-accent/40 hover:bg-cockpit-panelHover active:translate-y-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-cockpit-text group-hover:text-cockpit-accent">
                      {item.name}
                    </span>
                    <span className="pill pill-neutral">{item.badge}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-cockpit-muted">{item.description}</p>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-cockpit-muted">
                    {item.protocol}://{redactText(host, isPrivacyMode)}:{item.port}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cockpit-muted group-hover:text-cockpit-accent" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
