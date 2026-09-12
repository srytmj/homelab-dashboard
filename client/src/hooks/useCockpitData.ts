import { useState, useEffect, useRef, useCallback } from 'react';
import { CockpitSnapshot } from '../types.js';

export function useCockpitData() {
  const [snapshot, setSnapshot] = useState<CockpitSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInitialSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/snapshot');
      if (res.ok) {
        const data: CockpitSnapshot = await res.json();
        setSnapshot(data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err: any) {
      console.warn('[useCockpitData] Initial snapshot fetch error:', err.message);
    }
  }, []);

  const connectWs = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`[useCockpitData] Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[useCockpitData] WebSocket connection established');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'SNAPSHOT' && message.data) {
          setSnapshot(message.data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('[useCockpitData] Parse error:', err);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
      setError('Connection disrupted');
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 3 seconds
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWs();
      }, 3000);
    };
  }, []);

  useEffect(() => {
    fetchInitialSnapshot();
    connectWs();

    // Fallback polling every 5s if WS is disconnected
    const pollingInterval = setInterval(() => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        fetchInitialSnapshot();
      }
    }, 5000);

    return () => {
      clearInterval(pollingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [fetchInitialSnapshot, connectWs]);

  return {
    snapshot,
    isConnected,
    lastUpdated,
    error,
    refetch: fetchInitialSnapshot,
  };
}
