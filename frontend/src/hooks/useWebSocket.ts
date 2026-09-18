import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (onMessageReceived?: (msg: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const onMessageRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      // Prefer direct backend port 8000 for zero-proxy WebSocket stability
      const wsUrl = `${protocol}//${host}:8000/ws/events`;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WeatherPulse WS] Connected to live meteorological stream.');
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onMessageRef.current) {
            onMessageRef.current(parsed);
          }
        } catch (err) {
          console.error('[WeatherPulse WS] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WeatherPulse WS] Connection closed. Retrying in 3s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[WeatherPulse WS] Socket error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('[WeatherPulse WS] Failed to initialize socket:', e);
    }
  }, []); // Stable callback with zero dependencies

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { isConnected, lastMessage };
};
