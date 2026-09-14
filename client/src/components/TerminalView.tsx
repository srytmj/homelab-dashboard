import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface TerminalViewProps {
  target: string;
  onDisconnect: () => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ target, onDisconnect }) => {
  const { token } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'closed'>('connecting');

  useEffect(() => {
    if (!containerRef.current || !token) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 13,
      theme: {
        background: '#101115',
        foreground: '#eef0f4',
      },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal?target=${encodeURIComponent(target)}&token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setStatus('connected');
      const { cols, rows } = terminal;
      ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'error') {
            terminal.writeln(`\r\n\x1b[31m${msg.message}\x1b[0m`);
          }
          return;
        } catch {
          // not a control frame, fall through to raw write
        }
        terminal.write(event.data);
      } else {
        terminal.write(new Uint8Array(event.data));
      }
    };

    ws.onclose = () => setStatus('closed');
    ws.onerror = () => setStatus('closed');

    const dataDisposable = terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      dataDisposable.dispose();
      ws.close();
      terminal.dispose();
    };
  }, [target, token]);

  return (
    <div className="panel flex h-[70vh] flex-col overflow-hidden">
      <div className="panel-head flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[12px]">
          {status === 'connected' ? (
            <Wifi className="h-3.5 w-3.5 text-state-good" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-state-warn" />
          )}
          <span className="font-bold tracking-wider">{target}</span>
          <span className="opacity-75">
            ({status === 'connecting' ? 'connecting…' : status === 'connected' ? 'connected' : 'disconnected'})
          </span>
        </span>
        <button onClick={onDisconnect} className="btn-ghost py-1 text-xs">
          Disconnect
        </button>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 p-2 bg-[#101115]" />
    </div>
  );
};
