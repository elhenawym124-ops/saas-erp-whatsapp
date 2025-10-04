/**
 * useWebSocket Hook
 * 
 * Custom hook for managing WebSocket connections with Socket.io
 * Features:
 * - Auto-reconnection
 * - Proper cleanup
 * - Session subscription management
 * - Connection state callbacks
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url: string;
  token: string | null;
  sessionName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: (attemptNumber: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for WebSocket connection management
 * 
 * @param options - WebSocket configuration options
 * @returns Socket ref
 */
export const useWebSocket = ({
  url,
  token,
  sessionName,
  onConnect,
  onDisconnect,
  onReconnect,
  onError
}: UseWebSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const currentSessionRef = useRef<string | undefined>(sessionName);

  // Effect for creating/destroying socket connection (only depends on url and token)
  useEffect(() => {
    // Don't connect if no token
    if (!token) {
      console.warn('⚠️ No token provided, skipping WebSocket connection');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');

    // Create socket connection
    const socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected, Socket ID:', socket.id);

      // Re-subscribe to current session on connect
      if (currentSessionRef.current) {
        console.log('📱 Subscribing to session:', currentSessionRef.current);
        socket.emit('subscribe_session', { sessionName: currentSessionRef.current });
      }

      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected, Reason:', reason);
      onDisconnect?.();
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);

      // Re-subscribe to current session on reconnect
      if (currentSessionRef.current) {
        console.log('📱 Re-subscribing to session:', currentSessionRef.current);
        socket.emit('subscribe_session', { sessionName: currentSessionRef.current });
      }

      onReconnect?.(attemptNumber);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed after all attempts');
      const error = new Error('WebSocket reconnection failed');
      onError?.(error);
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      onError?.(error);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      onError?.(error);
    });

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');

      // Unsubscribe from current session before disconnect
      if (currentSessionRef.current && socket.connected) {
        console.log('🏠 Unsubscribing from session:', currentSessionRef.current);
        socket.emit('unsubscribe_session', { sessionName: currentSessionRef.current });
      }

      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, token]); // Only recreate socket when url or token changes

  // Separate effect for handling session changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Unsubscribe from old session
    if (currentSessionRef.current && currentSessionRef.current !== sessionName) {
      if (socket.connected) {
        console.log('🏠 Unsubscribing from old session:', currentSessionRef.current);
        socket.emit('unsubscribe_session', { sessionName: currentSessionRef.current });
      }
    }

    // Subscribe to new session
    if (sessionName && sessionName !== currentSessionRef.current) {
      currentSessionRef.current = sessionName;
      if (socket.connected) {
        console.log('📱 Subscribing to new session:', sessionName);
        socket.emit('subscribe_session', { sessionName });
      }
    }
  }, [sessionName]); // Only run when sessionName changes

  return socketRef;
};

/**
 * Get WebSocket URL based on environment
 * 
 * @returns WebSocket server URL
 */
export const getWebSocketUrl = (): string => {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }
  
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // Use API URL from environment or default
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  return apiUrl;
};

/**
 * Subscribe to a WebSocket session
 * 
 * @param socket - Socket instance
 * @param sessionName - Session name to subscribe to
 */
export const subscribeToSession = (socket: Socket | null, sessionName: string): void => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Cannot subscribe: Socket not connected');
    return;
  }
  
  console.log('📱 Subscribing to session:', sessionName);
  socket.emit('subscribe_session', { sessionName });
};

/**
 * Unsubscribe from a WebSocket session
 * 
 * @param socket - Socket instance
 * @param sessionName - Session name to unsubscribe from
 */
export const unsubscribeFromSession = (socket: Socket | null, sessionName: string): void => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Cannot unsubscribe: Socket not connected');
    return;
  }
  
  console.log('🏠 Unsubscribing from session:', sessionName);
  socket.emit('unsubscribe_session', { sessionName });
};

/**
 * Check if socket is connected
 * 
 * @param socket - Socket instance
 * @returns True if connected
 */
export const isSocketConnected = (socket: Socket | null): boolean => {
  return socket?.connected || false;
};

