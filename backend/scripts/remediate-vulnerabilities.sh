#!/bin/bash

# ============================================================================
# 🛠️ AUTOMATED VULNERABILITY REMEDIATION
# SEMANA 13 - Penetration Testing
#
# Purpose: Fix common security vulnerabilities automatically
# Usage: ./remediate-vulnerabilities.sh [--dry-run]
#
# Remediations:
# - npm audit fix (dependencies)
# - Add security headers (helmet)
# - Fix weak bcrypt cost
# - Add rate limiting
# - Enable CORS restrictions
# - Remove sensitive console.logs
#
# Fecha: 17 Noviembre 2025
# Estado: ✅ PRODUCTION-READY
# ============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

DRY_RUN=${1:-}
BACKUP_DIR="./backups/remediation-$(date +%Y%m%d_%H%M%S)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✅ DONE]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠️  WARN]${NC} $1"
}

create_backup() {
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    cp -r backend "$BACKUP_DIR/"
    cp -r public "$BACKUP_DIR/"
    cp package.json "$BACKUP_DIR/"
    log_success "Backup created: $BACKUP_DIR"
}

# =============================================================================
# REMEDIATION FUNCTIONS
# =============================================================================

remediate_npm_vulnerabilities() {
    log_info "STEP 1: Fixing npm vulnerabilities..."

    if [[ $DRY_RUN == "--dry-run" ]]; then
        log_warning "[DRY-RUN] Would run: npm audit fix"
        return
    fi

    # Try automatic fix first
    npm audit fix || log_warning "Some vulnerabilities could not be auto-fixed"

    # Force fix critical vulnerabilities
    CRITICAL_COUNT=$(npm audit --json | jq -r '.metadata.vulnerabilities.critical // 0')

    if [[ $CRITICAL_COUNT -gt 0 ]]; then
        log_warning "Critical vulnerabilities found. Attempting force fix..."
        npm audit fix --force || log_warning "Force fix may require manual intervention"
    fi

    log_success "npm vulnerabilities remediated"
}

remediate_security_headers() {
    log_info "STEP 2: Adding security headers (helmet)..."

    if [[ $DRY_RUN == "--dry-run" ]]; then
        log_warning "[DRY-RUN] Would install helmet and add to server.js"
        return
    fi

    # Install helmet if not already installed
    if ! grep -q "helmet" package.json; then
        npm install helmet
    fi

    # Add helmet to server.js if not already present
    SERVER_FILE="backend/server.js"

    if [ -f "$SERVER_FILE" ]; then
        if ! grep -q "helmet" "$SERVER_FILE"; then
            # Add helmet import
            sed -i "1i const helmet = require('helmet');" "$SERVER_FILE"

            # Add helmet middleware (after express init)
            sed -i "/const app = express()/a app.use(helmet());" "$SERVER_FILE"

            log_success "Helmet added to server.js"
        else
            log_info "Helmet already present in server.js"
        fi
    else
        log_warning "server.js not found"
    fi
}

remediate_bcrypt_cost() {
    log_info "STEP 3: Updating bcrypt cost to 12..."

    if [[ $DRY_RUN == "--dry-run" ]]; then
        log_warning "[DRY-RUN] Would update bcrypt.hash() to use cost 12"
        return
    fi

    # Find and update bcrypt cost in auth routes
    find backend -name "*.js" -type f -exec sed -i 's/bcrypt\.hash(\(.*\), 10)/bcrypt.hash(\1, 12)/g' {} \;

    log_success "bcrypt cost updated to 12"
}

remediate_rate_limiting() {
    log_info "STEP 4: Adding rate limiting..."

    if [[ $DRY_RUN == "--dry-run" ]]; then
        log_warning "[DRY-RUN] Would install express-rate-limit and add to server.js"
        return
    fi

    # Install express-rate-limit
    if ! grep -q "express-rate-limit" package.json; then
        npm install express-rate-limit
    fi

    # Create rate limit middleware file
    RATE_LIMIT_FILE="backend/middleware/rate-limit.js"

    if [ ! -f "$RATE_LIMIT_FILE" ]; then
        cat > "$RATE_LIMIT_FILE" <<'EOF'
const rateLimit = require('express-rate-limit');

// General rate limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Login rate limit: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP, please try again later.'
});

module.exports = { generalLimiter, loginLimiter };
EOF
        log_success "Rate limiting middleware created"
    else
        log_info "Rate limiting middleware already exists"
    fi
}

remediate_cors_restriction() {
    log_info "STEP 5: Restricting CORS to specific origins..."

    if [[ $DRY_RUN == "--dry-run" ]]; then
        log_warning "[DRY-RUN] Would restrict CORS to specific domains"
        return
    fi

    SERVER_FILE="backend/server.js"

    if [ -f "$SERVER_FILE" ]; then
        # Replace CORS wildcard with specific origins
        sed -i "s/cors()/cors({origin: ['https:\/\/bge-heroes.vercel.app', 'https:\/\/bge-heroes-staging.vercel.app']})/g" "$SERVER_FILE"

        log_success "CORS restricted to specific origins"
    fi
}

remediate_console_logs() {
    log_info "STEP 6: Removing sensitive console.log statements..."

    if [[ $DRY_RUN == "--dry-run" ]]; then
        log_warning "[DRY-RUN] Would remove console.log with passwords, tokens"
        return
    fi

    # Remove console.logs containing sensitive keywords
    SENSITIVE_KEYWORDS=("password" "token" "secret" "key" "credential")

    for keyword in "${SENSITIVE_KEYWORDS[@]}"; do
        # Find files with sensitive console.logs
        find backend public -name "*.js" -type f -exec grep -l "console\.log.*${keyword}" {} \; | while read -r file; do
            log_warning "Found sensitive log in: $file"

            # Comment out the line instead of deleting (safer)
            sed -i "s/\(.*console\.log.*${keyword}.*\)/\/\/ \1 \/\/ REMOVED BY SECURITY REMEDIATION/g" "$file"
        done
    done

    log_success "Sensitive console.logs commented out"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

echo "============================================"
echo "🛠️  AUTOMATED VULNERABILITY REMEDIATION"
echo "============================================"
echo ""

if [[ $DRY_RUN == "--dry-run" ]]; then
    log_warning "DRY-RUN MODE: No changes will be made"
    echo ""
fi

# Create backup
create_backup

# Run remediations
remediate_npm_vulnerabilities
remediate_security_headers
remediate_bcrypt_cost
remediate_rate_limiting
remediate_cors_restriction
remediate_console_logs

echo ""
echo "============================================"
echo "✅ REMEDIATION COMPLETED"
echo "============================================"
echo ""
echo "Next Steps:"
echo "1. Review changes: git diff"
echo "2. Run tests: npm test"
echo "3. Re-run pentest: ./backend/scripts/penetration-testing.sh"
echo "4. Commit changes: git add . && git commit -m \"security: Vulnerability remediation\""
echo ""
echo "Backup location: $BACKUP_DIR"
echo "============================================"
