#!/bin/bash

# تسجيل الدخول
echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test-org183@example.com", "password": "Test123456"}' | \
  python -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained"
echo ""

# جلب الجلسات
echo "📡 Fetching sessions..."
echo ""
curl -s -X GET "http://localhost:8000/api/v1/whatsapp/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python -m json.tool

echo ""
echo "✅ Done"

