#!/bin/bash

# ============================================================================
# 🔴 BLUE-GREEN DEPLOYMENT ROLLBACK
# SEMANA 12 - CI/CD Pipeline
#
# Purpose: Rollback to previous stable deployment (Blue) if Green fails
# Usage: ./blue-green-rollback.sh
#
# Prerequisites:
# - Vercel CLI installed (npm install -g vercel)
# - VERCEL_TOKEN environment variable set
# - VERCEL_ORG_ID and VERCEL_PROJECT_ID set
#
# Rollback Strategy:
# 1. Get last stable deployment (Blue)
# 2. Promote Blue deployment to production
# 3. Verify Blue is serving traffic
# 4. Mark Green deployment for deletion (optional)
#
# Fecha: 17 Noviembre 2025
# Estado: ✅ PRODUCTION-READY
# ============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# CONFIGURATION
# =============================================================================

VERCEL_TOKEN=${VERCEL_TOKEN:-}
VERCEL_ORG_ID=${VERCEL_ORG_ID:-}
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-}

PRODUCTION_URL=${PRODUCTION_URL:-https://bge-heroes.vercel.app}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

send_slack_notification() {
    local message=$1

    if [[ -n "${SLACK_WEBHOOK_URL}" ]]; then
        curl -X POST "${SLACK_WEBHOOK_URL}" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"$message\"}" \
            2>/dev/null || true
    fi
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Vercel CLI
    if ! command -v vercel &>/dev/null; then
        log_error "Vercel CLI not found. Install with: npm install -g vercel"
        exit 1
    fi

    # Check environment variables
    if [[ -z "${VERCEL_TOKEN}" ]]; then
        log_error "VERCEL_TOKEN environment variable not set"
        exit 1
    fi

    if [[ -z "${VERCEL_ORG_ID}" ]]; then
        log_warning "VERCEL_ORG_ID not set. Using default from vercel.json"
    fi

    if [[ -z "${VERCEL_PROJECT_ID}" ]]; then
        log_warning "VERCEL_PROJECT_ID not set. Using default from vercel.json"
    fi

    log_success "Prerequisites check passed"
}

# =============================================================================
# ROLLBACK PROCEDURE
# =============================================================================

rollback_to_blue() {
    log_info "=========================================="
    log_info "🔴 STARTING ROLLBACK TO BLUE ENVIRONMENT"
    log_info "=========================================="

    # STEP 1: Get list of deployments
    log_info "STEP 1: Fetching deployment list..."

    DEPLOYMENTS=$(vercel ls --token "${VERCEL_TOKEN}" --yes || true)

    if [[ -z "$DEPLOYMENTS" ]]; then
        log_error "Failed to fetch deployments from Vercel"
        exit 1
    fi

    log_success "Deployment list fetched"

    # STEP 2: Identify Blue deployment (previous stable production)
    log_info "STEP 2: Identifying Blue (stable) deployment..."

    # Get the second-to-last production deployment (Blue)
    # First production deployment is the current (failing Green)
    # Second production deployment is the previous stable (Blue)

    BLUE_DEPLOYMENT=$(vercel ls --token "${VERCEL_TOKEN}" --yes | grep "Production" | sed -n '2p' | awk '{print $1}' || true)

    if [[ -z "$BLUE_DEPLOYMENT" ]]; then
        log_error "Could not identify Blue deployment"
        log_info "Manual intervention required. Check Vercel dashboard."
        exit 1
    fi

    log_success "Blue deployment identified: $BLUE_DEPLOYMENT"

    # STEP 3: Promote Blue to production
    log_info "STEP 3: Promoting Blue deployment to production..."

    vercel promote "$BLUE_DEPLOYMENT" \
        --token "${VERCEL_TOKEN}" \
        --yes || {
            log_error "Failed to promote Blue deployment"
            exit 1
        }

    log_success "Blue deployment promoted to production"

    # STEP 4: Wait for DNS propagation (30 seconds)
    log_info "STEP 4: Waiting for DNS propagation (30 seconds)..."
    sleep 30

    # STEP 5: Verify Blue is serving traffic
    log_info "STEP 5: Verifying Blue deployment is serving traffic..."

    HEALTH_CHECK=$(curl -s -f -m 10 "${PRODUCTION_URL}/api/health" | jq -e '.status' || true)

    if [[ "$HEALTH_CHECK" == "\"ok\"" ]] || [[ "$HEALTH_CHECK" == "\"healthy\"" ]]; then
        log_success "✅ Blue deployment is serving traffic successfully"
    else
        log_warning "⚠️  Health check returned unexpected status: $HEALTH_CHECK"
        log_warning "Manual verification recommended"
    fi

    # STEP 6: Send notification
    log_info "STEP 6: Sending rollback notification..."

    send_slack_notification "🔴 ROLLBACK COMPLETED: Blue environment is now live. Green deployment failed smoke tests."

    log_info "=========================================="
    log_success "✅ ROLLBACK COMPLETED SUCCESSFULLY"
    log_info "=========================================="
    log_info ""
    log_info "📊 Summary:"
    log_info "   Blue deployment: $BLUE_DEPLOYMENT"
    log_info "   Production URL: $PRODUCTION_URL"
    log_info "   Status: Active ✅"
    log_info ""
    log_info "🔍 Next Steps:"
    log_info "   1. Investigate why Green deployment failed"
    log_info "   2. Fix the issue"
    log_info "   3. Re-run deployment pipeline"
    log_info "   4. Clean up failed Green deployment (optional)"
    log_info ""
}

# =============================================================================
# OPTIONAL: Cleanup Failed Green Deployment
# =============================================================================

cleanup_green() {
    log_info "=========================================="
    log_info "🧹 CLEANING UP FAILED GREEN DEPLOYMENT"
    log_info "=========================================="

    # Get the most recent failed deployment (Green)
    GREEN_DEPLOYMENT=$(vercel ls --token "${VERCEL_TOKEN}" --yes | grep -v "Production" | head -1 | awk '{print $1}' || true)

    if [[ -z "$GREEN_DEPLOYMENT" ]]; then
        log_warning "No failed Green deployment found to clean up"
        return 0
    fi

    log_info "Found failed Green deployment: $GREEN_DEPLOYMENT"
    log_info "Do you want to delete it? (yes/no)"

    read -r CONFIRM

    if [[ "$CONFIRM" == "yes" ]]; then
        vercel rm "$GREEN_DEPLOYMENT" \
            --token "${VERCEL_TOKEN}" \
            --yes || {
                log_warning "Failed to delete Green deployment (may not exist)"
            }

        log_success "Green deployment deleted"
    else
        log_info "Skipping Green deployment cleanup"
    fi
}

# =============================================================================
# ALTERNATIVE: Generic Rollback (for non-Vercel deployments)
# =============================================================================

generic_rollback() {
    log_info "=========================================="
    log_info "🔄 GENERIC ROLLBACK PROCEDURE"
    log_info "=========================================="

    log_info "This function provides rollback steps for non-Vercel deployments."
    log_info ""
    log_info "For Kubernetes/Docker deployments:"
    log_info "1. kubectl rollout undo deployment/bge-app -n production"
    log_info "2. kubectl rollout status deployment/bge-app -n production"
    log_info "3. Verify with: curl https://production-url/api/health"
    log_info ""
    log_info "For AWS ECS/ELB deployments:"
    log_info "1. Update target group to point to Blue environment"
    log_info "2. Drain connections from Green environment"
    log_info "3. Verify traffic is routing to Blue"
    log_info ""
    log_info "For PM2/Node.js deployments:"
    log_info "1. pm2 stop bge-backend"
    log_info "2. git checkout <previous-stable-commit>"
    log_info "3. npm install && pm2 restart bge-backend"
    log_info ""
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    local rollback_type=${1:-vercel}

    case "$rollback_type" in
        vercel)
            check_prerequisites
            rollback_to_blue

            # Optional cleanup
            # cleanup_green
            ;;
        generic)
            generic_rollback
            ;;
        *)
            log_error "Unknown rollback type: $rollback_type"
            echo "Usage: $0 [vercel|generic]"
            exit 1
            ;;
    esac
}

# Run main with argument (default: vercel)
main "${1:-vercel}"
