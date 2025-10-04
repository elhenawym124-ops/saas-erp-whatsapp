/**
 * useMessageHandler Hook
 * 
 * Custom hook for handling WebSocket message events
 * Features:
 * - Proper event listener cleanup
 * - Phone number matching
 * - Message filtering by contact
 * - Typing indicators
 * - Read receipts
 */

import { useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { cleanPhoneNumber } from '@/lib/whatsappHelpers';

// Type definitions
interface Message {
  id?: number;
  messageId: string;
  content: string | any;
  body?: string;
  direction: 'inbound' | 'outbound';
  fromNumber?: string;
  toNumber?: string;
  from?: string;
  to?: string;
  phoneNumber?: string;
  messageType?: string;
  status?: string;
  sentAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseMessageHandlerOptions {
  socket: Socket | null;
  selectedContactId: string | null;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string, readAt: string) => void;
  onTyping?: (isTyping: boolean, contactId: string) => void;
  onMessageStatus?: (messageId: string, status: string) => void;
  onNewContact?: (contact: any) => void;
}

/**
 * Custom hook for handling WebSocket message events
 * 
 * @param options - Message handler configuration
 */
export const useMessageHandler = ({
  socket,
  selectedContactId,
  onNewMessage,
  onMessageRead,
  onTyping,
  onMessageStatus,
  onNewContact
}: UseMessageHandlerOptions) => {
  
  /**
   * Handle new message event
   */
  const handleNewMessage = useCallback((data: any) => {
    console.log('🎧 useMessageHandler: new_message event received', {
      hasMessage: !!data.message,
      sessionId: data.sessionId,
      timestamp: data.timestamp,
      rawData: data
    });

    if (!data.message) {
      console.log('⏭️ Skipping message: no message data');
      return;
    }

    console.log('📨 New message received:', {
      messageId: data.message.messageId,
      fromNumber: data.message.fromNumber,
      toNumber: data.message.toNumber,
      direction: data.message.direction,
      messageType: data.message.messageType,
      content: typeof data.message.content === 'string'
        ? data.message.content.substring(0, 50)
        : data.message.content
    });
    
    // If no contact selected, still call callback (for notifications, etc.)
    if (!selectedContactId) {
      console.log('⏭️ No contact selected, but calling callback');
      onNewMessage?.(data.message);
      return;
    }
    
    // Clean phone numbers for comparison
    const messageFrom = cleanPhoneNumber(
      data.message.fromNumber || 
      data.message.from || 
      data.message.phoneNumber || 
      ''
    );
    
    const messageTo = cleanPhoneNumber(
      data.message.toNumber || 
      data.message.to || 
      ''
    );
    
    const contactNumber = cleanPhoneNumber(selectedContactId);
    
    // Check if message is from/to selected contact
    const isFromContact = messageFrom === contactNumber;
    const isToContact = messageTo === contactNumber;
    
    if (isFromContact || isToContact) {
      console.log('✅ Message is from/to selected contact, adding to list');
      onNewMessage?.(data.message);
    } else {
      console.log('⏭️ Message is not from/to selected contact, skipping');
      console.log('  Message from:', messageFrom);
      console.log('  Message to:', messageTo);
      console.log('  Selected contact:', contactNumber);
    }
  }, [selectedContactId, onNewMessage]);
  
  /**
   * Handle message read event
   */
  const handleMessageRead = useCallback((data: any) => {
    console.log('👁️ Message read:', data);
    
    if (data.messageId && data.readAt) {
      onMessageRead?.(data.messageId, data.readAt);
    }
  }, [onMessageRead]);
  
  /**
   * Handle typing indicator event
   */
  const handleTyping = useCallback((data: any) => {
    if (!data.contactId) {
      console.log('⏭️ Skipping typing event: no contactId');
      return;
    }
    
    const typingContactNumber = cleanPhoneNumber(data.contactId);
    const selectedNumber = cleanPhoneNumber(selectedContactId || '');
    
    if (typingContactNumber === selectedNumber) {
      console.log('⌨️ Contact is typing');
      onTyping?.(true, data.contactId);
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        onTyping?.(false, data.contactId);
      }, 3000);
    }
  }, [selectedContactId, onTyping]);
  
  /**
   * Handle message status update event
   */
  const handleMessageStatus = useCallback((data: any) => {
    console.log('📊 Message status update:', data);
    
    if (data.messageId && data.status) {
      onMessageStatus?.(data.messageId, data.status);
    }
  }, [onMessageStatus]);
  
  /**
   * Handle session status event
   */
  const handleSessionStatus = useCallback((data: any) => {
    console.log('📡 Session status update:', data);
    // Can be used to update UI when session connects/disconnects
  }, []);

  /**
   * Handle new contact event
   */
  const handleNewContact = useCallback((data: any) => {
    if (!data.contact) {
      console.log('⏭️ Skipping new contact event: no contact data');
      return;
    }

    console.log('📱 New contact created:', data);
    onNewContact?.(data.contact);
  }, [onNewContact]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    if (!socket) {
      console.log('⏳ Socket not ready, skipping event listeners');
      return;
    }

    console.log('📡 Setting up message event listeners');

    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleTyping);
    socket.on('message_status', handleMessageStatus);
    socket.on('session_status', handleSessionStatus);
    socket.on('new_contact', handleNewContact);
    socket.on('whatsapp_contact_created', handleNewContact);

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      console.log('🧹 Cleaning up message event listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing', handleTyping);
      socket.off('message_status', handleMessageStatus);
      socket.off('session_status', handleSessionStatus);
      socket.off('new_contact', handleNewContact);
      socket.off('whatsapp_contact_created', handleNewContact);
    };
  }, [
    socket,
    handleNewMessage,
    handleMessageRead,
    handleTyping,
    handleMessageStatus,
    handleSessionStatus,
    handleNewContact
  ]);
};

/**
 * Emit typing event to server
 * 
 * @param socket - Socket instance
 * @param sessionId - Session ID
 * @param contactId - Contact phone number
 */
export const emitTyping = (
  socket: Socket | null, 
  sessionId: string, 
  contactId: string
): void => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Cannot emit typing: Socket not connected');
    return;
  }
  
  socket.emit('typing', {
    sessionId,
    contactId
  });
};

/**
 * Emit mark as read event to server
 * 
 * @param socket - Socket instance
 * @param messageId - Message ID
 * @param sessionId - Session ID
 */
export const emitMarkAsRead = (
  socket: Socket | null,
  messageId: string,
  sessionId: string
): void => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Cannot mark as read: Socket not connected');
    return;
  }
  
  socket.emit('mark_as_read', {
    messageId,
    sessionId
  });
};

