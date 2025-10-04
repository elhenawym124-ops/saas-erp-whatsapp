#!/bin/bash

# 🧪 WhatsApp Messages - Comprehensive Test Suite
# ================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BASE_URL="http://localhost:8000/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk0LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5NTA2NDEzLCJleHAiOjE3NTk1OTI4MTN9.7rFHzNJiWjwrO7wOAJ_EVcZvBezouoKYYKhV8SWD1Iw"

# Test counters
TOTAL=0
PASSED=0
FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

run_test() {
    ((TOTAL++))
    local test_name="$1"
    local curl_cmd="$2"
    local expected_code="${3:-200}"
    
    echo -e "${YELLOW}🧪 Test $TOTAL: $test_name${NC}"
    
    # Run curl and capture response + HTTP code
    local response=$(eval "$curl_cmd -w '\n%{http_code}'")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)
    
    # Check result
    if [[ "$http_code" == "$expected_code" ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        # Show first 150 chars of response
        echo "$body" | head -c 150
        echo "..."
    else
        echo -e "${RED}❌ FAILED (Expected: $expected_code, Got: $http_code)${NC}"
        ((FAILED++))
        echo "$body" | head -c 200
    fi
    echo ""
}

# ============================================
# Phase 1: Backend API Tests
# ============================================

print_header "Phase 1: Backend API Tests"

run_test "GET /whatsapp/sessions" \
    "curl -s -X GET '$BASE_URL/whatsapp/sessions' -H 'Authorization: Bearer $TOKEN'"

run_test "GET /whatsapp/contacts" \
    "curl -s -X GET '$BASE_URL/whatsapp/contacts' -H 'Authorization: Bearer $TOKEN'"

run_test "GET /whatsapp/conversations" \
    "curl -s -X GET '$BASE_URL/whatsapp/conversations' -H 'Authorization: Bearer $TOKEN'"

run_test "GET /templates" \
    "curl -s -X GET '$BASE_URL/templates' -H 'Authorization: Bearer $TOKEN'"

run_test "GET /whatsapp/messages?phoneNumber=201123087745" \
    "curl -s -X GET '$BASE_URL/whatsapp/messages?phoneNumber=201123087745' -H 'Authorization: Bearer $TOKEN'"

# ============================================
# Phase 2: Message Operations
# ============================================

print_header "Phase 2: Message Operations Tests"

run_test "POST /whatsapp/messages/send (text)" \
    "curl -s -X POST '$BASE_URL/whatsapp/messages/send' \
    -H 'Authorization: Bearer $TOKEN' \
    -H 'Content-Type: application/json' \
    -d '{\"sessionName\":\"123\",\"to\":\"201017854018\",\"text\":\"🧪 Test from automated suite\"}'"

# Wait for message to be processed
sleep 2

run_test "GET /whatsapp/messages?phoneNumber=201017854018 (after send)" \
    "curl -s -X GET '$BASE_URL/whatsapp/messages?phoneNumber=201017854018' -H 'Authorization: Bearer $TOKEN'"

# ============================================
# Phase 3: Template Tests
# ============================================

print_header "Phase 3: Template Tests"

run_test "GET /templates (list all)" \
    "curl -s -X GET '$BASE_URL/templates' -H 'Authorization: Bearer $TOKEN'"

run_test "GET /templates/shortcut/%2Fhello" \
    "curl -s -X GET '$BASE_URL/templates/shortcut/%2Fhello' -H 'Authorization: Bearer $TOKEN'"

run_test "POST /templates/13/use" \
    "curl -s -X POST '$BASE_URL/templates/13/use' -H 'Authorization: Bearer $TOKEN'"

# ============================================
# Phase 4: Conversation Management
# ============================================

print_header "Phase 4: Conversation Management Tests"

run_test "GET /whatsapp/conversations (list)" \
    "curl -s -X GET '$BASE_URL/whatsapp/conversations' -H 'Authorization: Bearer $TOKEN'"

# ============================================
# Phase 5: Error Handling Tests
# ============================================

print_header "Phase 5: Error Handling Tests"

run_test "GET /whatsapp/messages?contact=invalid (should fail)" \
    "curl -s -X GET '$BASE_URL/whatsapp/messages?contact=invalid' -H 'Authorization: Bearer $TOKEN'" \
    "400"

run_test "GET /templates/shortcut/nonexistent (should fail)" \
    "curl -s -X GET '$BASE_URL/templates/shortcut/nonexistent' -H 'Authorization: Bearer $TOKEN'" \
    "404"

run_test "POST /whatsapp/messages/send (missing data)" \
    "curl -s -X POST '$BASE_URL/whatsapp/messages/send' \
    -H 'Authorization: Bearer $TOKEN' \
    -H 'Content-Type: application/json' \
    -d '{}'" \
    "400"

# ============================================
# Summary
# ============================================

print_header "Test Summary"
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED/$TOTAL)*100}")
echo -e "Success Rate: ${CYAN}$SUCCESS_RATE%${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  $FAILED test(s) failed!${NC}\n"
    exit 1
fi

