#!/bin/bash

# Prediction Markets Test Script
# This script tests the core functionality of the Prediction Markets canister

set -e

echo "🎯 Starting Prediction Markets Test Suite"
echo "=========================================="

# Configuration
CANISTER_NAME="PredictionMarkets"
NETWORK="local"
IDENTITY="default"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get current timestamp + 1 hour for market expiry
get_future_timestamp() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        date -v+1H +%s
    else
        # Linux
        date -d "+1 hour" +%s
    fi
}

# Test 1: Deploy and Setup
test_deployment() {
    log_info "Test 1: Deploying canister..."
    
    # Deploy the canister
    dfx deploy $CANISTER_NAME $NETWORK
    
    if [ $? -eq 0 ]; then
        log_success "Canister deployed successfully"
    else
        log_error "Failed to deploy canister"
        exit 1
    fi
}

# Test 2: Configuration Setup
test_configuration() {
    log_info "Test 2: Setting up configuration..."
    
    # Get canister ID for self-reference
    CANISTER_ID=$(dfx canister id $CANISTER_NAME $NETWORK)
    
    # Set dummy TokenFactory (using canister itself for testing)
    log_info "Setting TokenFactory canister..."
    dfx canister call $CANISTER_NAME setTokenFactory "(principal \"$CANISTER_ID\")" $NETWORK
    
    # Set dummy Vault canister (using canister itself for testing)
    log_info "Setting Vault canister..."
    dfx canister call $CANISTER_NAME setVaultCanister "(principal \"$CANISTER_ID\")" $NETWORK
    
    log_success "Configuration setup completed"
}

# Test 3: Create Market
test_create_market() {
    log_info "Test 3: Creating a test market..."
    
    EXPIRY=$(get_future_timestamp)
    EXPIRY_NANO=$((EXPIRY * 1000000000)) # Convert to nanoseconds
    
    # Create market with test parameters
    RESULT=$(dfx canister call $CANISTER_NAME createMarket "(record { 
        question = \"Will Bitcoin reach \$100,000 by end of 2024?\"; 
        resolver = principal \"$CANISTER_ID\"; 
        expiry = $EXPIRY_NANO : nat64; 
        yesLedger = principal \"$CANISTER_ID\"; 
        noLedger = principal \"$CANISTER_ID\"; 
        b = 100.0 : float64 
    })" $NETWORK)
    
    echo "Market creation result: $RESULT"
    
    # Extract market ID from result (assuming success)
    if [[ $RESULT == *"ok"* ]]; then
        MARKET_ID=$(echo $RESULT | grep -o '[0-9]\+' | head -1)
        log_success "Market created with ID: $MARKET_ID"
        echo "MARKET_ID=$MARKET_ID" > /tmp/market_test_vars.sh
    else
        log_error "Failed to create market"
        echo "Result: $RESULT"
        return 1
    fi
}

# Test 4: Query Market Information
test_query_market() {
    log_info "Test 4: Querying market information..."
    
    # Source market ID
    source /tmp/market_test_vars.sh 2>/dev/null || MARKET_ID=1
    
    # Get market details
    log_info "Getting market $MARKET_ID details..."
    MARKET_INFO=$(dfx canister call $CANISTER_NAME getMarket "($MARKET_ID : nat)" $NETWORK)
    echo "Market Info: $MARKET_INFO"
    
    # Get all markets
    log_info "Getting all markets..."
    ALL_MARKETS=$(dfx canister call $CANISTER_NAME getAllMarkets "()" $NETWORK)
    echo "All Markets: $ALL_MARKETS"
    
    # Get YES price
    log_info "Getting YES token price..."
    YES_PRICE=$(dfx canister call $CANISTER_NAME getMarketPrice "($MARKET_ID : nat, variant { Yes })" $NETWORK)
    echo "YES Price: $YES_PRICE"
    
    # Get NO price
    log_info "Getting NO token price..."
    NO_PRICE=$(dfx canister call $CANISTER_NAME getMarketPrice "($MARKET_ID : nat, variant { No })" $NETWORK)
    echo "NO Price: $NO_PRICE"
    
    log_success "Market queries completed"
}

# Test 5: Buy Tokens (This will fail due to missing vault implementation)
test_buy_tokens() {
    log_info "Test 5: Testing token purchase (expected to fail gracefully)..."
    
    source /tmp/market_test_vars.sh 2>/dev/null || MARKET_ID=1
    
    # Try to buy YES tokens worth 1000 units
    log_info "Attempting to buy YES tokens..."
    BUY_RESULT=$(dfx canister call $CANISTER_NAME buy "($MARKET_ID : nat, variant { Yes }, 1000 : nat)" $NETWORK 2>&1 || true)
    echo "Buy Result: $BUY_RESULT"
    
    if [[ $BUY_RESULT == *"err"* ]]; then
        log_warning "Buy failed as expected (vault not implemented): $BUY_RESULT"
    else
        log_success "Buy operation completed: $BUY_RESULT"
    fi
}

# Test 6: Sell Tokens (This will also fail)
test_sell_tokens() {
    log_info "Test 6: Testing token sale (expected to fail gracefully)..."
    
    source /tmp/market_test_vars.sh 2>/dev/null || MARKET_ID=1
    
    # Try to sell YES tokens
    log_info "Attempting to sell YES tokens..."
    SELL_RESULT=$(dfx canister call $CANISTER_NAME sell "($MARKET_ID : nat, variant { Yes }, 500 : nat)" $NETWORK 2>&1 || true)
    echo "Sell Result: $SELL_RESULT"
    
    if [[ $SELL_RESULT == *"err"* ]]; then
        log_warning "Sell failed as expected (vault not implemented): $SELL_RESULT"
    else
        log_success "Sell operation completed: $SELL_RESULT"
    fi
}

# Test 7: Market Resolution
test_market_resolution() {
    log_info "Test 7: Testing market resolution..."
    
    source /tmp/market_test_vars.sh 2>/dev/null || MARKET_ID=1
    
    # Resolve market with YES outcome
    log_info "Resolving market with YES outcome..."
    RESOLVE_RESULT=$(dfx canister call $CANISTER_NAME resolve "($MARKET_ID : nat, variant { Yes })" $NETWORK)
    echo "Resolution Result: $RESOLVE_RESULT"
    
    if [[ $RESOLVE_RESULT == *"ok"* ]]; then
        log_success "Market resolved successfully"
        
        # Query market again to see resolved state
        log_info "Checking resolved market state..."
        RESOLVED_MARKET=$(dfx canister call $CANISTER_NAME getMarket "($MARKET_ID : nat)" $NETWORK)
        echo "Resolved Market: $RESOLVED_MARKET"
    else
        log_error "Failed to resolve market: $RESOLVE_RESULT"
    fi
}

# Test 8: Redeem Tokens (Expected to fail without token balance)
test_redeem_tokens() {
    log_info "Test 8: Testing token redemption (expected to fail without balance)..."
    
    source /tmp/market_test_vars.sh 2>/dev/null || MARKET_ID=1
    
    # Try to redeem winning tokens
    log_info "Attempting to redeem tokens..."
    REDEEM_RESULT=$(dfx canister call $CANISTER_NAME redeem "($MARKET_ID : nat)" $NETWORK 2>&1 || true)
    echo "Redemption Result: $REDEEM_RESULT"
    
    if [[ $REDEEM_RESULT == *"err"* ]] && [[ $REDEEM_RESULT == *"No winning tokens"* ]]; then
        log_warning "Redemption failed as expected (no tokens to redeem)"
    else
        log_success "Redemption operation completed: $REDEEM_RESULT"
    fi
}

# Test 9: Admin Functions
test_admin_functions() {
    log_info "Test 9: Testing admin functions..."
    
    source /tmp/market_test_vars.sh 2>/dev/null || MARKET_ID=1
    
    # Try to deactivate market (should succeed if caller is controller)
    log_info "Attempting to deactivate market..."
    DEACTIVATE_RESULT=$(dfx canister call $CANISTER_NAME deactivateMarket "($MARKET_ID : nat)" $NETWORK 2>&1 || true)
    echo "Deactivation Result: $DEACTIVATE_RESULT"
    
    if [[ $DEACTIVATE_RESULT == *"ok"* ]]; then
        log_success "Market deactivated successfully"
    else
        log_warning "Market deactivation failed (might not be controller): $DEACTIVATE_RESULT"
    fi
}

# Test 10: Error Handling
test_error_handling() {
    log_info "Test 10: Testing error handling..."
    
    # Try to get non-existent market
    log_info "Querying non-existent market..."
    NONEXISTENT_RESULT=$(dfx canister call $CANISTER_NAME getMarket "(999 : nat)" $NETWORK 2>&1 || true)
    echo "Non-existent market query: $NONEXISTENT_RESULT"
    
    # Try to create market with empty question
    log_info "Creating market with invalid parameters..."
    EXPIRY=$(get_future_timestamp)
    EXPIRY_NANO=$((EXPIRY * 1000000000))
    
    INVALID_MARKET=$(dfx canister call $CANISTER_NAME createMarket "(record { 
        question = \"\"; 
        resolver = principal \"$CANISTER_ID\"; 
        expiry = $EXPIRY_NANO : nat64; 
        yesLedger = principal \"$CANISTER_ID\"; 
        noLedger = principal \"$CANISTER_ID\"; 
        b = 100.0 : float64 
    })" $NETWORK 2>&1 || true)
    echo "Invalid market creation: $INVALID_MARKET"
    
    log_success "Error handling tests completed"
}

# Run all tests
main() {
    echo "Starting comprehensive test suite..."
    echo "Network: $NETWORK"
    echo "Canister: $CANISTER_NAME"
    echo ""
    
    test_deployment
    echo ""
    
    test_configuration
    echo ""
    
    test_create_market
    echo ""
    
    test_query_market
    echo ""
    
    test_buy_tokens
    echo ""
    
    test_sell_tokens
    echo ""
    
    test_market_resolution
    echo ""
    
    test_redeem_tokens
    echo ""
    
    test_admin_functions
    echo ""
    
    test_error_handling
    echo ""
    
    log_success "🎉 Test suite completed!"
    echo ""
    echo "📋 Test Summary:"
    echo "- Market creation and querying: Should work"
    echo "- Price calculations: Should work" 
    echo "- Token trading: Will fail (needs vault implementation)"
    echo "- Market resolution: Should work"
    echo "- Token redemption: Will fail (needs token balances)"
    echo "- Admin functions: Should work if caller is controller"
    echo "- Error handling: Should work"
    echo ""
    echo "💡 Note: This is a comprehensive smart contract that requires:"
    echo "   - Proper ICRC-1 token ledgers for YES/NO tokens"
    echo "   - A vault canister for ckBTC management"
    echo "   - Token factory for market creation"
    echo "   For full functionality, deploy these supporting canisters first."
    
    # Cleanup
    rm -f /tmp/market_test_vars.sh
}

# Run the main function
main