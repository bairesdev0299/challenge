import { useState, useCallback, useEffect, useRef } from 'react';
import { useThrottle } from './useThrottle';

interface WebSocketHookOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  throttleDelay?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  throttleDelay = 1000,
  maxRetries = 3,
  retryDelay = 3000,
}: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Clean up any existing connection
    if (wsRef.current) {
      console.log('Cleaning up existing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      console.log('Clearing pending reconnection');
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log(`Connecting to WebSocket (attempt ${retryCountRef.current + 1}/${maxRetries})...`);
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('WebSocket connection established');
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0;
        onOpen?.();
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        if (mountedRef.current && retryCountRef.current < maxRetries) {
          console.log(`Scheduling reconnection attempt ${retryCountRef.current + 1}/${maxRetries} in ${retryDelay}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            retryCountRef.current++;
            connect();
          }, retryDelay);
        } else {
          console.log('Max retries reached, not attempting to reconnect');
          setError('Failed to connect to the game server. Please try again later.');
        }

        onClose?.(event);
      };

      ws.onerror = (event) => {
        if (!mountedRef.current) return;
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
        onError?.(event);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        console.log('WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket message:', data);
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [url, onMessage, onOpen, onClose, onError, maxRetries, retryDelay]);

  const sendMessage = useThrottle((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  }, throttleDelay);

  useEffect(() => {
    console.log('WebSocket hook mounted');
    mountedRef.current = true;
    connect();

    return () => {
      console.log('WebSocket hook unmounting');
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    error,
    sendMessage,
    reconnect: () => {
      console.log('Manual reconnection requested');
      retryCountRef.current = 0;
      connect();
    }
  };
} 