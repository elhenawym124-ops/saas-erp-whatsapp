# 🧪 صفحة اختبار الرسائل (Test Messages Page)

## 📋 الوصف

صفحة اختبار مؤقتة للتحقق من أن مشكلة عدم ظهور الرسائل في الواجهة الأمامية تم حلها.

## 🎯 الهدف

التأكد من أن الإصلاحات الأخيرة في `backend/src/controllers/whatsappController.js` تعمل بشكل صحيح، وتحديداً:
- دعم صيغة `@s.whatsapp.net` (أرقام عادية)
- دعم صيغة `@lid` (WhatsApp Business/Channels)
- دعم صيغة `@g.us` (مجموعات WhatsApp)

## 🚀 كيفية الوصول

افتح المتصفح على: `http://localhost:8001/test-messages`

## 📝 كيفية الاستخدام

### الطريقة الأولى: إدخال يدوي
1. أدخل رقم الهاتف في حقل الإدخال (بدون @ أو أي إضافات)
2. اضغط على زر "جلب الرسائل" أو اضغط Enter
3. انتظر النتائج

### الطريقة الثانية: أرقام اختبار سريعة
استخدم الأزرار الجاهزة لاختبار أرقام مختلفة:
- **رقم عادي (@s.whatsapp.net)**: `201123087139`
- **رقم Business (@lid)**: `242477344759810`
- **مجموعة (@g.us)**: `120363420803971218`
- **رقم آخر**: `201112257060`

## 📊 ما يتم عرضه

### 1. معلومات الطلب (Request Info)
- URL الكامل للـ API
- Token المستخدم (أول 20 حرف فقط)
- وقت الطلب (Timestamp)
- حالة الاستجابة (Status Code)

### 2. النتيجة (Summary)
- عدد الرسائل المسترجعة
- رقم الصفحة الحالية
- إجمالي عدد الرسائل
- إجمالي عدد الصفحات

### 3. جدول الرسائل
يعرض تفاصيل كل رسالة:
- ID
- الاتجاه (inbound/outbound)
- من (From Number)
- إلى (To Number)
- المحتوى (Content)
- التاريخ (Created At)

### 4. Raw JSON Response
عرض الاستجابة الكاملة من API بصيغة JSON

## 🔍 التشخيص

### في حالة النجاح ✅
يجب أن ترى:
- Status Code: **200**
- عدد الرسائل > 0
- جدول يحتوي على الرسائل
- Raw JSON يحتوي على البيانات الكاملة

### في حالة الفشل ❌
تحقق من:
- هل Status Code = 200؟
- هل عدد الرسائل = 0؟
- هل هناك رسالة خطأ معروضة؟
- افتح Console (F12) وتحقق من السجلات

## 🐛 السجلات (Logs)

الصفحة تطبع سجلات مفصلة في Console:
```
🔍 Test Page - Fetching messages: { url, phoneNumber, token, timestamp }
📊 Test Page - Response status: 200
✅ Test Page - Response data: { ... }
📊 Test Page - Messages count: 7
📋 Test Page - First message: { ... }
```

## 🧹 بعد الانتهاء

هذه صفحة اختبار مؤقتة. بعد التأكد من حل المشكلة، يمكن حذف:
- `frontend/src/app/test-messages/page.tsx`
- `frontend/src/app/test-messages/README.md`

## 📌 ملاحظات

- الصفحة تستخدم `getAccessToken()` من `@/utils/tokenUtils`
- الصفحة تستدعي API مباشرة بدون استخدام hooks مخصصة
- الصفحة مصممة للتشخيص فقط، وليست للاستخدام في الإنتاج
- تأكد من تسجيل الدخول قبل استخدام الصفحة

## 🔗 الملفات ذات الصلة

- Backend Controller: `backend/src/controllers/whatsappController.js`
- Token Utils: `frontend/src/utils/tokenUtils.ts`
- Main Messages Page: `frontend/src/app/dashboard/whatsapp/messages/page.tsx`

