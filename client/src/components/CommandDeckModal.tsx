import React, { useState } from 'react';
import { ExternalLink, X, Globe, Terminal, Copy, Check } from 'lucide-react';
import { NativeConsoleItem } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface CommandDeckModalProps {
  consoles: NativeConsoleItem[] | undefined;
  isPrivacyMode: boolean;
  onClose: () => void;
}

export const CommandDeckModal: React.FC<CommandDeckModalProps> = ({ consoles = [], isPrivacyMode, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 font-mono select-none">
      <div className="bg-[#0d1424] border border-slate-800 rounded-xl max-w-2xl w-full p-4 sm:p-5 shadow-xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Native Consoles & Web Gateways
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consoles Table / Dense List */}
        <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
          {consoles.map((item) => {
            const lanUrl = `${item.protocol}://${item.lanHost}:${item.port}${item.path || ''}`;
            const tsUrl = `${item.protocol}://${item.tailscaleHost}:${item.port}${item.path || ''}`;

            return (
              <div
                key={item.id}
                className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
              >
                {/* Left: Name & Port */}
                <div className="flex items-center gap-2.5 min-w-[180px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                      <span>{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal px-1 rounded bg-slate-800 border border-slate-700">
                        :{item.port}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.description}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Launch Routes (LAN & Tailscale) */}
                <div className="flex items-center gap-2 self-end sm:self-auto text-[11px]">
                  {/* LAN Link */}
                  <div className="flex items-center rounded bg-slate-950 border border-slate-800 px-2 py-1 gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">LAN</span>
                    <a
                      href={lanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 hover:text-white hover:underline flex items-center gap-1"
                    >
                      <span>{redactText(item.lanHost, isPrivacyMode)}:{item.port}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                    <button
                      onClick={() => copyUrl(`${item.id}_lan`, lanUrl)}
                      title="Copy LAN URL"
                      className="text-slate-500 hover:text-slate-300 pl-0.5"
                    >
                      {copiedId === `${item.id}_lan` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  {/* Tailscale Link */}
                  <div className="flex items-center rounded bg-indigo-950/40 border border-indigo-500/30 px-2 py-1 gap-1.5">
                    <span className="text-[9px] font-bold text-indigo-300 uppercase">TS</span>
                    <a
                      href={tsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-300 hover:text-white hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>{redactText(item.tailscaleHost, isPrivacyMode)}:{item.port}</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </a>
                    <button
                      onClick={() => copyUrl(`${item.id}_ts`, tsUrl)}
                      title="Copy Tailscale URL"
                      className="text-slate-500 hover:text-slate-300 pl-0.5"
                    >
                      {copiedId === `${item.id}_ts` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>Click URL to launch in new tab</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
