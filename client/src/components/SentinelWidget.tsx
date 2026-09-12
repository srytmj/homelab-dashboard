import { useState } from 'react';
import { Bot, Send, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, HelpCircle, Terminal, UserCheck } from 'lucide-react';
import { SentinelStatus } from '../types.js';

interface SentinelWidgetProps {
  sentinel: SentinelStatus | undefined;
}

export const SentinelWidget: React.FC<SentinelWidgetProps> = ({ sentinel }) => {
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const isEnabled = sentinel?.enabled && sentinel?.polling;

  return (
    <section className="rounded-xl bg-[#0d1424] border border-slate-800/90 p-4 lg:p-5 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/30 text-sky-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                Homelab Sentinel (Telegram & Gemini Companion)
              </h2>
              {isEnabled ? (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE (@{sentinel?.botUsername || 'bot'})
                </span>
              ) : (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  STANDBY (OPTIONAL)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              3-Tier mobile operations • Fail-closed user allowlist • Natural language Q&A
            </p>
          </div>
        </div>

        {/* Cheat Sheet Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Command Cheat Sheet</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${showCheatSheet ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3.5">
        {isEnabled ? (
          /* Active State Matrix */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {/* 1. Bot Connection */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] block">LONG-POLLING STATUS</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Listener
                </span>
              </div>
              <Send className="w-4 h-4 text-slate-600" />
            </div>

            {/* 2. Gemini Tier 2 LLM */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] block">TIER 2 GEMINI Q&A</span>
                <span className={`font-bold flex items-center gap-1.5 mt-0.5 ${sentinel.geminiConfigured ? 'text-sky-300' : 'text-amber-400'}`}>
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  {sentinel.geminiConfigured ? 'Ready (2.0 Flash)' : 'Key Missing'}
                </span>
              </div>
              <Terminal className="w-4 h-4 text-slate-600" />
            </div>

            {/* 3. Auth Allowlist */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] block">AUTHORIZED OWNERS</span>
                <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  {sentinel.allowedUsersCount} Allowed ID(s)
                </span>
              </div>
              <ShieldAlert className="w-4 h-4 text-slate-600" />
            </div>

            {/* 4. Last Activity */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] block">LAST TELEGRAM ACTION</span>
                <span className="text-slate-300 font-bold truncate max-w-[120px] block mt-0.5">
                  {sentinel.lastCommand ? `${sentinel.lastCommand} (${sentinel.lastCommandAt})` : 'Idle'}
                </span>
              </div>
              <Terminal className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        ) : (
          /* Standby State Explanation */
          <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-sky-400 shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-200">
                  Optional Telegram Control Companion is on Standby
                </div>
                <div className="text-slate-400 mt-0.5">
                  Operate your homelab from Telegram via 3-Tier safety commands without running separate Python containers.
                  Set <code className="text-sky-300 bg-slate-800 px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> & <code className="text-sky-300 bg-slate-800 px-1 py-0.5 rounded">TELEGRAM_ALLOWED_USER_IDS</code> in <code className="text-amber-300">.env</code> to activate.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Command Cheat Sheet */}
        {showCheatSheet && (
          <div className="mt-3 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tier 1 */}
              <div className="space-y-1">
                <div className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Tier 1 (Read-Only)
                </div>
                <p className="text-slate-400 text-[11px]">No state modified, completely safe:</p>
                <div className="space-y-0.5 text-slate-300 text-[11px]">
                  <div><code className="text-cyan-300">/status</code> — Live host & containers</div>
                  <div><code className="text-cyan-300">/resources</code> — Storage & NVMe matrix</div>
                  <div><code className="text-cyan-300">/backup_status</code> — vzdump logs</div>
                  <div><code className="text-cyan-300">/logs &lt;name&gt;</code> — Monospace logs</div>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="space-y-1">
                <div className="text-sky-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Tier 2 (AI Assistant)
                </div>
                <p className="text-slate-400 text-[11px]">Natural language Q&A via Gemini:</p>
                <div className="space-y-0.5 text-slate-300 text-[11px]">
                  <div><code className="text-sky-300">"jellyfin lancar ga bro?"</code></div>
                  <div><code className="text-sky-300">"disk mana yg mau penuh?"</code></div>
                  <div><code className="text-sky-300">/ask &lt;prompt&gt;</code></div>
                  <div className="text-[10px] text-slate-500">Answers only — never executes actions</div>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="space-y-1">
                <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Tier 3 (State Actions)
                </div>
                <p className="text-slate-400 text-[11px]">Whitelisted & requires /confirm:</p>
                <div className="space-y-0.5 text-slate-300 text-[11px]">
                  <div><code className="text-amber-300">/restart &lt;container&gt;</code></div>
                  <div><code className="text-amber-300">/prune</code> — Clean NVMe cache</div>
                  <div><code className="text-emerald-300">/confirm</code> — Execute within 60s</div>
                  <div><code className="text-rose-300">/cancel</code> — Abort action</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
