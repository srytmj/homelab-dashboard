import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, RefreshCw, ArrowDownToLine } from 'lucide-react';
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

    return () => {
      isSubscribed = false;
    };
  }, [container, tail]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!container) return null;

  return createPortal(
    <div className="overlay">
      <div className="panel modal-panel flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden shadow-2xl shadow-black/50">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">
              {container.name}
              <span className="ml-2 font-mono text-[11px] font-normal text-cockpit-muted">#{container.shortId}</span>
            </h3>
            <p className="panel-sub font-mono">{container.image}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="seg">
              <span className="label px-2">Tail</span>
              {[50, 100, 250, 500, 1000, 0].map((num) => (
                <button
                  key={num}
                  onClick={() => setTail(num)}
                  className={`seg-btn ${tail === num ? 'seg-btn-on' : ''}`}
                >
                  {num === 0 ? 'All' : num}
                </button>
              ))}
            </div>
            <button onClick={copyToClipboard} className="icon-btn" title="Copy logs">
              {copied ? <Check className="h-4 w-4 animate-popIn text-state-good" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={() => terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="icon-btn"
              title="Jump to latest"
            >
              <ArrowDownToLine className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="icon-btn" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-cockpit-bg px-5 py-4 font-mono text-[12px] leading-relaxed text-cockpit-text">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-cockpit-muted">
              <RefreshCw className="h-4 w-4 animate-spin text-cockpit-accent" />
              <span>Loading logs…</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-all">
              {logs || 'Empty output log.'}
              <div ref={terminalEndRef} />
            </pre>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-cockpit-border px-5 py-2.5 font-mono text-[11px] text-cockpit-muted">
          <span>{tail === 0 ? 'Full log output (all lines)' : `Snapshot of last ${tail} lines`}</span>
          <span>Close with the icon above</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
