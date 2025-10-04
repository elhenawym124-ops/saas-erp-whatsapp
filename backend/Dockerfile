# استخدام Node.js 18 Alpine
FROM node:18-alpine

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production

# نسخ باقي الملفات
COPY . .

# إنشاء المجلدات المطلوبة
RUN mkdir -p logs uploads sessions

# تعيين المتغيرات البيئية
ENV NODE_ENV=production
ENV PORT=3000

# فتح المنفذ
EXPOSE 3000

# تشغيل التطبيق
CMD ["npm", "start"]

