/**
 * WhatsApp Types
 * 
 * TypeScript interfaces and types for WhatsApp-related data structures
 * 
 * @module types/whatsapp
 */

/**
 * WhatsApp Contact
 */
export interface Contact {
  id: number;
  phoneNumber: string;
  name?: string;
  jid?: string;
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSeen?: string;
  unreadCount?: number;
  organizationId: number;
  sessionId?: string;
  sessionName?: string;
  isGroup?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * WhatsApp Message
 */
export interface Message {
  id: number;
  messageId: string;
  sessionName: string;
  direction: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document';
  content: string | {
    text?: string;
    caption?: string;
    mediaUrl?: string;
    filename?: string;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  // User tracking fields
  userId?: number;
  repliedByName?: string;
  repliedAt?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

/**
 * WhatsApp Session
 */
export interface Session {
  id: number;
  sessionName: string;
  phoneNumber: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qrCode?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * WhatsApp Conversation
 */
export interface Conversation {
  id: number;
  phoneNumber: string;
  contactName?: string;
  status: 'open' | 'closed' | 'pending';
  assignedTo?: number;
  assignedToName?: string;
  lastMessageAt?: string;
  organizationId: number;
  sessionName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * WhatsApp Note
 */
export interface Note {
  id: number;
  conversationId: number;
  userId: number;
  userName?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * WhatsApp Template
 */
export interface Template {
  id: number;
  name: string;
  content: string;
  category?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * User (for assignment)
 */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  organizationId: number;
}

/**
 * WebSocket Events
 */
export interface WebSocketEvents {
  // Incoming events
  new_message: (data: { message: Message }) => void;
  message_read: (data: { messageId: string; readAt: string }) => void;
  message_status: (data: { messageId: string; status: Message['status'] }) => void;
  user_typing: (data: { contactId: string; isTyping: boolean }) => void;
  session_status: (data: { sessionName: string; status: Session['status'] }) => void;
  
  // Outgoing events
  subscribe_session: (data: { sessionName: string }) => void;
  unsubscribe_session: (data: { sessionName: string }) => void;
  send_typing: (data: { contactId: string; isTyping: boolean }) => void;
  mark_as_read: (data: { messageId: string }) => void;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Form Types
 */
export interface NewChatForm {
  phoneNumber: string;
  name: string;
  message: string;
}

export interface SendMessageForm {
  to: string;
  message: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  filename?: string;
}

/**
 * Filter Types
 */
export interface MessageFilters {
  direction?: 'inbound' | 'outbound' | 'all';
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  status?: Message['status'];
}

export interface ConversationFilters {
  status?: Conversation['status'];
  assignedTo?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Type Guards
 */
export const isContact = (obj: any): obj is Contact => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.phoneNumber === 'string' &&
    typeof obj.organizationId === 'number'
  );
};

export const isMessage = (obj: any): obj is Message => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.messageId === 'string' &&
    typeof obj.sessionName === 'string' &&
    (obj.direction === 'inbound' || obj.direction === 'outbound')
  );
};

export const isSession = (obj: any): obj is Session => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.sessionName === 'string' &&
    typeof obj.phoneNumber === 'string' &&
    (obj.status === 'connected' || obj.status === 'disconnected' || obj.status === 'connecting')
  );
};

export const isConversation = (obj: any): obj is Conversation => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.phoneNumber === 'string' &&
    (obj.status === 'open' || obj.status === 'closed' || obj.status === 'pending')
  );
};

