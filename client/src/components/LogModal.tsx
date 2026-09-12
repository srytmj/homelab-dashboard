import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, Copy, Check, RefreshCw, ArrowDownToLine } from 'lucide-react';
import { ContainerMetric } from '../types.js';

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
        const res = await fetch(`/api/containers/${container.id}/logs?tail=${tail}`);
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

    return () => {
      isSubscribed = false;
    };
  }, [container, tail]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!container) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-100">{container.name}</span>
                <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                  {container.shortId}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">{container.image}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tail count selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono">
              <span className="text-slate-500 text-[10px]">TAIL:</span>
              {[50, 100, 250].map((num) => (
                <button
                  key={num}
                  onClick={() => setTail(num)}
                  className={`px-1.5 py-0.5 rounded ${
                    tail === num
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Copy button */}
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Copy logs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Scroll bottom */}
            <button
              onClick={scrollToBottom}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Scroll to bottom"
            >
              <ArrowDownToLine className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 bg-[#070b14] font-mono text-xs text-slate-300 overflow-y-auto flex-1 leading-relaxed selection:bg-cyan-500/30 selection:text-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Streaming container logs...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-all font-mono">
              {logs || 'Empty output log.'}
              <div ref={terminalEndRef} />
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0d1424] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Live snapshot tail ({tail} lines)</span>
          <span className="text-slate-400">Press ESC or click ✕ to close</span>
        </div>
      </div>
    </div>
  );
};
