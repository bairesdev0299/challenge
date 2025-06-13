'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: any) => void;
  addMessageHandler: (handler: (message: any) => void) => void;
  removeMessageHandler: (handler: (message: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageHandlersRef = useRef<((message: any) => void)[]>([]);
  const isConnectingRef = useRef(false);

  const handleMessage = useCallback((data: any) => {
    console.log('WebSocket message received:', data);
    messageHandlersRef.current.forEach(handler => handler(data));
  }, []);

  const handleOpen = useCallback(() => {
    console.log('WebSocket connection established');
    setIsConnected(true);
    setError(null);
    isConnectingRef.current = false;
  }, []);

  const handleClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setError('Connection error occurred');
    isConnectingRef.current = false;
  }, []);

  const { sendMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/ws',
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    onError: handleError,
  });

  const addMessageHandler = useCallback((handler: (message: any) => void) => {
    messageHandlersRef.current.push(handler);
  }, []);

  const removeMessageHandler = useCallback((handler: (message: any) => void) => {
    messageHandlersRef.current = messageHandlersRef.current.filter(h => h !== handler);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        error,
        sendMessage,
        addMessageHandler,
        removeMessageHandler,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
} 