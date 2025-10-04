# 📋 Phase 2 - المهام المتبقية (Remaining Tasks)

**المرحلة:** Phase 2 - Frontend UI/UX Improvements  
**الحالة:** مكتمل 50% (5/10 مهام)  
**الأولوية:** High Priority

---

## ✅ المهام المكتملة (للمراجعة)

1. ✅ Update Message Interface - إضافة user info fields
2. ✅ User Avatars & Names Display
3. ✅ Avatar Component
4. ✅ Improved Timestamp Display
5. ✅ Contact Info Panel

---

## ⏳ المهام المتبقية (5 مهام)

---

## Task 2.6: Message Search & Filters 🔍

### الهدف:
إضافة إمكانية البحث في الرسائل وفلترتها حسب معايير مختلفة.

### الملفات المطلوب تعديلها:
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`
2. `backend/src/controllers/whatsappController.js` (اختياري - لتحسين الأداء)

### الخطوات التفصيلية:

#### 1. إضافة State للبحث والفلترة:
```typescript
// في page.tsx
const [searchQuery, setSearchQuery] = useState('');
const [messageFilter, setMessageFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
```

#### 2. إضافة Search Bar في Header:
```typescript
{/* Search & Filters Section */}
<div className="p-4 bg-white border-b border-gray-200">
  {/* Search Input */}
  <div className="relative mb-3">
    <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="بحث في الرسائل..."
      className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <FiX className="w-4 h-4" />
      </button>
    )}
  </div>

  {/* Filter Buttons */}
  <div className="flex gap-2">
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
  <div className="flex gap-2 mt-2">
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
</div>
```

#### 3. إضافة Filter Logic:
```typescript
// Filter messages
const filteredMessages = useMemo(() => {
  return messages.filter((msg) => {
    // Search filter
    const matchesSearch = searchQuery === '' || (() => {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : msg.content?.text || '';
      return content.toLowerCase().includes(searchQuery.toLowerCase());
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

    return matchesSearch && matchesDirection && matchesDate;
  });
}, [messages, searchQuery, messageFilter, dateFilter]);

// استخدم filteredMessages بدلاً من messages في الـ render
```

#### 4. إضافة Results Counter:
```typescript
{/* Results Info */}
{(searchQuery || messageFilter !== 'all' || dateFilter !== 'all') && (
  <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800">
    عرض {filteredMessages.length} من {messages.length} رسالة
    {searchQuery && ` - البحث عن: "${searchQuery}"`}
  </div>
)}
```

### الأولوية: ⭐⭐⭐ High
### الوقت المتوقع: 30-45 دقيقة

---

## Task 2.7: Quick Replies & Templates 💬

### الهدف:
إضافة قوالب رسائل جاهزة وردود سريعة لتسريع الرد على العملاء.

### الملفات المطلوب إنشاؤها:

#### Backend:
1. `backend/migrations/20250104_create_message_templates.sql`
2. `backend/src/models/MessageTemplate.js`
3. `backend/src/services/templateService.js`
4. `backend/src/controllers/templateController.js`

#### Frontend:
5. تعديل `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

### الخطوات التفصيلية:

#### 1. إنشاء Database Schema:
```sql
-- backend/migrations/20250104_create_message_templates.sql
CREATE TABLE IF NOT EXISTS message_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL COMMENT 'Template name',
  content TEXT NOT NULL COMMENT 'Template content',
  category VARCHAR(100) NULL COMMENT 'Template category (greeting, support, sales, etc)',
  shortcut VARCHAR(50) NULL COMMENT 'Keyboard shortcut (e.g., /hello)',
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_templates_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_templates_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) 
    ON DELETE CASCADE,
  
  INDEX idx_templates_org (organization_id),
  INDEX idx_templates_category (category),
  INDEX idx_templates_shortcut (shortcut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إدراج قوالب افتراضية
INSERT INTO message_templates (organization_id, name, content, category, shortcut, created_by) VALUES
(1, 'ترحيب', 'مرحباً! كيف يمكنني مساعدتك اليوم؟', 'greeting', '/hello', 1),
(1, 'شكر', 'شكراً لتواصلك معنا! سنرد عليك في أقرب وقت.', 'greeting', '/thanks', 1),
(1, 'انتظار', 'من فضلك انتظر قليلاً، سأتحقق من ذلك وأعود إليك.', 'support', '/wait', 1),
(1, 'معلومات إضافية', 'هل يمكنك تزويدي بمزيد من التفاصيل؟', 'support', '/info', 1);
```

#### 2. إنشاء Model:
```javascript
// backend/src/models/MessageTemplate.js
import { DataTypes } from 'sequelize';

const createMessageTemplateModel = (sequelize) => {
  const MessageTemplate = sequelize.define(
    'MessageTemplate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      organizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'organization_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      shortcut: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'usage_count',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
      },
    },
    {
      tableName: 'message_templates',
      timestamps: true,
      underscored: true,
    }
  );

  return MessageTemplate;
};

export default createMessageTemplateModel;
```

#### 3. إنشاء Service:
```javascript
// backend/src/services/templateService.js
import { getModel } from '../models/index.js';

export const templateService = {
  async getTemplates(organizationId, filters = {}) {
    const MessageTemplate = getModel('MessageTemplate');
    
    const where = { organizationId };
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    const templates = await MessageTemplate.findAll({
      where,
      order: [['usageCount', 'DESC'], ['name', 'ASC']],
    });
    
    return templates;
  },

  async createTemplate(data) {
    const MessageTemplate = getModel('MessageTemplate');
    return await MessageTemplate.create(data);
  },

  async updateTemplate(id, data) {
    const MessageTemplate = getModel('MessageTemplate');
    const template = await MessageTemplate.findByPk(id);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    return await template.update(data);
  },

  async incrementUsage(id) {
    const MessageTemplate = getModel('MessageTemplate');
    const template = await MessageTemplate.findByPk(id);
    
    if (template) {
      await template.increment('usageCount');
    }
  },

  async deleteTemplate(id) {
    const MessageTemplate = getModel('MessageTemplate');
    const template = await MessageTemplate.findByPk(id);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    await template.destroy();
  },
};
```

#### 4. Frontend UI:
```typescript
// في page.tsx - إضافة state
const [templates, setTemplates] = useState<any[]>([]);
const [showTemplates, setShowTemplates] = useState(false);

// جلب القوالب
useEffect(() => {
  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TEMPLATES.LIST);
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
  
  fetchTemplates();
}, []);

// UI للقوالب
{/* Templates Button */}
<button
  onClick={() => setShowTemplates(!showTemplates)}
  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
  title="القوالب"
>
  <FiFileText className="w-5 h-5" />
</button>

{/* Templates Dropdown */}
{showTemplates && (
  <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
    <div className="p-3 border-b border-gray-200">
      <h3 className="font-semibold text-gray-900">القوالب الجاهزة</h3>
    </div>
    <div className="p-2">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => {
            setNewMessage(template.content);
            setShowTemplates(false);
            // زيادة عداد الاستخدام
            apiClient.post(`/api/v1/templates/${template.id}/use`);
          }}
          className="w-full text-right p-3 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="font-medium text-gray-900">{template.name}</div>
          <div className="text-sm text-gray-500 mt-1">{template.content}</div>
          {template.shortcut && (
            <div className="text-xs text-blue-600 mt-1">{template.shortcut}</div>
          )}
        </button>
      ))}
    </div>
  </div>
)}
```

### الأولوية: ⭐⭐ Medium-High
### الوقت المتوقع: 60-90 دقيقة

---

## Task 2.8: File Upload Support 📎

### الهدف:
إضافة إمكانية رفع وإرسال الملفات (صور، فيديو، مستندات).

### الملفات المطلوب تعديلها:
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`
2. `backend/src/controllers/whatsappController.js`
3. `backend/src/services/whatsappService.js`

### الخطوات التفصيلية:

#### 1. Frontend - File Input:
```typescript
// State
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [filePreview, setFilePreview] = useState<string | null>(null);

// Handle file selection
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
};

// UI
{/* File Input */}
<input
  type="file"
  id="file-input"
  className="hidden"
  onChange={handleFileSelect}
  accept="image/*,video/*,.pdf,.doc,.docx"
/>
<label
  htmlFor="file-input"
  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
>
  <FiPaperclip className="w-5 h-5" />
</label>

{/* File Preview */}
{selectedFile && (
  <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
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
      onClick={() => {
        setSelectedFile(null);
        setFilePreview(null);
      }}
      className="text-red-600 hover:text-red-800"
    >
      <FiX className="w-5 h-5" />
    </button>
  </div>
)}
```

#### 2. Send with File:
```typescript
const sendMessage = async () => {
  if (!selectedContact || (!newMessage.trim() && !selectedFile)) return;

  try {
    setSending(true);

    if (selectedFile) {
      // Upload file first
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sessionId', selectedContact.sessionName);
      formData.append('to', selectedContact.phoneNumber);
      formData.append('caption', newMessage);

      await apiClient.post(API_ENDPOINTS.WHATSAPP.SEND_MEDIA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSelectedFile(null);
      setFilePreview(null);
    } else {
      // Send text message
      await apiClient.post(API_ENDPOINTS.WHATSAPP.SEND_MESSAGE, {
        sessionId: selectedContact.sessionName,
        to: selectedContact.phoneNumber,
        text: newMessage,
      });
    }

    setNewMessage('');
    fetchMessages();
  } catch (error) {
    console.error('Error sending message:', error);
    setError('فشل إرسال الرسالة');
  } finally {
    setSending(false);
  }
};
```

### الأولوية: ⭐⭐⭐ High
### الوقت المتوقع: 45-60 دقيقة

---

## Task 2.9: Conversation Assignment UI 👥

### الهدف:
إضافة واجهة لتعيين المحادثات للمستخدمين وتغيير حالتها.

### الملفات المطلوب تعديلها:
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

### الخطوات التفصيلية:

```typescript
// State
const [users, setUsers] = useState<any[]>([]);
const [currentConversation, setCurrentConversation] = useState<any>(null);

// Fetch users
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/v1/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  fetchUsers();
}, []);

// Assign conversation
const assignConversation = async (userId: number) => {
  try {
    await apiClient.post(
      `/api/v1/whatsapp/conversations/${currentConversation.id}/assign`,
      { userId }
    );
    
    // Update UI
    setCurrentConversation({ ...currentConversation, assignedTo: userId });
  } catch (error) {
    console.error('Error assigning conversation:', error);
  }
};

// UI في Contact Info Panel
{/* Assignment Section */}
<div>
  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
    تعيين المحادثة
  </h4>
  <select
    value={currentConversation?.assignedTo || ''}
    onChange={(e) => assignConversation(parseInt(e.target.value))}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
    حالة المحادثة
  </h4>
  <div className="flex gap-2">
    {['open', 'pending', 'closed'].map((status) => (
      <button
        key={status}
        onClick={() => updateConversationStatus(status)}
        className={`flex-1 px-3 py-2 rounded-lg text-sm ${
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
```

### الأولوية: ⭐⭐ Medium
### الوقت المتوقع: 30-45 دقيقة

---

## Task 2.10: Notes Section 📝

### الهدف:
إضافة قسم للملاحظات الداخلية على المحادثات.

### الملفات المطلوب تعديلها:
1. `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

### الخطوات التفصيلية:

```typescript
// State
const [notes, setNotes] = useState<any[]>([]);
const [newNote, setNewNote] = useState('');

// Fetch notes
const fetchNotes = async (conversationId: number) => {
  try {
    const response = await apiClient.get(
      `/api/v1/whatsapp/conversations/${conversationId}/notes`
    );
    setNotes(response.data.data);
  } catch (error) {
    console.error('Error fetching notes:', error);
  }
};

// Add note
const addNote = async () => {
  if (!newNote.trim() || !currentConversation) return;
  
  try {
    await apiClient.post(
      `/api/v1/whatsapp/conversations/${currentConversation.id}/notes`,
      { note: newNote }
    );
    
    setNewNote('');
    fetchNotes(currentConversation.id);
  } catch (error) {
    console.error('Error adding note:', error);
  }
};

// UI في Contact Info Panel
{/* Notes Section */}
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
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
      rows={3}
    />
    <button
      onClick={addNote}
      disabled={!newNote.trim()}
      className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
```

### الأولوية: ⭐⭐ Medium
### الوقت المتوقع: 30-45 دقيقة

---

## 📊 ملخص الأولويات

| المهمة | الأولوية | الوقت المتوقع | الصعوبة |
|--------|----------|---------------|---------|
| Task 2.6: Search & Filters | ⭐⭐⭐ High | 30-45 دقيقة | سهلة |
| Task 2.7: Templates | ⭐⭐ Medium-High | 60-90 دقيقة | متوسطة |
| Task 2.8: File Upload | ⭐⭐⭐ High | 45-60 دقيقة | متوسطة |
| Task 2.9: Assignment UI | ⭐⭐ Medium | 30-45 دقيقة | سهلة |
| Task 2.10: Notes Section | ⭐⭐ Medium | 30-45 دقيقة | سهلة |

**الوقت الإجمالي المتوقع:** 3-5 ساعات

---

## 🎯 الترتيب الموصى به للتنفيذ:

1. **Task 2.6** (Search & Filters) - سريع ومفيد فوراً
2. **Task 2.9** (Assignment UI) - يستخدم APIs الموجودة
3. **Task 2.10** (Notes Section) - يستخدم APIs الموجودة
4. **Task 2.8** (File Upload) - يحتاج backend work
5. **Task 2.7** (Templates) - الأكثر تعقيداً

---

**آخر تحديث:** 2025-10-03  
**الحالة:** جاهز للتنفيذ ✅

