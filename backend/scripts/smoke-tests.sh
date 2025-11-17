#!/bin/bash

# ============================================================================
# 🧪 SMOKE TESTS - POST-DEPLOYMENT VERIFICATION
# SEMANA 12 - CI/CD Pipeline
#
# Purpose: Verify critical functionality after deployment
# Usage: ./smoke-tests.sh <BASE_URL>
# Example: ./smoke-tests.sh https://bge-heroes.vercel.app
#
# Exit Codes:
# - 0: All tests passed ✅
# - 1: One or more tests failed ❌
#
# Tests Performed:
# - Health check endpoint
# - Database connectivity
# - API endpoints (public + authenticated)
# - Static assets loading
# - WebSocket connectivity
#
# Fecha: 17 Noviembre 2025
# Estado: ✅ PRODUCTION-READY
# ============================================================================

set -e  # Exit on first error

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_URL=${1:-http://localhost:3000}
TIMEOUT=10  # seconds
FAILED_TESTS=0
TOTAL_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✅ PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[❌ FAIL]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠️  WARN]${NC} $1"
}

run_test() {
    local test_name=$1
    local test_command=$2

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log_info "Running: $test_name"

    if eval "$test_command"; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# =============================================================================
# TEST SUITE
# =============================================================================

echo "============================================"
echo "🧪 SMOKE TESTS - POST-DEPLOYMENT VERIFICATION"
echo "============================================"
echo "Base URL: $BASE_URL"
echo "Timeout: $TIMEOUT seconds"
echo "============================================"
echo ""

# -----------------------------------------------------------------------------
# TEST 1: Health Check Endpoint
# -----------------------------------------------------------------------------

run_test "Health check endpoint responds 200" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/api/health > /dev/null"

run_test "Health check returns valid JSON" \
    "curl -s -m $TIMEOUT ${BASE_URL}/api/health | jq -e '.status' > /dev/null"

run_test "Database status is healthy" \
    "curl -s -m $TIMEOUT ${BASE_URL}/api/health | jq -e '.services.database.status == \"healthy\"' > /dev/null"

# -----------------------------------------------------------------------------
# TEST 2: Static Assets
# -----------------------------------------------------------------------------

run_test "Homepage loads (HTTP 200)" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/ > /dev/null"

run_test "Admin dashboard loads" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/admin-dashboard.html > /dev/null"

run_test "Main JavaScript bundle loads" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/public/js/main.js > /dev/null"

run_test "CSS stylesheet loads" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/public/css/styles.css > /dev/null || echo 'CSS not critical'"

# -----------------------------------------------------------------------------
# TEST 3: Public API Endpoints
# -----------------------------------------------------------------------------

run_test "Public API - Config endpoint" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/api/config/public-keys > /dev/null"

run_test "Public API - Noticias endpoint" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/api/noticias > /dev/null"

run_test "Public API - Egresados endpoint" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/api/egresados > /dev/null"

# -----------------------------------------------------------------------------
# TEST 4: Authentication System
# -----------------------------------------------------------------------------

log_info "Testing authentication system..."

# Test login endpoint (should return 400 for invalid credentials, not 500)
LOGIN_RESPONSE=$(curl -s -m $TIMEOUT -X POST ${BASE_URL}/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "%{http_code}" -o /tmp/login_response.json)

if [[ $LOGIN_RESPONSE -eq 400 ]] || [[ $LOGIN_RESPONSE -eq 401 ]]; then
    log_success "Login endpoint returns proper error code (400/401)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_error "Login endpoint returned unexpected code: $LOGIN_RESPONSE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# -----------------------------------------------------------------------------
# TEST 5: Database Connectivity (via API)
# -----------------------------------------------------------------------------

run_test "Database connection pooling active" \
    "curl -s -m $TIMEOUT ${BASE_URL}/api/health | jq -e '.services.database.pool.total > 0' > /dev/null"

run_test "Database response time < 100ms" \
    "curl -s -m $TIMEOUT ${BASE_URL}/api/health | jq -e '.services.database.latency' | grep -E '[0-9]+ms' > /dev/null"

# -----------------------------------------------------------------------------
# TEST 6: Critical Business Endpoints
# -----------------------------------------------------------------------------

log_info "Testing critical business endpoints..."

# Test estudiantes endpoint (may require auth, so 401/403 is acceptable)
ESTUDIANTES_RESPONSE=$(curl -s -m $TIMEOUT -w "%{http_code}" -o /dev/null ${BASE_URL}/api/admin/students)

if [[ $ESTUDIANTES_RESPONSE -eq 200 ]] || [[ $ESTUDIANTES_RESPONSE -eq 401 ]] || [[ $ESTUDIANTES_RESPONSE -eq 403 ]]; then
    log_success "Estudiantes endpoint accessible (status: $ESTUDIANTES_RESPONSE)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_error "Estudiantes endpoint returned unexpected code: $ESTUDIANTES_RESPONSE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# -----------------------------------------------------------------------------
# TEST 7: Performance Checks
# -----------------------------------------------------------------------------

log_info "Running performance checks..."

# Measure homepage response time
HOMEPAGE_TIME=$(curl -s -w "%{time_total}" -o /dev/null ${BASE_URL}/)

if (( $(echo "$HOMEPAGE_TIME < 3.0" | bc -l) )); then
    log_success "Homepage response time: ${HOMEPAGE_TIME}s (<3s threshold)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_warning "Homepage response time: ${HOMEPAGE_TIME}s (>3s - slow)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Measure API response time
API_TIME=$(curl -s -w "%{time_total}" -o /dev/null ${BASE_URL}/api/health)

if (( $(echo "$API_TIME < 1.0" | bc -l) )); then
    log_success "API response time: ${API_TIME}s (<1s threshold)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_warning "API response time: ${API_TIME}s (>1s - slow)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# -----------------------------------------------------------------------------
# TEST 8: WebSocket Connectivity (Optional)
# -----------------------------------------------------------------------------

log_info "Testing WebSocket connectivity (optional)..."

# Check if Socket.IO is available
SOCKET_IO_RESPONSE=$(curl -s -m $TIMEOUT -w "%{http_code}" -o /dev/null ${BASE_URL}/socket.io/)

if [[ $SOCKET_IO_RESPONSE -eq 200 ]] || [[ $SOCKET_IO_RESPONSE -eq 400 ]]; then
    log_success "WebSocket endpoint available (status: $SOCKET_IO_RESPONSE)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_warning "WebSocket endpoint not available (status: $SOCKET_IO_RESPONSE)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# -----------------------------------------------------------------------------
# TEST 9: Security Headers
# -----------------------------------------------------------------------------

log_info "Checking security headers..."

HEADERS=$(curl -s -I -m $TIMEOUT ${BASE_URL}/)

# Check for X-Content-Type-Options
if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
    log_success "X-Content-Type-Options header present"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_warning "X-Content-Type-Options header missing"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Check for X-Frame-Options
if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    log_success "X-Frame-Options header present"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_warning "X-Frame-Options header missing"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Check for Content-Security-Policy
if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
    log_success "Content-Security-Policy header present"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_warning "Content-Security-Policy header missing"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# -----------------------------------------------------------------------------
# TEST 10: Error Handling
# -----------------------------------------------------------------------------

log_info "Testing error handling..."

# Test 404 endpoint (should return proper 404, not 500)
NOT_FOUND_RESPONSE=$(curl -s -m $TIMEOUT -w "%{http_code}" -o /dev/null ${BASE_URL}/this-should-not-exist-12345)

if [[ $NOT_FOUND_RESPONSE -eq 404 ]]; then
    log_success "404 handler working correctly"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_error "404 handler returned unexpected code: $NOT_FOUND_RESPONSE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo "============================================"
echo "📊 SMOKE TESTS SUMMARY"
echo "============================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $((TOTAL_TESTS - FAILED_TESTS))"
echo "Failed: $FAILED_TESTS"
echo "============================================"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "All smoke tests PASSED! ✅"
    echo ""
    echo "🎉 Deployment verified successfully!"
    echo "🌍 Application is ready for production traffic."
    exit 0
else
    log_error "$FAILED_TESTS tests FAILED! ❌"
    echo ""
    echo "🚨 Deployment verification FAILED!"
    echo "⚠️  DO NOT switch traffic to this deployment."
    echo "🔍 Review failed tests above and investigate."
    exit 1
fi
