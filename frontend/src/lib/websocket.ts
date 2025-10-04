import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onSessionUpdate?: (data: any) => void;
  onQRUpdate?: (data: any) => void;
  onNewMessage?: (data: any) => void;
}

export class WhatsAppWebSocket {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(this.config.url, {
        auth: {
          token: this.config.token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.config.onConnect?.();
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`❌ WebSocket disconnected: ${reason}`);
        this.config.onDisconnect?.(reason);
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.config.onError?.(error);
        reject(error);
      });

      // WhatsApp specific events
      this.socket.on('session_status_update', (data) => {
        console.log('📱 Session status update:', data);
        this.config.onSessionUpdate?.(data);
      });

      this.socket.on('qr_code_update', (data) => {
        console.log('📱 QR code update:', data);
        this.config.onQRUpdate?.(data);
      });

      this.socket.on('new_message', (data) => {
        console.log('💬 New message:', data);
        this.config.onNewMessage?.(data);
      });

      this.socket.on('whatsapp_session_update', (data) => {
        console.log('📱 WhatsApp session update:', data);
        this.config.onSessionUpdate?.(data);
      });

      this.socket.on('whatsapp_qr_update', (data) => {
        console.log('📱 WhatsApp QR update:', data);
        this.config.onQRUpdate?.(data);
      });

      this.socket.on('whatsapp_message', (data) => {
        console.log('💬 WhatsApp message:', data);
        this.config.onNewMessage?.(data);
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  subscribeToSession(sessionName: string) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_session', { sessionName });
      console.log(`🔔 Subscribed to session: ${sessionName}`);
    }
  }

  unsubscribeFromSession(sessionName: string) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_session', { sessionName });
      console.log(`🔕 Unsubscribed from session: ${sessionName}`);
    }
  }

  getSessionsStatus() {
    if (this.socket?.connected) {
      this.socket.emit('get_sessions_status');
      console.log('📊 Requested sessions status');
    }
  }

  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
      console.log('🏓 Ping sent');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default WhatsAppWebSocket;
