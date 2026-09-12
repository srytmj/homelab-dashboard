import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, Copy, Check, RefreshCw, ArrowDownToLine } from 'lucide-react';
import { ContainerMetric } from '../types.js';
import { authFetch } from '../utils/api.js';

interface LogModalProps {
  container: ContainerMetric | null;
  onClose: () => void;
}

export const LogModal: React.FC<LogModalProps> = ({ container, onClose }) => {
  const [logs, setLogs] = useState<string>('');
  const [tail, setTail] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container) return;

    let isSubscribed = true;

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(`/api/containers/${container.id}/logs?tail=${tail}`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed) {
            setLogs(data.logs || 'No logs available');
          }
        }
      } catch (err: any) {
        if (isSubscribed) {
          setLogs(`Failed to fetch logs: ${err.message}`);
        }
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    };

    fetchLogs();

    const interval = setInterval(fetchLogs, 3000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [container, tail]);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!container) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#080d16] border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-semibold">
            <Terminal className="w-4 h-4" />
            <span>Logs: {container.name}</span>
            <span className="text-xs text-slate-500 font-normal">({container.id.slice(0, 12)})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tail selection */}
            <div className="flex items-center gap-1 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded px-2 py-1">
              <span>Lines:</span>
              {[50, 100, 250, 500].map((count) => (
                <button
                  key={count}
                  onClick={() => setTail(count)}
                  className={`px-1.5 rounded hover:text-white transition-colors ${
                    tail === count ? 'text-cyan-400 font-bold bg-slate-800' : ''
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            <button
              onClick={scrollToBottom}
              title="Scroll to bottom"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={copyLogs}
              title="Copy logs"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-rose-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 bg-[#05080e] overflow-y-auto font-mono text-xs text-slate-300 select-text leading-relaxed whitespace-pre-wrap">
          {isLoading && !logs ? (
            <div className="flex items-center gap-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Fetching container log stream...</span>
            </div>
          ) : (
            logs
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer */}
        <div className="px-4 py-2 bg-[#080d16] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Streaming logs (poll 3s)</span>
          </div>
          <div>Image: {container.image}</div>
        </div>

      </div>
    </div>
  );
};
