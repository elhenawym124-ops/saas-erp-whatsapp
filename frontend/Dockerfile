# المرحلة 1: البناء
FROM node:18-alpine AS builder

WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci

# نسخ باقي الملفات
COPY . .

# بناء التطبيق
RUN npm run build

# المرحلة 2: الإنتاج
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# نسخ الملفات المطلوبة من مرحلة البناء
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# إنشاء مستخدم غير root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]

