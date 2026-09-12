import { useState } from 'react';
import { ExternalLink, X, Shield, Terminal, Activity, Globe, Lock, Code2, Film, CheckCircle2 } from 'lucide-react';
import { NativeConsoleItem } from '../types.js';
import { redactText } from '../utils/formatters.js';

interface CommandDeckModalProps {
  consoles: NativeConsoleItem[] | undefined;
  isPrivacyMode: boolean;
  onClose: () => void;
}

export const CommandDeckModal: React.FC<CommandDeckModalProps> = ({ consoles = [], isPrivacyMode, onClose }) => {
  const [accessMode, setAccessMode] = useState<'lan' | 'tailscale'>('lan');

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'hypervisor':
        return <Shield className="w-5 h-5 text-purple-400" />;
      case 'containers':
        return <Terminal className="w-5 h-5 text-cyan-400" />;
      case 'proxy':
        return <Globe className="w-5 h-5 text-indigo-400" />;
      case 'monitoring':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'security':
        return <Lock className="w-5 h-5 text-amber-400" />;
      case 'tools':
        return <Code2 className="w-5 h-5 text-sky-400" />;
      default:
        return <Film className="w-5 h-5 text-pink-400" />;
    }
  };

  const getTargetUrl = (item: NativeConsoleItem) => {
    const host = accessMode === 'tailscale' ? item.tailscaleHost : item.lanHost;
    const path = item.path || '';
    return `${item.protocol}://${host}:${item.port}${path}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/60">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100 uppercase tracking-wide">
                  Infrastructure Command Deck
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-cyan-400 border border-slate-700">
                  Native Consoles
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Direct single-click gateway into hypervisor nodes, container engines & monitoring stacks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Routing Mode Toggle: LAN vs Tailscale */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setAccessMode('lan')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  accessMode === 'lan'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LAN (192.168.18.x)
              </button>
              <button
                onClick={() => setAccessMode('tailscale')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  accessMode === 'tailscale'
                    ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tailscale (100.x)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Consoles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {consoles.map((item) => {
            const url = getTargetUrl(item);
            const hostDisplay = accessMode === 'tailscale' ? item.tailscaleHost : item.lanHost;

            return (
              <a
                key={item.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex items-start justify-between gap-3 shadow-sm hover:shadow-cyan-950/40"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700 transition-colors shrink-0 mt-0.5">
                    {getIconForCategory(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{item.protocol}://{redactText(hostDisplay, isPrivacyMode)}:{item.port}</span>
                    </div>
                  </div>
                </div>

                <div className="p-1 rounded-md text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>All ports bound to 0.0.0.0 & exposed via local bridge</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-mono transition-colors"
          >
            Close Deck
          </button>
        </div>

      </div>
    </div>
  );
};
