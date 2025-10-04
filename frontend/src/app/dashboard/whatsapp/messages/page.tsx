'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import {
  FiSend,
  FiPaperclip,
  FiImage,
  FiFile,
  FiFileText,
  FiVideo,
  FiMic,
  FiSearch,
  FiMoreVertical,
  FiPlus,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiArrowDown,
  FiStar,
  FiTrash2
} from 'react-icons/fi';
import { BsWhatsapp, BsCheckAll, BsCheck } from 'react-icons/bs';
import {
  formatTime,
  cleanPhoneNumber,
  phoneNumbersMatch,
  parseMessageContent,
  getSessionName,
  setSessionName as saveSessionName,
} from '@/lib/whatsappHelpers';
import { apiClient, API_ENDPOINTS, getAxiosConfig } from '@/lib/api';
import { useAuth } from '@/middleware/auth';
// ✅ Import new custom hooks
import { useWebSocket, getWebSocketUrl } from '@/hooks/useWebSocket';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { getToken } from '@/utils/tokenUtils';
// ✅ Import message utilities for deduplication and sorting
import {
  deduplicateMessages,
  sortMessagesByTime,
  addMessage,
  mergeMessages,
  getMessageContent,
  getMessageId,
  validateMessageId
} from '@/utils/messageUtils';
// ✅ Import validation utilities
import {
  isValidContact,
  isValidMessage,
  isValidSession,
  isValidConversation,
  validatePhoneNumber,
  validateArray,
  isGroupContact,
  getDisplayName
} from '@/utils/validation';
// ✅ Import debounce hook
import { useDebounce } from '@/hooks/useDebounce';
// ✅ Import dark mode hook
import { useDarkMode } from '@/hooks/useDarkMode';
// ✅ Import date utilities
import { groupMessagesByDate } from '@/utils/dateUtils';
// ✅ Import loading skeletons
import { MessagesListSkeleton, ContactsListSkeleton } from '@/components/LoadingSkeleton';
// ✅ Import search utilities
import { getHighlightedHTML } from '@/utils/searchUtils';
// ✅ Import notification system
import { NotificationSystem } from '@/components/NotificationSystem';

// ✅ تحديث Interface لتطابق Backend مع User Info
interface Message {
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
  // ✅ User tracking fields
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

interface Contact {
  id: number;
  phoneNumber: string;
  name?: string;
  profilePicUrl?: string;
  lastMessageAt?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  jid?: string;
  isGroup?: boolean;
}

export default function WhatsAppMessagesPage() {
  // ✅ State Management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Message Search & Filter States
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  // ✅ Contacts tab state (Regular vs Groups)
  const [contactsTab, setContactsTab] = useState<'regular' | 'groups'>('regular');

  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'delivered' | 'sent' | 'pending' | 'failed'>('all');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // ✅ Debounce search query to reduce re-renders
  const debouncedSearchQuery = useDebounce(messageSearchQuery, 300);

  // ✅ Pagination States
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const MESSAGES_PER_PAGE = 50;

  // ✅ Conversation Management States
  const [users, setUsers] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any>(null);

  // ✅ Notes States
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  // ✅ File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // ✅ Templates States
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // ✅ Starred Messages State
  const [starredMessages, setStarredMessages] = useState<Set<number>>(new Set());

  // ✅ Loading & Error States
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ UI States
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [newChatForm, setNewChatForm] = useState({
    phoneNumber: '',
    name: ''
  });

  // ✅ Debug/Test States - معلومات الطلب للتشخيص
  const [requestInfo, setRequestInfo] = useState<{
    url: string;
    token: string;
    timestamp: string;
    statusCode: number | null;
  } | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // ✅ Session State - مع Auto-detection
  const [sessionName, setSessionName] = useState<string>('');
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deleteMenuRef = useRef<HTMLDivElement>(null);

  // ✅ التحقق من تسجيل الدخول
  useAuth();

  // ✅ Dark Mode
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // ✅ Auto-detect active session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🔄 Initializing session auto-detection...');

        // 1. جلب الجلسات المتاحة
        const response = await apiClient.get(API_ENDPOINTS.WHATSAPP.SESSIONS);
        console.log('📡 Sessions API response:', response.data);

        // ✅ Backend يعيد data مباشرة كـ array أو object
        const sessions = response.data.data?.sessions || response.data.data || [];
        console.log('📊 Parsed sessions:', sessions);
        setAvailableSessions(sessions);

        // 2. البحث عن جلسة نشطة
        const connectedSessions = sessions.filter((s: any) => s.status === 'connected');
        console.log('✅ Connected sessions:', connectedSessions);

        if (connectedSessions.length === 0) {
          console.warn('⚠️ No connected sessions found');
          setSessionError('⚠️ لا توجد جلسات WhatsApp نشطة. يرجى إنشاء جلسة جديدة.');
          return;
        }

        // 3. محاولة استخدام الجلسة المحفوظة
        const savedSessionName = getSessionName();
        console.log('💾 Saved session name from localStorage:', savedSessionName);

        if (savedSessionName) {
          const savedSession = connectedSessions.find((s: any) => s.sessionName === savedSessionName);
          if (savedSession) {
            setSessionName(savedSessionName);
            console.log('✅ Using saved session:', savedSessionName);
            return;
          }
        }

        // 4. استخدام أول جلسة نشطة
        const firstSession = connectedSessions[0];
        console.log('🎯 Auto-selecting first session:', firstSession);
        setSessionName(firstSession.sessionName);
        saveSessionName(firstSession.sessionName);
        console.log('✅ Auto-selected first active session:', firstSession.sessionName);

      } catch (error: any) {
        console.error('❌ Error fetching sessions:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        setSessionError('❌ فشل تحميل الجلسات. يرجى تحديث الصفحة.');
      }
    };

    initializeSession();
  }, []);

  // ✅ Close delete menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteMenu]);

  // ✅ Initialize WebSocket connection using custom hook
  const socketRef = useWebSocket({
    url: getWebSocketUrl(),
    token: getToken(),
    sessionName: sessionName,
    onConnect: () => {
      console.log('✅ WebSocket connected via useWebSocket hook');
    },
    onDisconnect: () => {
      console.log('❌ WebSocket disconnected via useWebSocket hook');
    },
    onReconnect: (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
    },
    onError: (error) => {
      console.error('❌ WebSocket error:', error.message);
    }
  });

  // ✅ Fetch initial data on mount
  useEffect(() => {
    fetchContacts();
    fetchUsers();
    fetchTemplates();
  }, []);

  // ✅ Handle notification click - navigate to conversation
  const handleNotificationClick = useCallback((notification: any) => {
    console.log('🔔 Notification clicked:', notification);

    if (notification.phoneNumber) {
      // Find contact by phone number
      const contact = contacts.find(c =>
        cleanPhoneNumber(c.phoneNumber) === cleanPhoneNumber(notification.phoneNumber)
      );

      if (contact) {
        setSelectedContact(contact);
        console.log('✅ Navigated to contact:', contact.phoneNumber);
      }
    }
  }, [contacts]);

  // ✅ Handle new messages using custom hook with deduplication
  const handleNewMessage = useCallback((message: any) => {
    console.log('📨 New message received in handler:', message);

    // Validate message ID before processing
    const messageId = getMessageId(message);
    if (!validateMessageId(messageId)) {
      console.warn('⚠️ Received message with invalid ID, skipping:', message);
      return;
    }

    // Add message to state using utility function (handles deduplication and sorting)
    setMessages((prevMessages) => {
      const updated = addMessage(prevMessages, message);

      if (updated.length === prevMessages.length) {
        console.log('⏭️ Message already exists, skipping:', messageId);
      } else {
        console.log('✅ Message added to state:', messageId);
        console.log('📊 Total messages now:', updated.length);
      }

      return updated;
    });

    // Update contact list with latest message OR add new contact if not exists
    setContacts((prevContacts) => {
      const messageFrom = cleanPhoneNumber(message.fromNumber || message.from || '');
      const messageTo = cleanPhoneNumber(message.toNumber || message.to || '');

      // For inbound messages, check if contact exists
      if (message.direction === 'inbound' && messageFrom) {
        const contactExists = prevContacts.some(
          (c) => cleanPhoneNumber(c.phoneNumber) === messageFrom
        );

        // If contact doesn't exist, create a temporary one
        // (The backend should also create it and send via WebSocket)
        if (!contactExists) {
          console.log('📱 Creating temporary contact for new message from:', messageFrom);
          const incomingJid = (message.fromNumber || message.from || '') as string;
          const inferredIsGroup = typeof incomingJid === 'string' && incomingJid.includes('@g.us');
          const inferredJid = inferredIsGroup
            ? incomingJid
            : `${messageFrom}@s.whatsapp.net`;

          const newContact: Contact = {
            id: Date.now(), // Temporary ID
            phoneNumber: messageFrom,
            name: messageFrom,
            jid: inferredJid,
            // Frontend-only temporary contact; backend will send full contact later
            isGroup: inferredIsGroup as any,
            lastMessage: getMessageContent(message) as any,
            lastMessageTime: (message.timestamp || message.sentAt || new Date().toISOString()) as any,
            lastSeen: new Date().toISOString() as any,
          } as any;

          return [newContact, ...prevContacts];
        }
      }

      // Update existing contact with latest message
      return prevContacts.map((contact) => {
        const contactNumber = cleanPhoneNumber(contact.phoneNumber);

        if (messageFrom === contactNumber || messageTo === contactNumber) {
          return {
            ...contact,
            lastMessage: getMessageContent(message),
            lastMessageTime: message.timestamp || message.sentAt || new Date().toISOString(),
          };
        }
        return contact;
      });
    });
  }, [sessionName]);

  // ✅ Handle new contact creation
  const handleNewContact = useCallback((contact: Contact) => {
    console.log('📱 New contact received via WebSocket:', contact);

    // Check if contact already exists
    setContacts((prevContacts) => {
      const exists = prevContacts.some(
        (c) => c.phoneNumber === contact.phoneNumber || c.id === contact.id
      );

      if (exists) {
        console.log('⏭️ Contact already exists, skipping:', contact.phoneNumber);
        return prevContacts;
      }

      console.log('✅ Adding new contact to list:', contact.phoneNumber);
      // Add new contact to the beginning of the list
      return [contact, ...prevContacts];
    });
  }, []);

  // ✅ Use message handler hook
  useMessageHandler({
    socket: socketRef.current,
    selectedContactId: selectedContact?.phoneNumber || null,
    onNewMessage: handleNewMessage,
    onMessageRead: (messageId, readAt) => {
      console.log('👁️ Message read:', messageId, readAt);
      // Update message status in state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.messageId === messageId ? { ...msg, status: 'read', readAt } : msg
        )
      );
    },
    onTyping: (isTyping, contactId) => {
      console.log('⌨️ Typing indicator:', isTyping, contactId);
      // Can be used to show typing indicator in UI
    },
    onMessageStatus: (messageId, status) => {
      console.log('📊 Message status update:', messageId, status);
      // Update message status in state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.messageId === messageId ? { ...msg, status: status as any } : msg
        )
      );
    },
    onNewContact: handleNewContact
  });

  // ✅ Fetch messages when contact changes
  useEffect(() => {
    if (selectedContact) {
      console.log('👤 Selected contact changed:', selectedContact);
      // Use jid for groups, phoneNumber for regular contacts
      const contactId = isGroupContact(selectedContact) && selectedContact.jid
        ? selectedContact.jid
        : selectedContact.phoneNumber;
      fetchMessages(contactId, 1, false);
      fetchCurrentConversation(contactId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact?.phoneNumber, selectedContact?.jid]); // Depend on both phoneNumber and jid

  useEffect(() => {
    console.log('📊 Messages state updated:', messages.length, 'messages');
    scrollToBottom();
  }, [messages]);

  // ✅ Fetch notes when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchNotes(currentConversation.id);
    } else {
      setNotes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversation?.id]); // Only depend on id to avoid unnecessary re-renders

  // ✅ Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="بحث"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Esc: Clear search or close modals
      if (e.key === 'Escape') {
        setSearchQuery('');
        setShowNewChatModal(false);
        setError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ Toggle Star Message
  const toggleStarMessage = (messageId: number) => {
    setStarredMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      // Save to localStorage
      localStorage.setItem('starredMessages', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // ✅ Load starred messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('starredMessages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStarredMessages(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse starred messages:', e);
      }
    }
  }, []);

  // ✅ Delete Message (local only - no backend call)
  const deleteMessage = (messageId: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      // Remove from starred if exists
      if (starredMessages.has(messageId)) {
        toggleStarMessage(messageId);
      }
    }
  };

  // ✅ Fetch Contacts with JWT Authentication and validation (memoized)
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(API_ENDPOINTS.WHATSAPP.CONTACTS);

      const rawContacts = response.data.data.contacts || [];
      console.log('✅ Contacts loaded:', rawContacts.length);

      // ✅ Validate contacts before setting state
      const validContacts = validateArray(rawContacts, isValidContact);
      console.log(`✅ Valid contacts: ${validContacts.length}/${rawContacts.length}`);

      setContacts(validContacts);
    } catch (error: any) {
      console.error('❌ Error fetching contacts:', error);

      if (error.response?.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setError('فشل في تحميل جهات الاتصال');
        setLastFailedAction(() => fetchContacts);
      }
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - only called once on mount

  // ✅ Fetch Messages with JWT Authentication, validation, deduplication, and pagination (memoized)
  const fetchMessages = useCallback(async (contactId: string, page: number = 1, append: boolean = false) => {
    try {
      setLoadingMessages(true);
      setError(null);

      // ✅ تسجيل معلومات الطلب للتشخيص
      const token = getToken();
      const url = `${API_ENDPOINTS.WHATSAPP.MESSAGES}?contact=${contactId}&page=${page}&limit=${MESSAGES_PER_PAGE}`;
      const timestamp = new Date().toISOString();

      console.log(`📥 Fetching messages for contact: ${contactId}, page: ${page}`);
      console.log('🔍 Request details:', {
        url,
        contactId,
        token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        timestamp,
      });

      // ✅ حفظ معلومات الطلب
      setRequestInfo({
        url,
        token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        timestamp,
        statusCode: null,
      });

      const response = await apiClient.get(
        `${API_ENDPOINTS.WHATSAPP.MESSAGES}?contact=${contactId}&page=${page}&limit=${MESSAGES_PER_PAGE}`
      );

      // ✅ تحديث Status Code
      setRequestInfo((prev) => (prev ? { ...prev, statusCode: 200 } : null));

      const rawMessages = response.data.data.messages || [];
      const totalMessages = response.data.data.total || rawMessages.length;
      const pagination = response.data.data.pagination || {
        page,
        limit: MESSAGES_PER_PAGE,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / MESSAGES_PER_PAGE),
      };

      console.log(`✅ Messages loaded: ${rawMessages.length}, total: ${totalMessages}`);
      console.log('📊 Pagination:', pagination);

      // ✅ Validate messages before processing
      const validMessages = validateArray(rawMessages, isValidMessage);
      console.log(`✅ Valid messages: ${validMessages.length}/${rawMessages.length}`);

      // ✅ Deduplicate and sort messages before setting state
      const deduplicated = deduplicateMessages(validMessages);
      const sorted = sortMessagesByTime(deduplicated);

      console.log(`✅ After deduplication and sorting: ${sorted.length} messages`);

      // ✅ Append or replace messages
      if (append) {
        setMessages(prev => {
          const combined = [...prev, ...sorted];
          return sortMessagesByTime(deduplicateMessages(combined));
        });
      } else {
        setMessages(sorted);
        setMessagePage(1);
      }

      // ✅ Check if there are more messages
      setHasMoreMessages(rawMessages.length === MESSAGES_PER_PAGE);
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);

      // ✅ تحديث Status Code في حالة الخطأ
      setRequestInfo((prev) => (prev ? { ...prev, statusCode: error.response?.status || 500 } : null));

      if (error.response?.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setError('فشل في تحميل الرسائل');
      }
    } finally {
      setLoadingMessages(false);
    }
  }, [MESSAGES_PER_PAGE]); // No dependencies - uses parameters

  // ✅ Load more messages function
  const loadMoreMessages = useCallback(() => {
    if (selectedContact && hasMoreMessages && !loadingMessages) {
      const contactId = isGroupContact(selectedContact) && selectedContact.jid
        ? selectedContact.jid
        : selectedContact.phoneNumber;
      const nextPage = messagePage + 1;
      console.log(`📥 Loading more messages, page: ${nextPage}`);
      setMessagePage(nextPage);
      fetchMessages(contactId, nextPage, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact?.phoneNumber, selectedContact?.jid, hasMoreMessages, loadingMessages, messagePage]);

  // ✅ Fetch Users for Assignment (memoized)
  // TODO: Implement users endpoint in backend
  const fetchUsers = useCallback(async () => {
    try {
      // Temporarily disabled - endpoint not implemented yet
      // const response = await apiClient.get(API_ENDPOINTS.USERS.LIST);
      // console.log('✅ Users loaded:', response.data.data?.length || 0);
      // setUsers(response.data.data || []);
      console.log('⚠️ Users endpoint not implemented yet');
      setUsers([]);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
    }
  }, []);

  // ✅ Fetch Current Conversation (memoized)
  const fetchCurrentConversation = useCallback(async (contactId: string) => {
    try {
      // For groups, use jid parameter; for regular contacts, use phoneNumber
      const isGroup = contactId.includes('@g.us');
      const queryParam = isGroup ? `jid=${contactId}` : `phoneNumber=${contactId}`;
      const response = await apiClient.get(`${API_ENDPOINTS.WHATSAPP.CONVERSATIONS}?${queryParam}`);
      const conversations = response.data.data.conversations || [];
      if (conversations.length > 0) {
        setCurrentConversation(conversations[0]);
      } else {
        setCurrentConversation(null);
      }
    } catch (error: any) {
      console.error('❌ Error fetching conversation:', error);
      setCurrentConversation(null);
    }
  }, []);

  // ✅ Assign Conversation
  const assignConversation = async (userId: number) => {
    if (!currentConversation) return;

    try {
      await apiClient.post(
        API_ENDPOINTS.WHATSAPP.ASSIGN_CONVERSATION(currentConversation.id),
        { userId }
      );

      // Update UI
      setCurrentConversation({ ...currentConversation, assignedTo: userId });
      console.log('✅ Conversation assigned successfully');
    } catch (error: any) {
      console.error('❌ Error assigning conversation:', error);
      setError('فشل في تعيين المحادثة');
    }
  };

  // ✅ Update Conversation Status
  const updateConversationStatus = async (status: string) => {
    if (!currentConversation) return;

    try {
      await apiClient.patch(
        API_ENDPOINTS.WHATSAPP.UPDATE_CONVERSATION_STATUS(currentConversation.id),
        { status }
      );

      // Update UI
      setCurrentConversation({ ...currentConversation, status });
      console.log('✅ Conversation status updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating conversation status:', error);
      setError('فشل في تحديث حالة المحادثة');
    }
  };

  // ✅ Fetch Notes (memoized)
  const fetchNotes = useCallback(async (conversationId: number) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.WHATSAPP.CONVERSATION_NOTES(conversationId.toString())
      );
      console.log('✅ Notes loaded:', response.data.data?.length || 0);
      setNotes(response.data.data || []);
    } catch (error: any) {
      console.error('❌ Error fetching notes:', error);
      setNotes([]);
    }
  }, []);

  // ✅ Add Note
  const addNote = async () => {
    if (!newNote.trim() || !currentConversation) return;

    try {
      await apiClient.post(
        API_ENDPOINTS.WHATSAPP.CONVERSATION_NOTES(currentConversation.id.toString()),
        { note: newNote }
      );

      setNewNote('');
      fetchNotes(currentConversation.id);
      console.log('✅ Note added successfully');
    } catch (error: any) {
      console.error('❌ Error adding note:', error);
      setError('فشل في إضافة الملاحظة');
    }
  };

  // ✅ Fetch Templates (memoized)
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEMPLATES.LIST);
      console.log('✅ Templates loaded:', response.data.data?.templates?.length || 0);
      setTemplates(response.data.data?.templates || []);
    } catch (error: any) {
      console.error('❌ Error fetching templates:', error);
      setTemplates([]);
    }
  }, []);

  // ✅ Use Template
  const useTemplate = async (template: any) => {
    try {
      // Set message text to template content
      setMessageText(template.content);
      setShowTemplates(false);

      // Increment usage count
      await apiClient.post(API_ENDPOINTS.TEMPLATES.USE(template.id.toString()));
      console.log('✅ Template used:', template.name);
    } catch (error: any) {
      console.error('❌ Error using template:', error);
    }
  };

  // ✅ Handle File Selection (memoized)
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  // ✅ Clear Selected File
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // ✅ Send Message with JWT Authentication & Dynamic sessionName + Optimistic UI (memoized)
  const sendMessage = useCallback(async () => {
    if (!selectedContact || (!messageText.trim() && !selectedFile)) return;

    setSending(true);
    setError(null);

    // ✅ تنظيف رقم الهاتف قبل الإرسال
    const cleanedPhoneNumber = cleanPhoneNumber(selectedContact.phoneNumber);

    // ✅ Optimistic UI: Create temporary message
    const tempMessage: any = {
      id: Date.now(), // Temporary ID
      messageId: `temp_${Date.now()}`,
      direction: 'outbound' as const,
      content: messageText,
      status: 'pending' as const,
      sentAt: new Date().toISOString(),
      fromNumber: sessionName,
      toNumber: cleanedPhoneNumber,
      messageType: 'text' as const,
      sessionName: sessionName,
      organizationId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // ✅ Add message optimistically
    setMessages(prev => [...prev, tempMessage as Message]);
    const optimisticText = messageText;
    setMessageText(''); // Clear input immediately

    try {
      if (selectedFile) {
        // Upload file first
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('sessionName', sessionName);
        formData.append('to', cleanedPhoneNumber); // ✅ استخدام الرقم المنظف
        if (optimisticText.trim()) {
          formData.append('caption', optimisticText);
        }

        // Determine endpoint based on file type
        let endpoint = API_ENDPOINTS.WHATSAPP.SEND_DOCUMENT;
        if (selectedFile.type.startsWith('image/')) {
          endpoint = API_ENDPOINTS.WHATSAPP.SEND_IMAGE;
        } else if (selectedFile.type.startsWith('video/')) {
          endpoint = API_ENDPOINTS.WHATSAPP.SEND_VIDEO;
        } else if (selectedFile.type.startsWith('audio/')) {
          endpoint = API_ENDPOINTS.WHATSAPP.SEND_AUDIO;
        }

        const response = await apiClient.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('✅ File sent successfully:', response.data);

        // ✅ Update temp message with real data (with fallback)
        if (response.data.data?.message) {
          setMessages(prev => prev.map(msg =>
            msg.messageId === tempMessage.messageId
              ? { ...response.data.data.message, status: 'sent' }
              : msg
          ));
        } else if (response.data.data?.messageId) {
          // Fallback: Backend أرجع messageId فقط
          setMessages(prev => prev.map(msg =>
            msg.messageId === tempMessage.messageId
              ? { ...msg, messageId: response.data.data.messageId, status: 'sent' }
              : msg
          ));
        }

        clearSelectedFile();
      } else {
        // Send text message
        const response = await apiClient.post(
          API_ENDPOINTS.WHATSAPP.SEND_MESSAGE,
          {
            sessionName: sessionName,
            to: cleanedPhoneNumber, // ✅ استخدام الرقم المنظف
            text: optimisticText,
          }
        );

        console.log('✅ Message sent:', response.data);

        // ✅ Update temp message with real data (with fallback)
        if (response.data.data?.message) {
          // Backend أرجع message كاملة
          setMessages(prev => prev.map(msg =>
            msg.messageId === tempMessage.messageId
              ? { ...response.data.data.message, status: 'sent' }
              : msg
          ));
        } else if (response.data.data?.messageId) {
          // Fallback: Backend أرجع messageId فقط
          setMessages(prev => prev.map(msg =>
            msg.messageId === tempMessage.messageId
              ? { ...msg, messageId: response.data.data.messageId, status: 'sent' }
              : msg
          ));
        }
      }

      // Refresh messages to get server state
      const contactId = isGroupContact(selectedContact) && selectedContact.jid
        ? selectedContact.jid
        : selectedContact.phoneNumber;
      await fetchMessages(contactId, 1, false);
    } catch (error: any) {
      console.error('❌ Error sending message:', error);

      // ✅ Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.messageId !== tempMessage.messageId));
      setMessageText(optimisticText); // Restore text

      if (error.response?.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setError(error.response?.data?.message || 'فشل إرسال الرسالة');
        setLastFailedAction(() => sendMessage);
      }
    } finally {
      setSending(false);
    }
  }, [selectedContact, messageText, selectedFile, sessionName, fetchMessages]);

  // ✅ Delete Conversation
  const deleteConversation = useCallback(async () => {
    if (!selectedContact) return;

    // ✅ Confirmation dialog
    const messageCount = messages.length;
    const confirmMessage = `هل أنت متأكد من حذف جميع الرسائل (${messageCount} رسالة) مع ${getDisplayName(selectedContact)}؟\n\nهذا الإجراء لا يمكن التراجع عنه.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      setSending(true); // استخدام sending state للـ loading

      const response = await apiClient.delete(
        `${API_ENDPOINTS.WHATSAPP.DELETE_CONVERSATION}?phoneNumber=${selectedContact.phoneNumber}`
      );

      if (response.data.success) {
        console.log('✅ Conversation deleted:', response.data.data);

        // ✅ تحديث UI - إزالة جميع الرسائل
        setMessages([]);

        // ✅ تحديث آخر رسالة في قائمة جهات الاتصال
        setContacts(prev => prev.map(contact =>
          contact.phoneNumber === selectedContact.phoneNumber
            ? { ...contact, lastMessage: '', lastMessageTime: undefined }
            : contact
        ));

        // ✅ عرض رسالة نجاح
        alert(`✅ تم حذف ${response.data.data.deletedCount} رسالة بنجاح`);
      }
    } catch (error: any) {
      console.error('❌ Error deleting conversation:', error);
      setError(error.response?.data?.message || 'فشل حذف المحادثة');
    } finally {
      setSending(false);
    }
  }, [selectedContact, messages.length]);

  // ✅ Delete Chat (Messages + Contact)
  const deleteChat = useCallback(async () => {
    if (!selectedContact) return;

    // ✅ Confirmation dialog
    const messageCount = messages.length;
    const confirmMessage = `هل أنت متأكد من حذف الدردشة كاملة (${messageCount} رسالة + جهة الاتصال) مع ${getDisplayName(selectedContact)}؟\n\nهذا الإجراء لا يمكن التراجع عنه وسيتم حذف جهة الاتصال من القائمة.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      setSending(true);

      const response = await apiClient.delete(
        `${API_ENDPOINTS.WHATSAPP.DELETE_CHAT}?phoneNumber=${selectedContact.phoneNumber}`
      );

      if (response.data.success) {
        console.log('✅ Chat deleted:', response.data.data);

        // ✅ تحديث UI - إزالة جميع الرسائل
        setMessages([]);

        // ✅ إزالة جهة الاتصال من القائمة
        setContacts(prev => prev.filter(contact =>
          contact.phoneNumber !== selectedContact.phoneNumber
        ));

        // ✅ إلغاء تحديد جهة الاتصال
        setSelectedContact(null);

        // ✅ عرض رسالة نجاح
        alert(`✅ ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error deleting chat:', error);
      setError(error.response?.data?.message || 'فشل حذف الدردشة');
    } finally {
      setSending(false);
    }
  }, [selectedContact, messages.length]);

  // ✅ Create New Contact with JWT Authentication
  const createNewContact = async () => {
    if (!newChatForm.phoneNumber.trim()) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }

    try {
      setError(null);
      const response = await apiClient.post(
        API_ENDPOINTS.WHATSAPP.CONTACTS,
        {
          phoneNumber: newChatForm.phoneNumber,
          name: newChatForm.name || newChatForm.phoneNumber,
          sessionName: sessionName // ✅ استخدام sessionName الديناميكي
        }
      );

      if (response.data.success) {
        console.log('✅ Contact created:', response.data.data);
        const newContact = response.data.data;
        setContacts(prev => [newContact, ...prev]);
        setSelectedContact(newContact);
        setShowNewChatModal(false);
        setNewChatForm({ phoneNumber: '', name: '' });
      }
    } catch (error: any) {
      console.error('❌ Error creating contact:', error);

      if (error.response?.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setError(error.response?.data?.message || 'فشل في إنشاء جهة الاتصال');
      }
    }
  };

  // ✅ Send File with JWT Authentication
  const sendFile = async (type: 'image' | 'document' | 'video' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';

    const accept = {
      image: 'image/*',
      document: '.pdf,.doc,.docx,.xls,.xlsx,.txt',
      video: 'video/*',
      audio: 'audio/*',
    };

    input.accept = accept[type];

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file || !selectedContact) return;

      const formData = new FormData();
      formData.append(type, file);
      formData.append('to', selectedContact.phoneNumber);
      formData.append('sessionName', sessionName); // ✅ إضافة sessionName

      setSending(true);
      setError(null);

      try {
        const endpoint = type === 'image' ? API_ENDPOINTS.WHATSAPP.SEND_IMAGE :
                        type === 'video' ? API_ENDPOINTS.WHATSAPP.SEND_VIDEO :
                        type === 'audio' ? API_ENDPOINTS.WHATSAPP.SEND_AUDIO :
                        API_ENDPOINTS.WHATSAPP.SEND_DOCUMENT;

        await apiClient.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log(`✅ ${type} sent successfully`);
        const contactId = isGroupContact(selectedContact) && selectedContact.jid
          ? selectedContact.jid
          : selectedContact.phoneNumber;
        await fetchMessages(contactId);
      } catch (error: any) {
        console.error(`❌ Error sending ${type}:`, error);

        if (error.response?.status === 401) {
          setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
          setTimeout(() => window.location.href = '/login', 2000);
        } else {
          setError(error.response?.data?.message || 'فشل إرسال الملف');
        }
      } finally {
        setSending(false);
        setShowAttachMenu(false);
      }
    };

    input.click();
  };

  // ✅ Filter + split contacts by type for tabs
  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumber.includes(searchQuery)
      ),
    [contacts, searchQuery]
  );
  const regularContacts = useMemo(
    () => filteredContacts.filter((c) => !isGroupContact(c)),
    [filteredContacts]
  );
  const groupContacts = useMemo(
    () => filteredContacts.filter((c) => isGroupContact(c)),
    [filteredContacts]
  );
  const displayedContacts = contactsTab === 'groups' ? groupContacts : regularContacts;

  // ✅ Calculate message statistics
  const messageStats = useMemo(() => {
    const total = messages.length;
    const inbound = messages.filter(m => m.direction === 'inbound').length;
    const outbound = messages.filter(m => m.direction === 'outbound').length;
    const read = messages.filter(m => m.status === 'read').length;
    const delivered = messages.filter(m => m.status === 'delivered').length;
    const sent = messages.filter(m => m.status === 'sent').length;
    const pending = messages.filter(m => m.status === 'pending').length;
    const failed = messages.filter(m => m.status === 'failed').length;
    const starred = starredMessages.size;

    return {
      total,
      inbound,
      outbound,
      read,
      delivered,
      sent,
      pending,
      failed,
      starred,
      readRate: total > 0 ? ((read / total) * 100).toFixed(1) : '0',
      responseRate: inbound > 0 ? ((outbound / inbound) * 100).toFixed(1) : '0',
    };
  }, [messages, starredMessages]);

  // ✅ Filter messages based on search and filters (with debounced search)
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Search filter (using debounced query) - Fixed to use getMessageContent
      const matchesSearch = debouncedSearchQuery === '' || (() => {
        const content = getMessageContent(msg);
        return content.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      })();

      // Direction filter
      const matchesDirection = messageFilter === 'all' || msg.direction === messageFilter;

      // Date filter
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;

        const msgDate = new Date(msg.sentAt);
        const now = new Date();

        if (dateFilter === 'today') {
          return msgDate.toDateString() === now.toDateString();
        }

        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return msgDate >= weekAgo;
        }

        if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return msgDate >= monthAgo;
        }

        return true;
      })();

      // Status filter
      const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;

      // Starred filter
      const matchesStarred = !showStarredOnly || starredMessages.has(msg.id);

      return matchesSearch && matchesDirection && matchesDate && matchesStatus && matchesStarred;
    });
  }, [messages, debouncedSearchQuery, messageFilter, dateFilter, statusFilter, showStarredOnly, starredMessages]); // Use debounced query

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`} dir="rtl">
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 left-4 z-50 p-2 rounded-full shadow-lg transition-colors ${
          isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-gray-700'
        }`}
        title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* ✅ Notification System */}
      <div className="fixed top-4 left-20 z-50">
        <NotificationSystem
          socket={socketRef.current}
          onNotificationClick={handleNotificationClick}
        />
      </div>
      {/* ✅ Error Banner with Retry */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-800">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            {lastFailedAction && (
              <button
                onClick={() => {
                  setError(null);
                  lastFailedAction();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm transition-colors"
              >
                إعادة المحاولة
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setError(null);
              setLastFailedAction(null);
            }}
            className="text-red-600 hover:text-red-800"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-green-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BsWhatsapp className="w-8 h-8" />
              <h1 className="text-xl font-bold">💬 الدردشة</h1>
            </div>

            {/* New Chat Button */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              title="محادثة جديدة"
            >
              <FiPlus className="w-4 h-4" />
              جديد
            </button>
          </div>

          {/* ✅ Session Selector */}
          {sessionError ? (
            <div className="bg-red-500/20 border border-red-300 rounded-lg p-3 text-sm">
              {sessionError}
            </div>
          ) : availableSessions.length > 0 && (
            <div className="bg-white/10 rounded-lg p-3">
              <label className="block text-xs font-medium mb-2">الجلسة النشطة:</label>
              <select
                value={sessionName}
                onChange={(e) => {
                  const newSessionName = e.target.value;
                  setSessionName(newSessionName);
                  saveSessionName(newSessionName);
                  console.log('✅ Session changed to:', newSessionName);
                }}
                className="w-full px-3 py-2 bg-white text-gray-900 rounded-lg border-0 focus:ring-2 focus:ring-white/50 text-sm"
              >
                {availableSessions
                  .filter((s: any) => s.status === 'connected')
                  .map((session: any) => (
                    <option key={session.sessionName} value={session.sessionName}>
                      📱 {session.phoneNumber || session.sessionName}
                      {session.status === 'connected' ? ' ✅' : ' ⚠️'}
                    </option>
                  ))}
              </select>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>متصل</span>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن جهة اتصال..."
              className="w-full pr-10 pl-4 py-2 rounded-lg bg-white text-gray-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Tabs: Contacts vs Groups */}
        <div className="px-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setContactsTab('regular')}
              className={`flex-1 py-2 text-sm font-medium ${
                contactsTab === 'regular'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📱 جهات الاتصال ({regularContacts.length})
            </button>
            <button
              onClick={() => setContactsTab('groups')}
              className={`flex-1 py-2 text-sm font-medium ${
                contactsTab === 'groups'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 المجموعات ({groupContacts.length})
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {displayedContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد جهات اتصال
            </div>
          ) : (
            displayedContacts.map((contact) => (
              <div
                key={contact.id || contact.phoneNumber || Math.random()}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    contact.isGroup ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <span className={`${contact.isGroup ? 'text-blue-600' : 'text-green-600'} font-bold text-lg`}>
                      {getDisplayName(contact)[0] || contact.phoneNumber[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {getDisplayName(contact)}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {contact.isGroup ? 'مجموعة' : contact.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">
                      {selectedContact.name?.[0] || selectedContact.phoneNumber[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {getDisplayName(selectedContact)}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedContact.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Debug Info Button */}
                  <button
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="معلومات التشخيص"
                  >
                    🔍
                  </button>

                  {/* Stats Button */}
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="إحصائيات الرسائل"
                  >
                    📊
                  </button>

                  {/* Delete Menu - Dropdown */}
                  <div className="relative" ref={deleteMenuRef}>
                    <button
                      onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                      disabled={sending || messages.length === 0}
                      className="p-2 hover:bg-red-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      title="خيارات الحذف"
                    >
                      <FiTrash2 className="w-5 h-5 text-red-600" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDeleteMenu && (
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          {/* Delete Messages Only */}
                          <button
                            onClick={() => {
                              setShowDeleteMenu(false);
                              deleteConversation();
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                          >
                            <FiTrash2 className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="font-medium">حذف الرسائل فقط</div>
                              <div className="text-xs text-gray-500">
                                حذف {messages.length} رسالة (جهة الاتصال تبقى)
                              </div>
                            </div>
                          </button>

                          {/* Divider */}
                          <div className="border-t border-gray-200 my-1"></div>

                          {/* Delete Chat Completely */}
                          <button
                            onClick={() => {
                              setShowDeleteMenu(false);
                              deleteChat();
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <div>
                              <div className="font-medium">حذف الدردشة كاملة</div>
                              <div className="text-xs text-red-500">
                                حذف الرسائل + جهة الاتصال (لا يمكن التراجع)
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <FiMoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* ✅ Debug Info - معلومات الطلب */}
              {showDebugInfo && requestInfo && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <span>📡</span>
                    <span>معلومات الطلب</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <strong className="text-blue-700 min-w-[80px]">URL:</strong>
                      <code className="bg-blue-100 px-2 py-1 rounded flex-1 break-all">{requestInfo.url}</code>
                    </div>
                    <div className="flex items-start gap-2">
                      <strong className="text-blue-700 min-w-[80px]">Token:</strong>
                      <code className="bg-blue-100 px-2 py-1 rounded flex-1 break-all">{requestInfo.token}</code>
                    </div>
                    <div className="flex items-start gap-2">
                      <strong className="text-blue-700 min-w-[80px]">Timestamp:</strong>
                      <span className="text-blue-900">{requestInfo.timestamp}</span>
                    </div>
                    {requestInfo.statusCode && (
                      <div className="flex items-start gap-2">
                        <strong className="text-blue-700 min-w-[80px]">Status Code:</strong>
                        <span className={`font-bold ${requestInfo.statusCode === 200 ? 'text-green-600' : 'text-red-600'}`}>
                          {requestInfo.statusCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message Statistics */}
              {showStats && (
                <div className="mt-4 grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{messageStats.total}</div>
                    <div className="text-xs text-gray-600">إجمالي الرسائل</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{messageStats.inbound}</div>
                    <div className="text-xs text-gray-600">واردة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{messageStats.outbound}</div>
                    <div className="text-xs text-gray-600">صادرة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{messageStats.starred}</div>
                    <div className="text-xs text-gray-600">مميزة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{messageStats.read}</div>
                    <div className="text-xs text-gray-600">مقروءة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{messageStats.delivered}</div>
                    <div className="text-xs text-gray-600">مُستلمة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{messageStats.readRate}%</div>
                    <div className="text-xs text-gray-600">معدل القراءة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">{messageStats.responseRate}%</div>
                    <div className="text-xs text-gray-600">معدل الرد</div>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Search & Filters Section */}
            <div className="p-4 bg-white border-b border-gray-200">
              {/* ✅ Quick Test Buttons - أزرار الاختبار السريع */}
              {showDebugInfo && (
                <div className="mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-purple-800 mb-2">🧪 اختبار سريع - أرقام مختلفة:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const testContact = contacts.find(c => c.phoneNumber === '201123087139');
                        if (testContact) {
                          setSelectedContact(testContact);
                        } else {
                          alert('الرقم غير موجود في جهات الاتصال');
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors"
                    >
                      📱 رقم عادي (@s.whatsapp.net)
                      <div className="text-[10px] opacity-80">201123087139</div>
                    </button>
                    <button
                      onClick={() => {
                        const testContact = contacts.find(c => c.phoneNumber === '242477344759810');
                        if (testContact) {
                          setSelectedContact(testContact);
                        } else {
                          alert('الرقم غير موجود في جهات الاتصال');
                        }
                      }}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors"
                    >
                      💼 رقم Business (@lid)
                      <div className="text-[10px] opacity-80">242477344759810</div>
                    </button>
                    <button
                      onClick={() => {
                        const testContact = contacts.find(c => c.phoneNumber === '120363420803971218');
                        if (testContact) {
                          setSelectedContact(testContact);
                        } else {
                          alert('الرقم غير موجود في جهات الاتصال');
                        }
                      }}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600 transition-colors"
                    >
                      👥 مجموعة (@g.us)
                      <div className="text-[10px] opacity-80">120363420803971218</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="relative mb-3">
                <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  placeholder="بحث في الرسائل..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {messageSearchQuery && (
                  <button
                    onClick={() => setMessageSearchQuery('')}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setMessageFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    messageFilter === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setMessageFilter('inbound')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    messageFilter === 'inbound'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  واردة
                </button>
                <button
                  onClick={() => setMessageFilter('outbound')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    messageFilter === 'outbound'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  صادرة
                </button>
              </div>

              {/* Date Filter */}
              <div className="flex gap-2">
                {['today', 'week', 'month', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter as any)}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      dateFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'today' && 'اليوم'}
                    {filter === 'week' && 'هذا الأسبوع'}
                    {filter === 'month' && 'هذا الشهر'}
                    {filter === 'all' && 'كل الفترات'}
                  </button>
                ))}
              </div>

              {/* Advanced Filters */}
              <div className="flex gap-2 mt-2">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1 rounded-lg text-xs bg-gray-100 text-gray-700 border border-gray-300"
                >
                  <option value="all">كل الحالات</option>
                  <option value="read">مقروءة</option>
                  <option value="delivered">مُستلمة</option>
                  <option value="sent">مُرسلة</option>
                  <option value="pending">قيد الإرسال</option>
                  <option value="failed">فشلت</option>
                </select>

                {/* Starred Only */}
                <button
                  onClick={() => setShowStarredOnly(!showStarredOnly)}
                  className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1 ${
                    showStarredOnly
                      ? 'bg-yellow-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiStar className={showStarredOnly ? 'fill-current' : ''} />
                  المميزة فقط
                </button>
              </div>
            </div>

            {/* ✅ Results Info */}
            {(messageSearchQuery || messageFilter !== 'all' || dateFilter !== 'all') && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800">
                عرض {filteredMessages.length} من {messages.length} رسالة
                {messageSearchQuery && ` - البحث عن: "${messageSearchQuery}"`}
              </div>
            )}

            {/* Messages - Simple List with Infinite Scroll */}
            <div
              className="flex-1 overflow-y-auto p-4 bg-gray-50 relative"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                // Check for infinite scroll at top
                if (target.scrollTop === 0 && hasMoreMessages && !loadingMessages) {
                  loadMoreMessages();
                }
                // Check if user scrolled up (show scroll button)
                const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
                setShowScrollButton(!isNearBottom);
              }}
            >
              {loadingMessages ? (
                <MessagesListSkeleton />
              ) : filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <BsWhatsapp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">لا توجد رسائل</p>
                    <p className="text-sm mt-2">ابدأ المحادثة بإرسال رسالة!</p>
                  </div>
                </div>
              ) : (
                groupMessagesByDate(filteredMessages).map((group, groupIndex) => (
                  <div key={`group-${groupIndex}`}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {group.date}
                      </div>
                    </div>

                    {/* Messages in this date group */}
                    {group.messages.map((message, index) => {
                      const content = getMessageContent(message);
                      const isOutbound = message.direction === 'outbound';

                      return (
                        <div
                          key={message.id || message.messageId || `message-${index}`}
                          className={`mb-4 flex ${isOutbound ? 'justify-end' : 'justify-start'} group`}
                        >
                          <div
                            className={`max-w-md px-4 py-2 rounded-lg shadow-sm relative ${
                              isOutbound
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            {/* Action Buttons */}
                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Star Button */}
                              <button
                                onClick={() => toggleStarMessage(message.id)}
                                className={`p-1 rounded-full ${
                                  starredMessages.has(message.id)
                                    ? 'bg-yellow-400 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-yellow-400 hover:text-white'
                                }`}
                                title={starredMessages.has(message.id) ? 'إلغاء التمييز' : 'تمييز الرسالة'}
                              >
                                <FiStar className={`w-3 h-3 ${starredMessages.has(message.id) ? 'fill-current' : ''}`} />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                                title="حذف الرسالة"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {debouncedSearchQuery ? (
                              <p
                                className="whitespace-pre-wrap break-words"
                                dangerouslySetInnerHTML={getHighlightedHTML(content || 'رسالة فارغة', debouncedSearchQuery)}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{content || 'رسالة فارغة'}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs mt-1 opacity-70">
                              <span>{formatTime(message.sentAt)}</span>
                              {isOutbound && (
                                <>
                                  {message.status === 'read' && <BsCheckAll className="text-blue-400" />}
                                  {message.status === 'delivered' && <BsCheckAll />}
                                  {message.status === 'sent' && <BsCheck />}
                                  {message.status === 'pending' && <FiLoader className="w-3 h-3 animate-spin" />}
                                  {message.status === 'failed' && <FiAlertCircle className="text-red-400" />}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-3 shadow-lg transition-all duration-200 flex items-center gap-2"
                  title="انتقل إلى الأسفل"
                >
                  <FiArrowDown className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Message Input */}
            <div
              className={`bg-white border-t border-gray-200 p-4 relative ${isDragging ? 'bg-green-50 border-green-400' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedFile(file);
                  if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFilePreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }
              }}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-green-100 bg-opacity-90 flex items-center justify-center z-10 border-2 border-dashed border-green-400 rounded">
                  <div className="text-center">
                    <FiPaperclip className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">أفلت الملف هنا</p>
                  </div>
                </div>
              )}
              {/* ✅ File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <FiFile className="w-8 h-8 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    onClick={clearSelectedFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* ✅ File Input */}
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="file-input"
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                  title="رفع ملف"
                >
                  <FiPaperclip className="w-5 h-5" />
                </label>

                {/* ✅ Templates Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="القوالب الجاهزة"
                  >
                    <FiFileText className="w-5 h-5" />
                  </button>

                  {/* Templates Dropdown */}
                  {showTemplates && (
                    <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                      <div className="p-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">القوالب الجاهزة</h3>
                      </div>
                      <div className="p-2">
                        {templates.length === 0 ? (
                          <div className="text-center text-gray-500 py-4">
                            لا توجد قوالب متاحة
                          </div>
                        ) : (
                          templates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => useTemplate(template)}
                              className="w-full text-right p-3 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <div className="font-medium text-gray-900">{template.name}</div>
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">{template.content}</div>
                              {template.shortcut && (
                                <div className="text-xs text-blue-600 mt-1">{template.shortcut}</div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                استُخدم {template.usageCount} مرة
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Input */}
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={selectedFile ? "إضافة تعليق (اختياري)..." : "اكتب رسالة..."}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={sending}
                />

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={(!messageText.trim() && !selectedFile) || sending}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <FiLoader className="w-5 h-5 animate-spin" />
                  ) : (
                    <FiSend className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <BsWhatsapp className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-400 mb-2">
                اختر محادثة
              </h2>
              <p className="text-gray-400">
                اختر جهة اتصال من القائمة لبدء المحادثة
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Contact Info Panel */}
      {selectedContact && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          {/* Contact Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-green-600 font-bold text-2xl">
                  {selectedContact.name?.[0] || selectedContact.phoneNumber[0]}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center">
                {selectedContact.name || 'بدون اسم'}
              </h3>
              <p className="text-sm text-gray-500 mt-1" dir="ltr">
                {selectedContact.phoneNumber}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">معلومات الاتصال</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <BsWhatsapp className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700" dir="ltr">{selectedContact.phoneNumber}</span>
                </div>
                {selectedContact.lastMessageAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>آخر رسالة:</span>
                    <span>{formatTime(selectedContact.lastMessageAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">إجراءات سريعة</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <FiSearch className="w-4 h-4" />
                  <span>بحث في المحادثة</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <FiImage className="w-4 h-4" />
                  <span>الوسائط والملفات</span>
                </button>
              </div>
            </div>

            {/* ✅ Conversation Assignment */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                إدارة المحادثة
              </h4>

              {/* Assignment Section */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    تعيين المحادثة
                  </label>
                  <select
                    value={currentConversation?.assignedTo || ''}
                    onChange={(e) => assignConversation(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="">غير معيّنة</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Section */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    حالة المحادثة
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {['open', 'pending', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateConversationStatus(status)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          currentConversation?.status === status
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'open' && 'مفتوحة'}
                        {status === 'pending' && 'معلقة'}
                        {status === 'closed' && 'مغلقة'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Assignment Display */}
                {currentConversation?.assignedTo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="text-xs text-blue-800">
                      <strong>معيّنة إلى:</strong> {
                        users.find(u => u.id === currentConversation.assignedTo)?.firstName
                      } {
                        users.find(u => u.id === currentConversation.assignedTo)?.lastName
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Notes Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                الملاحظات الداخلية
              </h4>

              {/* Add Note */}
              <div className="mb-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="أضف ملاحظة..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  إضافة ملاحظة
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-sm text-gray-900">{note.note}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {note.user?.firstName} {note.user?.lastName} - {formatTime(note.createdAt)}
                    </div>
                  </div>
                ))}

                {notes.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    لا توجد ملاحظات بعد
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Stats */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">إحصائيات</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {messages.filter(m => m.direction === 'inbound').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">رسائل واردة</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {messages.filter(m => m.direction === 'outbound').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">رسائل صادرة</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">محادثة جديدة</h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setNewChatForm({ phoneNumber: '', name: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={newChatForm.phoneNumber}
                  onChange={(e) => setNewChatForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="مثال: 01123087745"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم (اختياري)
                </label>
                <input
                  type="text"
                  value={newChatForm.name}
                  onChange={(e) => setNewChatForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم جهة الاتصال"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={createNewContact}
                  disabled={!newChatForm.phoneNumber.trim()}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  إنشاء المحادثة
                </button>
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    setNewChatForm({ phoneNumber: '', name: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

