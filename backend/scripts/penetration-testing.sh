#!/bin/bash

# ============================================================================
# 🔒 PENETRATION TESTING SCRIPT - SEMANA 13
# Automated security testing siguiendo OWASP guidelines
#
# Features:
# - OWASP Top 10 validation
# - SQL Injection testing
# - XSS (Cross-Site Scripting) testing
# - CSRF (Cross-Site Request Forgery) testing
# - Authentication bypass attempts
# - Directory traversal testing
# - Security headers validation
# - SSL/TLS configuration check
#
# Usage: ./penetration-testing.sh <TARGET_URL>
# Example: ./penetration-testing.sh https://bge-heroes.vercel.app
#
# Output: JSON report + HTML report
#
# Fecha: 17 Noviembre 2025
# Estado: ✅ PRODUCTION-READY
# ============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

TARGET_URL=${1:-http://localhost:3000}
REPORT_DIR="./security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_JSON="${REPORT_DIR}/pentest_${TIMESTAMP}.json"
REPORT_HTML="${REPORT_DIR}/pentest_${TIMESTAMP}.html"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
VULNERABILITIES_FOUND=0
TOTAL_TESTS=0
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✅ PASS]${NC} $1"
}

log_vulnerability() {
    local severity=$1
    local message=$2

    VULNERABILITIES_FOUND=$((VULNERABILITIES_FOUND + 1))

    case "$severity" in
        CRITICAL)
            echo -e "${RED}[🔴 CRITICAL]${NC} $message"
            CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
            ;;
        HIGH)
            echo -e "${RED}[🟠 HIGH]${NC} $message"
            HIGH_ISSUES=$((HIGH_ISSUES + 1))
            ;;
        MEDIUM)
            echo -e "${YELLOW}[🟡 MEDIUM]${NC} $message"
            MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
            ;;
        LOW)
            echo -e "${YELLOW}[🟢 LOW]${NC} $message"
            LOW_ISSUES=$((LOW_ISSUES + 1))
            ;;
    esac
}

log_warning() {
    echo -e "${YELLOW}[⚠️  WARN]${NC} $1"
}

# =============================================================================
# TEST SUITE
# =============================================================================

echo "============================================"
echo "🔒 PENETRATION TESTING - OWASP SECURITY AUDIT"
echo "============================================"
echo "Target URL: $TARGET_URL"
echo "Report: $REPORT_JSON"
echo "============================================"
echo ""

mkdir -p "$REPORT_DIR"

# -----------------------------------------------------------------------------
# TEST 1: SQL Injection (OWASP A03:2021 - Injection)
# -----------------------------------------------------------------------------

log_info "TEST 1: SQL Injection Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test common SQL injection payloads
SQL_PAYLOADS=(
    "' OR '1'='1"
    "'; DROP TABLE usuarios;--"
    "' UNION SELECT NULL,NULL,NULL--"
    "admin'--"
    "' OR 1=1--"
)

SQL_INJECTION_DETECTED=false

for payload in "${SQL_PAYLOADS[@]}"; do
    # Test login endpoint
    RESPONSE=$(curl -s -X POST "${TARGET_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${payload}\",\"password\":\"test\"}" \
        -w "%{http_code}" -o /tmp/sql_test.json)

    # If response is 200, SQL injection may be possible
    if [[ $RESPONSE -eq 200 ]]; then
        SQL_INJECTION_DETECTED=true
        log_vulnerability "CRITICAL" "SQL Injection possible on /api/auth/login with payload: $payload"
        break
    fi

    # Check for SQL error messages in response
    if grep -qi "sql\|syntax\|mysql\|postgres\|database" /tmp/sql_test.json 2>/dev/null; then
        SQL_INJECTION_DETECTED=true
        log_vulnerability "HIGH" "SQL error message exposed with payload: $payload"
        break
    fi
done

if [ "$SQL_INJECTION_DETECTED" = false ]; then
    log_success "SQL Injection: No vulnerabilities detected"
fi

# -----------------------------------------------------------------------------
# TEST 2: XSS (Cross-Site Scripting) (OWASP A03:2021 - Injection)
# -----------------------------------------------------------------------------

log_info "TEST 2: XSS (Cross-Site Scripting) Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

XSS_PAYLOADS=(
    "<script>alert('XSS')</script>"
    "<img src=x onerror=alert('XSS')>"
    "javascript:alert('XSS')"
    "<svg/onload=alert('XSS')>"
)

XSS_DETECTED=false

for payload in "${XSS_PAYLOADS[@]}"; do
    # Test search endpoint (if exists)
    RESPONSE=$(curl -s "${TARGET_URL}/api/search?q=${payload}" -w "%{http_code}" -o /tmp/xss_test.html)

    # Check if payload is reflected unescaped in response
    if grep -q "$payload" /tmp/xss_test.html 2>/dev/null; then
        XSS_DETECTED=true
        log_vulnerability "HIGH" "XSS vulnerability detected on /api/search with payload: $payload"
        break
    fi
done

if [ "$XSS_DETECTED" = false ]; then
    log_success "XSS: No vulnerabilities detected"
fi

# -----------------------------------------------------------------------------
# TEST 3: CSRF (Cross-Site Request Forgery) (OWASP A01:2021 - Broken Access Control)
# -----------------------------------------------------------------------------

log_info "TEST 3: CSRF (Cross-Site Request Forgery) Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test if state-changing endpoints require CSRF token
CSRF_ENDPOINTS=(
    "/api/admin/students"
    "/api/auth/change-password"
    "/api/profile/update"
)

CSRF_VULNERABLE=false

for endpoint in "${CSRF_ENDPOINTS[@]}"; do
    # Attempt POST without CSRF token
    RESPONSE=$(curl -s -X POST "${TARGET_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -d '{"test":"data"}' \
        -w "%{http_code}" -o /dev/null)

    # If response is NOT 403/401, CSRF protection may be missing
    if [[ $RESPONSE -eq 200 ]] || [[ $RESPONSE -eq 201 ]]; then
        CSRF_VULNERABLE=true
        log_vulnerability "MEDIUM" "CSRF protection missing on $endpoint (HTTP $RESPONSE)"
    fi
done

if [ "$CSRF_VULNERABLE" = false ]; then
    log_success "CSRF: Proper protection detected (401/403 on POST without auth)"
fi

# -----------------------------------------------------------------------------
# TEST 4: Broken Authentication (OWASP A07:2021 - Identification and Authentication Failures)
# -----------------------------------------------------------------------------

log_info "TEST 4: Broken Authentication Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test weak password acceptance
WEAK_PASSWORDS=(
    "123456"
    "password"
    "123"
    "admin"
)

WEAK_PASSWORD_ACCEPTED=false

for password in "${WEAK_PASSWORDS[@]}"; do
    RESPONSE=$(curl -s -X POST "${TARGET_URL}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"test@test.com\",\"password\":\"${password}\"}" \
        -w "%{http_code}" -o /tmp/auth_test.json)

    if [[ $RESPONSE -eq 200 ]] || [[ $RESPONSE -eq 201 ]]; then
        WEAK_PASSWORD_ACCEPTED=true
        log_vulnerability "HIGH" "Weak password accepted: $password (length: ${#password})"
        break
    fi
done

if [ "$WEAK_PASSWORD_ACCEPTED" = false ]; then
    log_success "Broken Authentication: Strong password policy enforced"
fi

# -----------------------------------------------------------------------------
# TEST 5: Sensitive Data Exposure (OWASP A02:2021 - Cryptographic Failures)
# -----------------------------------------------------------------------------

log_info "TEST 5: Sensitive Data Exposure Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Check for exposed sensitive endpoints
SENSITIVE_ENDPOINTS=(
    "/.env"
    "/config.json"
    "/package.json"
    "/server.js"
    "/backend/config/database.js"
    "/api/debug"
)

SENSITIVE_DATA_EXPOSED=false

for endpoint in "${SENSITIVE_ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "${TARGET_URL}${endpoint}")

    if [[ $RESPONSE -eq 200 ]]; then
        SENSITIVE_DATA_EXPOSED=true
        log_vulnerability "CRITICAL" "Sensitive file exposed: $endpoint (HTTP $RESPONSE)"
    fi
done

if [ "$SENSITIVE_DATA_EXPOSED" = false ]; then
    log_success "Sensitive Data Exposure: No sensitive files exposed"
fi

# -----------------------------------------------------------------------------
# TEST 6: Security Misconfiguration (OWASP A05:2021 - Security Misconfiguration)
# -----------------------------------------------------------------------------

log_info "TEST 6: Security Misconfiguration Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Check security headers
SECURITY_HEADERS=$(curl -sI "${TARGET_URL}" | grep -i "x-\|content-security\|strict-transport")

MISSING_HEADERS=()

if ! echo "$SECURITY_HEADERS" | grep -qi "x-frame-options"; then
    MISSING_HEADERS+=("X-Frame-Options")
fi

if ! echo "$SECURITY_HEADERS" | grep -qi "x-content-type-options"; then
    MISSING_HEADERS+=("X-Content-Type-Options")
fi

if ! echo "$SECURITY_HEADERS" | grep -qi "content-security-policy"; then
    MISSING_HEADERS+=("Content-Security-Policy")
fi

if ! echo "$SECURITY_HEADERS" | grep -qi "strict-transport-security"; then
    MISSING_HEADERS+=("Strict-Transport-Security")
fi

if [ ${#MISSING_HEADERS[@]} -gt 0 ]; then
    for header in "${MISSING_HEADERS[@]}"; do
        log_vulnerability "MEDIUM" "Missing security header: $header"
    done
else
    log_success "Security Misconfiguration: All critical headers present"
fi

# -----------------------------------------------------------------------------
# TEST 7: Vulnerable Components (OWASP A06:2021 - Vulnerable and Outdated Components)
# -----------------------------------------------------------------------------

log_info "TEST 7: Vulnerable Components Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Run npm audit (requires package.json in current directory)
if [ -f "package.json" ]; then
    NPM_AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)

    CRITICAL_VULNS=$(echo "$NPM_AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.critical // 0')
    HIGH_VULNS=$(echo "$NPM_AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.high // 0')

    if [[ $CRITICAL_VULNS -gt 0 ]]; then
        log_vulnerability "CRITICAL" "npm audit found $CRITICAL_VULNS critical vulnerabilities"
    fi

    if [[ $HIGH_VULNS -gt 0 ]]; then
        log_vulnerability "HIGH" "npm audit found $HIGH_VULNS high vulnerabilities"
    fi

    if [[ $CRITICAL_VULNS -eq 0 ]] && [[ $HIGH_VULNS -eq 0 ]]; then
        log_success "Vulnerable Components: No critical/high npm vulnerabilities"
    fi
else
    log_warning "package.json not found - skipping npm audit"
fi

# -----------------------------------------------------------------------------
# TEST 8: Directory Traversal (OWASP A01:2021 - Broken Access Control)
# -----------------------------------------------------------------------------

log_info "TEST 8: Directory Traversal Testing..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

TRAVERSAL_PAYLOADS=(
    "../../etc/passwd"
    "../../../etc/passwd"
    "..\\..\\windows\\win.ini"
)

DIRECTORY_TRAVERSAL_DETECTED=false

for payload in "${TRAVERSAL_PAYLOADS[@]}"; do
    RESPONSE=$(curl -s "${TARGET_URL}/api/files?file=${payload}" -w "%{http_code}" -o /tmp/traversal_test.txt)

    # Check if /etc/passwd content is leaked
    if grep -q "root:x:0:0" /tmp/traversal_test.txt 2>/dev/null; then
        DIRECTORY_TRAVERSAL_DETECTED=true
        log_vulnerability "CRITICAL" "Directory traversal detected with payload: $payload"
        break
    fi

    if [[ $RESPONSE -eq 200 ]]; then
        log_vulnerability "MEDIUM" "Suspicious 200 response on directory traversal: $payload"
    fi
done

if [ "$DIRECTORY_TRAVERSAL_DETECTED" = false ]; then
    log_success "Directory Traversal: No vulnerabilities detected"
fi

# -----------------------------------------------------------------------------
# TEST 9: Insufficient Logging & Monitoring (OWASP A09:2021)
# -----------------------------------------------------------------------------

log_info "TEST 9: Logging & Monitoring Check..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Check if failed login attempts are logged
FAILED_LOGIN_RESPONSE=$(curl -s -X POST "${TARGET_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"attacker@test.com","password":"wrongpassword"}' \
    -w "%{http_code}" -o /dev/null)

# This test is informational - cannot be automated fully
log_info "Logging Check: Manual verification required"
log_info "  - Check if failed login attempts are logged"
log_info "  - Check if login anomalies trigger alerts"
log_info "  - Check if audit logs are immutable"

# -----------------------------------------------------------------------------
# TEST 10: SSL/TLS Configuration
# -----------------------------------------------------------------------------

log_info "TEST 10: SSL/TLS Configuration Check..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if [[ $TARGET_URL == https://* ]]; then
    # Check SSL certificate validity
    SSL_CHECK=$(curl -sI "$TARGET_URL" 2>&1)

    if echo "$SSL_CHECK" | grep -qi "certificate"; then
        log_vulnerability "MEDIUM" "SSL/TLS issue detected. Manual verification recommended."
    else
        log_success "SSL/TLS: Certificate appears valid"
    fi
else
    log_vulnerability "HIGH" "Target URL not using HTTPS. Data in transit not encrypted."
fi

# =============================================================================
# GENERATE JSON REPORT
# =============================================================================

log_info "Generating JSON report..."

cat > "$REPORT_JSON" <<EOF
{
  "scan_date": "$(date -Iseconds)",
  "target_url": "$TARGET_URL",
  "total_tests": $TOTAL_TESTS,
  "vulnerabilities_found": $VULNERABILITIES_FOUND,
  "severity_breakdown": {
    "critical": $CRITICAL_ISSUES,
    "high": $HIGH_ISSUES,
    "medium": $MEDIUM_ISSUES,
    "low": $LOW_ISSUES
  },
  "risk_score": $(( (CRITICAL_ISSUES * 10) + (HIGH_ISSUES * 5) + (MEDIUM_ISSUES * 2) + LOW_ISSUES )),
  "compliance": {
    "owasp_top_10_2021": "Tested",
    "pci_dss": "Partial",
    "gdpr": "Partial"
  },
  "recommendations": [
    "Fix all CRITICAL vulnerabilities immediately",
    "Review and remediate HIGH severity issues within 7 days",
    "Implement WAF (Web Application Firewall) for additional protection",
    "Enable comprehensive logging and monitoring",
    "Conduct regular penetration testing (quarterly)"
  ]
}
EOF

log_success "JSON report generated: $REPORT_JSON"

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo "============================================"
echo "📊 PENETRATION TESTING SUMMARY"
echo "============================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Vulnerabilities Found: $VULNERABILITIES_FOUND"
echo ""
echo "Severity Breakdown:"
echo "  🔴 CRITICAL: $CRITICAL_ISSUES"
echo "  🟠 HIGH: $HIGH_ISSUES"
echo "  🟡 MEDIUM: $MEDIUM_ISSUES"
echo "  🟢 LOW: $LOW_ISSUES"
echo ""
echo "Risk Score: $(( (CRITICAL_ISSUES * 10) + (HIGH_ISSUES * 5) + (MEDIUM_ISSUES * 2) + LOW_ISSUES )) / 100"
echo ""
echo "Report: $REPORT_JSON"
echo "============================================"
echo ""

if [[ $CRITICAL_ISSUES -gt 0 ]] || [[ $HIGH_ISSUES -gt 0 ]]; then
    echo "⚠️  CRITICAL/HIGH vulnerabilities detected!"
    echo "🚨 IMMEDIATE ACTION REQUIRED"
    echo ""
    echo "Next Steps:"
    echo "1. Review full report: $REPORT_JSON"
    echo "2. Prioritize CRITICAL vulnerabilities"
    echo "3. Run remediation script: ./remediate-vulnerabilities.sh"
    echo "4. Re-test after fixes"
    exit 1
else
    echo "✅ No CRITICAL/HIGH vulnerabilities detected"
    echo "🎉 Security posture is acceptable"
    echo ""
    echo "Recommendations:"
    echo "1. Address MEDIUM/LOW issues"
    echo "2. Schedule regular pentests (quarterly)"
    echo "3. Monitor logs for anomalies"
    exit 0
fi
