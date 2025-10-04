#!/bin/bash

# 🧪 WhatsApp Messages - Comprehensive Test Suite
# ================================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8000/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk0LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5NTA2NDEzLCJleHAiOjE3NTk1OTI4MTN9.7rFHzNJiWjwrO7wOAJ_EVcZvBezouoKYYKhV8SWD1Iw"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}🧪 Test $TOTAL_TESTS: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ PASSED: $1${NC}\n"
    ((PASSED_TESTS++))
}

print_failure() {
    echo -e "${RED}❌ FAILED: $1${NC}\n"
    ((FAILED_TESTS++))
}

run_test() {
    ((TOTAL_TESTS++))
    print_test "$1"
    
    # Run the curl command
    RESPONSE=$(eval "$2")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    # Check if test passed
    if [[ $HTTP_CODE == $3 ]]; then
        print_success "$1"
        echo "Response: $BODY" | head -c 200
        echo "..."
    else
        print_failure "$1 (Expected: $3, Got: $HTTP_CODE)"
        echo "Response: $BODY"
    fi
}

# ============================================
# Phase 1: Backend API Tests
# ============================================

print_header "Phase 1: Backend API Tests"

# Test 1.1: GET /whatsapp/sessions
run_test "GET /whatsapp/sessions" \
    "curl -s -w '\n%{http_code}' -X GET '$BASE_URL/whatsapp/sessions' -H 'Authorization: Bearer $TOKEN'" \
    "200"

# Test 1.2: GET /whatsapp/contacts
run_test "GET /whatsapp/contacts" \
    "curl -s -w '\n%{http_code}' -X GET '$BASE_URL/whatsapp/contacts' -H 'Authorization: Bearer $TOKEN'" \
    "200"

# Test 1.3: GET /whatsapp/conversations
run_test "GET /whatsapp/conversations" \
    "curl -s -w '\n%{http_code}' -X GET '$BASE_URL/whatsapp/conversations' -H 'Authorization: Bearer $TOKEN'" \
    "200"

# Test 1.4: GET /templates
run_test "GET /templates" \
    "curl -s -w '\n%{http_code}' -X GET '$BASE_URL/templates' -H 'Authorization: Bearer $TOKEN'" \
    "200"

# Test 1.5: GET /users
run_test "GET /users" \
    "curl -s -w '\n%{http_code}' -X GET '$BASE_URL/users' -H 'Authorization: Bearer $TOKEN'" \
    "200"

# ============================================
# Summary
# ============================================

print_header "Test Summary"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed!${NC}\n"
    exit 1
fi

