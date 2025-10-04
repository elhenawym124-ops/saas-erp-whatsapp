# دليل اختبار صفحة WhatsApp Messages
## WhatsApp Messages Testing Guide

---

## 🧪 خطوات الاختبار | Testing Steps

### 1. **تسجيل الدخول | Login**

افتح المتصفح وانتقل إلى:
```
http://localhost:3001/login
```

استخدم بيانات الاعتماد:
- **Email:** `test@test.com`
- **Password:** `test123`

**النتيجة المتوقعة:**
- ✅ تسجيل دخول ناجح
- ✅ حفظ JWT token في localStorage
- ✅ إعادة توجيه إلى Dashboard

---

### 2. **فتح صفحة الرسائل | Open Messages Page**

انتقل إلى:
```
http://localhost:3001/dashboard/whatsapp/messages
```

**النتيجة المتوقعة:**
- ✅ تحميل قائمة جهات الاتصال (3 جهات اتصال)
- ✅ عرض Loading state أثناء التحميل
- ✅ لا توجد أخطاء في Console

---

### 3. **اختيار جهة اتصال | Select Contact**

اضغط على أي جهة اتصال من القائمة (مثلاً: Test Contact 1)

**النتيجة المتوقعة:**
- ✅ تحميل الرسائل الخاصة بجهة الاتصال
- ✅ عرض Loading state أثناء تحميل الرسائل
- ✅ عرض الرسائل بشكل صحيح (inbound على اليسار، outbound على اليمين)
- ✅ عرض الوقت بشكل صحيح
- ✅ عرض حالة الرسالة (✓ أو ✓✓)

---

### 4. **إرسال رسالة | Send Message**

اكتب رسالة في حقل الإدخال واضغط Enter أو زر الإرسال

**النتيجة المتوقعة:**
- ✅ إرسال الرسالة بنجاح
- ✅ ظهور الرسالة فوراً في قائمة الرسائل
- ✅ تفريغ حقل الإدخال
- ✅ Scroll تلقائي إلى آخر رسالة
- ✅ عرض حالة الرسالة (pending → sent → delivered)

---

### 5. **استقبال رسالة جديدة عبر WebSocket | Receive New Message**

أرسل رسالة من رقم WhatsApp آخر إلى الرقم المتصل

**النتيجة المتوقعة:**
- ✅ ظهور الرسالة فوراً في الصفحة (بدون refresh)
- ✅ Scroll تلقائي إلى آخر رسالة
- ✅ عرض الرسالة على اليسار (inbound)

---

### 6. **اختبار Error Handling | Test Error Handling**

#### 6.1 اختبار انتهاء الجلسة:
1. احذف JWT token من localStorage:
   ```javascript
   localStorage.removeItem('accessToken')
   ```
2. حاول إرسال رسالة

**النتيجة المتوقعة:**
- ✅ ظهور Error Banner في أعلى الصفحة
- ✅ رسالة: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى."
- ✅ إعادة توجيه تلقائي إلى صفحة Login بعد ثانيتين

#### 6.2 اختبار فشل الشبكة:
1. أوقف الخادم الخلفي
2. حاول تحميل الرسائل

**النتيجة المتوقعة:**
- ✅ ظهور Error Banner
- ✅ رسالة خطأ واضحة

---

### 7. **اختبار Empty States | Test Empty States**

#### 7.1 لا توجد جهات اتصال:
إذا لم تكن هناك جهات اتصال في قاعدة البيانات

**النتيجة المتوقعة:**
- ✅ عرض رسالة: "لا توجد جهات اتصال"
- ✅ أيقونة WhatsApp كبيرة
- ✅ زر "محادثة جديدة" يعمل

#### 7.2 لا توجد رسائل:
اختر جهة اتصال بدون رسائل

**النتيجة المتوقعة:**
- ✅ عرض رسالة: "لا توجد رسائل"
- ✅ رسالة: "ابدأ المحادثة بإرسال رسالة!"
- ✅ أيقونة WhatsApp كبيرة

---

### 8. **اختبار البحث | Test Search**

اكتب في حقل البحث في قائمة جهات الاتصال

**النتيجة المتوقعة:**
- ✅ تصفية جهات الاتصال حسب الاسم أو رقم الهاتف
- ✅ تحديث القائمة فوراً

---

### 9. **اختبار إنشاء جهة اتصال جديدة | Test New Contact**

1. اضغط على زر "جديد" في أعلى قائمة جهات الاتصال
2. أدخل رقم الهاتف والاسم
3. اضغط "إنشاء المحادثة"

**النتيجة المتوقعة:**
- ✅ إنشاء جهة اتصال جديدة
- ✅ إضافتها إلى القائمة
- ✅ اختيارها تلقائياً
- ✅ إغلاق النموذج

---

## 🔍 فحص Console | Console Inspection

افتح Developer Tools (F12) وتحقق من:

### ✅ يجب أن تظهر:
```
✅ Contacts loaded: 3
✅ Messages loaded: 8
✅ Message sent: {...}
🔌 WebSocket connected
📥 Received whatsapp_message: {...}
```

### ❌ يجب ألا تظهر:
```
❌ 401 Unauthorized
❌ Token غير صالح
❌ Failed to fetch
❌ React key warnings
❌ Uncaught errors
```

---

## 📊 اختبار API مباشرة | Direct API Testing

### 1. تسجيل الدخول:
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123"}' \
  -c cookies.txt
```

### 2. جلب جهات الاتصال:
```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/contacts" \
  -b cookies.txt
```

### 3. جلب الرسائل:
```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/messages?contact=201065676135&limit=5" \
  -b cookies.txt
```

### 4. إرسال رسالة:
```bash
curl -X POST "http://localhost:3000/api/v1/whatsapp/messages/send" \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "456456", "to": "201065676135", "text": "Test message"}' \
  -b cookies.txt
```

---

## ✅ Checklist النهائي | Final Checklist

### المصادقة | Authentication:
- [ ] JWT token يُحفظ في localStorage
- [ ] جميع طلبات API تستخدم JWT في Authorization header
- [ ] معالجة خطأ 401 تعمل بشكل صحيح
- [ ] إعادة توجيه إلى Login عند انتهاء الجلسة

### عرض البيانات | Data Display:
- [ ] جهات الاتصال تُعرض بشكل صحيح
- [ ] الرسائل تُعرض بشكل صحيح
- [ ] الوقت منسق بشكل صحيح (اليوم، أمس، تاريخ)
- [ ] حالة الرسالة تُعرض بشكل صحيح (✓ ✓✓)
- [ ] الرسائل الصادرة على اليمين (أخضر)
- [ ] الرسائل الواردة على اليسار (أبيض)

### الوظائف | Functionality:
- [ ] إرسال رسالة يعمل
- [ ] استقبال رسائل جديدة عبر WebSocket يعمل
- [ ] البحث في جهات الاتصال يعمل
- [ ] إنشاء جهة اتصال جديدة يعمل
- [ ] Scroll تلقائي إلى آخر رسالة يعمل

### UX/UI:
- [ ] Loading states تظهر بشكل صحيح
- [ ] Error Banner يظهر عند الأخطاء
- [ ] Empty states جميلة وواضحة
- [ ] الصفحة responsive
- [ ] لا توجد أخطاء في Console

### WebSocket:
- [ ] WebSocket يتصل بنجاح
- [ ] الرسائل الجديدة تظهر فوراً
- [ ] لا يوجد تكرار للرسائل
- [ ] WebSocket يُعيد الاتصال عند الانقطاع

---

## 🐛 المشاكل الشائعة وحلولها | Common Issues & Solutions

### 1. الرسائل لا تظهر:
**السبب:** مشكلة في المصادقة
**الحل:**
```javascript
// تحقق من وجود token
console.log(localStorage.getItem('accessToken'))

// إذا لم يكن موجود، سجل الدخول مرة أخرى
```

### 2. WebSocket لا يعمل:
**السبب:** الخادم الخلفي غير متصل
**الحل:**
```bash
# تحقق من أن الخادم يعمل
netstat -ano | findstr :3000

# إذا لم يكن يعمل، شغله
cd backend
npm start
```

### 3. أخطاء CORS:
**السبب:** Origin غير مسموح
**الحل:** تحقق من أن Frontend يعمل على `http://localhost:3001`

### 4. الرسائل تختفي بعد Refresh:
**السبب:** هذه المشكلة تم إصلاحها! الرسائل تُحفظ في قاعدة البيانات
**التحقق:**
```bash
# تحقق من قاعدة البيانات
curl -X GET "http://localhost:3000/api/v1/whatsapp/messages?limit=5" -b cookies.txt
```

---

## 📝 ملاحظات | Notes

1. **sessionName:** حالياً يتم تحميله من localStorage. القيمة الافتراضية: `456456`
2. **JWT Token:** صالح لمدة 24 ساعة
3. **WebSocket:** يُعيد الاتصال تلقائياً عند الانقطاع
4. **Database:** جميع الرسائل تُحفظ في قاعدة البيانات ولا تختفي

---

**تم إعداده بواسطة | Prepared by:** Augment Agent  
**التاريخ | Date:** 2025-10-03

