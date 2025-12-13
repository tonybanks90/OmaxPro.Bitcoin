#!/usr/bin/env bash
# ================================================
# CKBoost Resolver Script
# ================================================
# This script starts the automated CKBoost resolver
# that monitors and processes boost requests from
# platform users.
#
# Requirements:
#   - Node.js and npm installed
#   - .env file with BOOSTER_MNEMONIC configured
#   - ckTESTBTC balance for the booster wallet
#
# Usage:
#   ./run_ckboost_resolver.sh [options]
#
# Options:
#   --help          Show this help message
#   --dev           Run in development mode (watch mode)
#   --pm2           Run as a background service with PM2
#   --pm2-stop      Stop the PM2 background service
#   --pm2-logs      View PM2 logs
#   --status        Check if resolver is running
#
# ================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/src/omax-pro-frontend"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}🚀 CKBoost Resolver${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

show_help() {
    echo "Usage: ./run_ckboost_resolver.sh [options]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --dev           Run in development mode (watch mode)"
    echo "  --pm2           Run as a background service with PM2"
    echo "  --pm2-stop      Stop the PM2 background service"
    echo "  --pm2-restart   Restart the PM2 background service"
    echo "  --pm2-logs      View PM2 logs"
    echo "  --status        Check if resolver is running"
    echo ""
    echo "Configuration (via .env file):"
    echo "  BOOSTER_MNEMONIC      - 12-word mnemonic for booster wallet (required)"
    echo "  ICP_HOST              - ICP network host (default: https://icp0.io)"
    echo "  MAX_AMOUNT_BTC        - Maximum amount per request (default: 0.1)"
    echo "  MIN_FEE_PERCENTAGE    - Minimum fee to accept (default: 0.5)"
    echo "  CHECK_INTERVAL_MS     - Check interval in ms (default: 30000)"
    echo "  INITIAL_DEPOSIT       - Initial deposit amount (default: 0.05)"
    echo "  PLATFORM_ONLY         - Only serve platform users (default: true)"
    echo ""
}

check_requirements() {
    print_info "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm found: $(npm --version)"
    
    # Check frontend directory
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    print_success "Frontend directory found"
    
    # Check .env file
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_warning ".env file not found in frontend directory"
        print_info "Creating template .env file..."
        cat > "$FRONTEND_DIR/.env" << 'EOF'
# CKBoost Booster Configuration
# ==============================

# REQUIRED: Your 12-word mnemonic phrase for the booster wallet
BOOSTER_MNEMONIC="your twelve word mnemonic phrase here"

# ICP Network host
ICP_HOST=https://icp0.io

# Maximum amount per boost request (in ckTESTBTC)
MAX_AMOUNT_BTC=0.1

# Minimum fee percentage to accept requests
MIN_FEE_PERCENTAGE=0.5

# How often to check for new requests (in milliseconds)
CHECK_INTERVAL_MS=30000

# Initial deposit amount (in ckTESTBTC)
INITIAL_DEPOSIT=0.05

# Only accept requests from registered platform users
PLATFORM_ONLY=true
EOF
        print_warning "Please edit $FRONTEND_DIR/.env with your BOOSTER_MNEMONIC"
        exit 1
    fi
    print_success ".env file found"
    
    # Check if BOOSTER_MNEMONIC is set
    if grep -q 'BOOSTER_MNEMONIC="your twelve word' "$FRONTEND_DIR/.env"; then
        print_error "BOOSTER_MNEMONIC is not configured in .env file"
        print_info "Please edit $FRONTEND_DIR/.env and set your 12-word mnemonic"
        exit 1
    fi
    print_success "BOOSTER_MNEMONIC is configured"
    
    # Check node_modules
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_warning "Dependencies not installed"
        print_info "Installing dependencies..."
        cd "$FRONTEND_DIR"
        npm install
        print_success "Dependencies installed"
    fi
    
    echo ""
}

check_status() {
    print_header
    
    echo "📊 Resolver Status"
    echo "===================="
    
    # Check for direct process
    if pgrep -f "tsx src/booster.ts" > /dev/null 2>&1; then
        print_success "Booster process is running (direct)"
        echo ""
        pgrep -a -f "tsx src/booster.ts" | head -3
    elif pgrep -f "node.*booster" > /dev/null 2>&1; then
        print_success "Booster process is running (node)"
    else
        print_warning "No direct booster process detected"
    fi
    
    # Check PM2
    if command -v pm2 &> /dev/null; then
        echo ""
        echo "📦 PM2 Status:"
        pm2 list 2>/dev/null | grep -E "ckboost|Name" || echo "   No PM2 processes found"
    fi
    
    echo ""
}

run_resolver() {
    local mode=$1
    
    print_header
    check_requirements
    
    cd "$FRONTEND_DIR"
    
    case $mode in
        "dev")
            print_info "Starting resolver in development mode (watch)..."
            echo ""
            npm run booster:dev
            ;;
        "pm2")
            if ! command -v pm2 &> /dev/null; then
                print_error "PM2 is not installed"
                print_info "Install it with: npm install -g pm2"
                exit 1
            fi
            print_info "Starting resolver with PM2..."
            npm run booster:pm2
            echo ""
            print_success "Resolver started as background service"
            print_info "View logs with: ./run_ckboost_resolver.sh --pm2-logs"
            print_info "Stop with: ./run_ckboost_resolver.sh --pm2-stop"
            ;;
        "pm2-stop")
            if ! command -v pm2 &> /dev/null; then
                print_error "PM2 is not installed"
                exit 1
            fi
            print_info "Stopping PM2 service..."
            npm run booster:pm2:stop || true
            print_success "Resolver stopped"
            ;;
        "pm2-restart")
            if ! command -v pm2 &> /dev/null; then
                print_error "PM2 is not installed"
                exit 1
            fi
            print_info "Restarting PM2 service..."
            npm run booster:pm2:restart
            print_success "Resolver restarted"
            ;;
        "pm2-logs")
            if ! command -v pm2 &> /dev/null; then
                print_error "PM2 is not installed"
                exit 1
            fi
            npm run booster:pm2:logs
            ;;
        *)
            print_info "Starting resolver..."
            echo ""
            echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
            echo ""
            npm run booster
            ;;
    esac
}

# Main
case "${1:-}" in
    --help|-h)
        show_help
        ;;
    --dev)
        run_resolver "dev"
        ;;
    --pm2)
        run_resolver "pm2"
        ;;
    --pm2-stop)
        run_resolver "pm2-stop"
        ;;
    --pm2-restart)
        run_resolver "pm2-restart"
        ;;
    --pm2-logs)
        run_resolver "pm2-logs"
        ;;
    --status)
        check_status
        ;;
    "")
        run_resolver "default"
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
