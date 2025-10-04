# 📱 دليل نظام WhatsApp - التوثيق الشامل

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [البنية التقنية](#البنية-التقنية)
3. [دليل الاستخدام](#دليل-الاستخدام)
4. [API Reference](#api-reference)
5. [أمثلة الكود](#أمثلة-الكود)
6. [الميزات المستقبلية](#الميزات-المستقبلية)
7. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🎯 نظرة عامة

نظام WhatsApp متكامل يسمح للمؤسسات بإدارة محادثات WhatsApp مباشرة من النظام، مع دعم جلسات متعددة وأنواع رسائل متنوعة.

### **الميزات الرئيسية**
- ✅ جلسات متعددة لكل مؤسسة
- ✅ 5 أنواع رسائل (نص، صورة، فيديو، صوت، ملف)
- ✅ إعادة اتصال تلقائي
- ✅ واجهة محادثة احترافية
- ✅ إدارة جهات الاتصال
- ✅ تكامل مع CRM

---

## 🏗️ البنية التقنية

### **المكتبات المستخدمة**
```json
{
  "@whiskeysockets/baileys": "^6.7.9",
  "qrcode": "^1.5.4",
  "@hapi/boom": "^10.0.1",
  "multer": "^1.4.5-lts.2"
}
```

### **Models**

#### **1. WhatsAppSession**
```javascript
{
  organization: ObjectId,        // المؤسسة
  sessionName: String,           // اسم الجلسة (default, sales, support)
  phoneNumber: String,           // رقم الهاتف المتصل
  status: Enum,                  // connected, disconnected, connecting, failed
  qrCode: String,                // QR Code للمصادقة
  sessionData: Mixed,            // بيانات الجلسة (مشفرة)
  lastConnected: Date,
  lastDisconnected: Date,
  connectionAttempts: Number,
  isActive: Boolean
}
```

**Index**: `{organization + sessionName}` (unique)

#### **2. WhatsAppMessage**
```javascript
{
  organization: ObjectId,
  sessionId: String,             // organizationId_sessionName
  messageId: String,             // معرف الرسالة من WhatsApp
  from: String,                  // المرسل
  to: String,                    // المستقبل
  direction: Enum,               // incoming, outgoing
  type: Enum,                    // text, image, video, audio, document
  content: {
    text: String,
    caption: String,
    mediaUrl: String,
    mimeType: String,
    filename: String,
    buttons: Array,
    listItems: Array
  },
  status: Enum,                  // pending, sent, delivered, read, failed
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  errorMessage: String,
  relatedUser: ObjectId,
  relatedCustomer: ObjectId,
  metadata: Mixed
}
```

#### **3. WhatsAppContact**
```javascript
{
  organization: ObjectId,
  phoneNumber: String,
  name: String,
  profilePicUrl: String,
  isBlocked: Boolean,
  tags: [String],                // ['customer', 'vip', 'lead']
  notes: String,
  lastMessageAt: Date,
  relatedUser: ObjectId,
  relatedCustomer: ObjectId
}
```

---

## 📖 دليل الاستخدام

### **1. إنشاء جلسة WhatsApp**

#### **من Frontend**
1. افتح `/dashboard/whatsapp`
2. اضغط "جلسة جديدة"
3. أدخل اسم الجلسة (مثلاً: "sales")
4. امسح QR Code من هاتفك
5. انتظر الاتصال

#### **من API**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "sales"}'
```

**Response**:
```json
{
  "success": true,
  "message": "تم إنشاء الجلسة بنجاح. يرجى مسح QR Code",
  "data": {
    "sessionId": "68dc7477e72c5643d1ea3ba0_sales"
  }
}
```

### **2. الحصول على QR Code**

```bash
curl -X GET http://localhost:3000/api/v1/whatsapp/sessions/sales/qr \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "تم الحصول على QR Code بنجاح",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

### **3. إرسال رسالة نصية**

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "966500000000",
    "text": "مرحباً! كيف يمكنني مساعدتك؟",
    "sessionName": "sales"
  }'
```

### **4. إرسال صورة**

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/messages/send-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "to=966500000000" \
  -F "caption=شاهد هذا المنتج الجديد!" \
  -F "sessionName=sales"
```

### **5. إرسال ملف**

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/messages/send-document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/file.pdf" \
  -F "to=966500000000" \
  -F "sessionName=sales"
```

---

## 📡 API Reference

### **Sessions**

#### **POST /api/v1/whatsapp/sessions**
إنشاء جلسة جديدة

**Body**:
```json
{
  "sessionName": "sales"  // optional, default: "default"
}
```

#### **GET /api/v1/whatsapp/sessions**
الحصول على جميع الجلسات

**Response**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "_id": "...",
        "sessionName": "sales",
        "phoneNumber": "966500000000",
        "status": "connected",
        "lastConnected": "2025-10-01T10:30:00.000Z"
      }
    ]
  }
}
```

#### **GET /api/v1/whatsapp/sessions/:sessionName/status**
حالة الجلسة

#### **DELETE /api/v1/whatsapp/sessions/:sessionName**
قطع اتصال الجلسة

### **Messages**

#### **POST /api/v1/whatsapp/messages/send**
إرسال رسالة نصية

**Body**:
```json
{
  "to": "966500000000",
  "text": "مرحباً!",
  "sessionName": "sales"
}
```

#### **POST /api/v1/whatsapp/messages/send-image**
إرسال صورة

**Form Data**:
- `image`: File (required)
- `to`: String (required)
- `caption`: String (optional)
- `sessionName`: String (optional)

#### **POST /api/v1/whatsapp/messages/send-document**
إرسال ملف

**Form Data**:
- `document`: File (required)
- `to`: String (required)
- `sessionName`: String (optional)

#### **POST /api/v1/whatsapp/messages/send-video**
إرسال فيديو

#### **POST /api/v1/whatsapp/messages/send-audio**
إرسال رسالة صوتية

#### **GET /api/v1/whatsapp/messages**
الحصول على الرسائل

**Query Parameters**:
- `sessionName`: String
- `contact`: String (phone number)
- `direction`: incoming | outgoing
- `page`: Number (default: 1)
- `limit`: Number (default: 50)

### **Contacts**

#### **GET /api/v1/whatsapp/contacts**
جهات الاتصال

**Query Parameters**:
- `sessionName`: String
- `search`: String
- `page`: Number
- `limit`: Number

#### **PUT /api/v1/whatsapp/contacts/:id**
تحديث جهة اتصال

**Body**:
```json
{
  "name": "أحمد محمد",
  "tags": ["customer", "vip"],
  "notes": "عميل مهم",
  "linkedCustomer": "customer_id"
}
```

### **Stats**

#### **GET /api/v1/whatsapp/stats**
إحصائيات WhatsApp

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSessions": 3,
    "activeSessions": 2,
    "totalMessages": 1234,
    "totalContacts": 567,
    "messagesLast24h": 89
  }
}
```

---

## 💻 أمثلة الكود

### **Backend - إرسال رسالة من Service**

```javascript
import whatsappService from '../services/whatsappService.js';

// إرسال رسالة نصية
const sessionId = `${organizationId}_sales`;
await whatsappService.sendTextMessage(
  sessionId,
  '966500000000',
  'مرحباً بك!'
);

// إرسال صورة
const imageBuffer = fs.readFileSync('image.jpg');
await whatsappService.sendImageMessage(
  sessionId,
  '966500000000',
  imageBuffer,
  'شاهد هذا!'
);

// إرسال ملف
const fileBuffer = fs.readFileSync('document.pdf');
await whatsappService.sendDocumentMessage(
  sessionId,
  '966500000000',
  fileBuffer,
  'document.pdf',
  'application/pdf'
);
```

### **Frontend - إرسال رسالة**

```typescript
import axios from 'axios';

const sendMessage = async (to: string, text: string) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    'http://localhost:3000/api/v1/whatsapp/messages/send',
    { to, text, sessionName: 'sales' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  return response.data;
};

// استخدام
await sendMessage('966500000000', 'مرحباً!');
```

### **Frontend - إرسال صورة**

```typescript
const sendImage = async (to: string, file: File, caption?: string) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  
  formData.append('image', file);
  formData.append('to', to);
  if (caption) formData.append('caption', caption);
  
  const response = await axios.post(
    'http://localhost:3000/api/v1/whatsapp/messages/send-image',
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};
```

---

## 🚀 الميزات المستقبلية

### **الأولوية العالية** 🔴

#### **1. نظام الردود التلقائية (Auto-Reply)**
```javascript
{
  trigger: 'مرحبا',
  response: 'مرحباً بك! كيف يمكنني مساعدتك؟',
  conditions: {
    timeRange: { start: '09:00', end: '17:00' },
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }
}
```

#### **2. الرسائل الجماعية (Broadcast)**
```javascript
{
  name: 'عرض رمضان',
  recipients: {
    type: 'filter',
    filters: { tags: ['customer'], lastMessageBefore: '2024-01-01' }
  },
  message: {
    type: 'template',
    template: 'ramadan_offer',
    variables: { discount: '30%' }
  },
  schedule: { sendAt: '2024-03-15 10:00' }
}
```

#### **3. الرسائل المجدولة**
```javascript
{
  to: '966500000000',
  message: 'تذكير: موعدك غداً الساعة 10 صباحاً',
  scheduleAt: '2024-03-15 09:00',
  repeat: { frequency: 'daily', until: '2024-03-20' }
}
```

### **الأولوية المتوسطة** 🟡

#### **4. Chatbot ذكي مع AI**
- تكامل مع OpenAI GPT
- فهم النوايا (Intent Recognition)
- استخراج المعلومات (Entity Extraction)
- تصعيد للموظف عند الحاجة

#### **5. نظام القوالب (Templates)**
```javascript
{
  name: 'welcome_message',
  category: 'marketing',
  language: 'ar',
  content: 'مرحباً {{name}}! شكراً لتواصلك مع {{company}}',
  variables: ['name', 'company'],
  buttons: [
    { type: 'url', text: 'زيارة الموقع', url: 'https://...' },
    { type: 'call', text: 'اتصل بنا', phone: '+966...' }
  ]
}
```

#### **6. التحليلات المتقدمة**
- معدل الرد (Response Rate)
- متوسط وقت الرد (Average Response Time)
- رضا العملاء (Customer Satisfaction)
- أكثر الأوقات نشاطاً
- معدل التحويل (Conversion Rate)

### **الأولوية المنخفضة** 🟢

#### **7. WhatsApp Business API**
- التحول من Baileys إلى API الرسمي
- رقم أخضر معتمد (Green Tick)
- قوالب معتمدة من WhatsApp

#### **8. نظام توزيع المحادثات**
- توزيع تلقائي للمحادثات على الموظفين
- Round Robin / Least Busy / Skill-based
- حد أقصى للمحادثات لكل موظف

---

## 🔧 استكشاف الأخطاء

### **المشكلة: QR Code لا يظهر**

**الأسباب المحتملة**:
1. الجلسة متصلة بالفعل
2. خطأ في الاتصال بـ WhatsApp

**الحل**:
```bash
# تحقق من حالة الجلسة
curl -X GET http://localhost:3000/api/v1/whatsapp/sessions/sales/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# إذا كانت متصلة، قم بقطع الاتصال أولاً
curl -X DELETE http://localhost:3000/api/v1/whatsapp/sessions/sales \
  -H "Authorization: Bearer YOUR_TOKEN"

# ثم أنشئ جلسة جديدة
```

### **المشكلة: الجلسة تنقطع باستمرار**

**الأسباب المحتملة**:
1. مشكلة في الإنترنت
2. WhatsApp محظور على الرقم
3. تسجيل دخول من جهاز آخر

**الحل**:
- تحقق من الاتصال بالإنترنت
- تأكد من عدم تسجيل الدخول من جهاز آخر
- راجع logs في `backend/logs/`

### **المشكلة: فشل إرسال الرسالة**

**الأسباب المحتملة**:
1. الجلسة غير متصلة
2. رقم الهاتف غير صحيح
3. حجم الملف كبير جداً (>16MB)

**الحل**:
```javascript
// تحقق من حالة الجلسة أولاً
const status = whatsappService.getSessionStatus(sessionId);
if (status !== 'connected') {
  throw new Error('الجلسة غير متصلة');
}

// تحقق من حجم الملف
if (file.size > 16 * 1024 * 1024) {
  throw new Error('حجم الملف كبير جداً');
}
```

### **المشكلة: Error: Path "sessionName" is not in schema**

**السبب**: نموذج قديم لا يحتوي على حقل sessionName

**الحل**: تم إصلاحه في النسخة الحالية

---

## 📊 حدود الاستخدام

### **حسب خطة الاشتراك**:

| الخطة | عدد الجلسات |
|------|-------------|
| Free | 1 |
| Basic | 3 |
| Pro | 10 |
| Enterprise | غير محدود |

### **حدود WhatsApp**:
- حجم الملف: 16 MB
- طول الرسالة النصية: 4096 حرف
- عدد الرسائل: غير محدود (لكن يُنصح بعدم الإفراط)

---

## 📞 الدعم

للمساعدة في نظام WhatsApp:
- 📧 Email: whatsapp-support@newtask.com
- 📱 WhatsApp: +966500000000
- 📚 Documentation: https://docs.newtask.com/whatsapp

---

**تم بحمد الله ✨**

