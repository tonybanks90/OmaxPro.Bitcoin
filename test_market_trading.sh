#!/bin/bash

# Test market trading with proper setup
# This script helps test the prediction market by:
# 1. Checking market state
# 2. Getting current prices
# 3. Executing test trades

set -e

NETWORK="local"
MARKET_ID=${1:-7}  # Default to market 7 if not specified
DFX="dfx"

echo "=========================================="
echo "Testing Market Trading - Market ID: $MARKET_ID"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Get Market Info
print_info "Fetching market information..."
MARKET_INFO=$($DFX canister call Markets getMarket "($MARKET_ID:nat)" --network $NETWORK 2>&1)

if echo "$MARKET_INFO" | grep -q "err"; then
    print_error "Market not found or error getting market info"
    echo "$MARKET_INFO"
    exit 1
fi

echo "$MARKET_INFO"
echo ""

# 2. Get YES token price
print_info "Getting YES token price..."
YES_PRICE=$($DFX canister call Markets getMarketPrice "($MARKET_ID:nat, variant { Binary = variant { YES } })" --network $NETWORK 2>&1)
echo "YES Price: $YES_PRICE"
echo ""

# 3. Get NO token price
print_info "Getting NO token price..."
NO_PRICE=$($DFX canister call Markets getMarketPrice "($MARKET_ID:nat, variant { Binary = variant { NO } })" --network $NETWORK 2>&1)
echo "NO Price: $NO_PRICE"
echo ""

# 4. Check if we have a test user identity
TEST_USER="test_trader"
if ! $DFX identity list | grep -q "$TEST_USER"; then
    print_info "Creating test user identity: $TEST_USER"
    $DFX identity new $TEST_USER --storage-mode plaintext || true
fi

# Get Vault canister ID
VAULT_ID=$($DFX canister id Vault --network $NETWORK)
print_info "Vault Canister: $VAULT_ID"

# 5. Request ckBTC from faucet for test user
print_info "Requesting ckBTC from faucet for test user..."
$DFX canister call ckbtc_ledger icrc1_transfer "(record {
  to = record {
    owner = principal \"$($DFX identity get-principal --identity $TEST_USER)\";
  };
  amount = 1000000;  // 0.01 BTC
})" --network $NETWORK --identity default

# Check balance
print_info "Checking test user ckBTC balance..."
BALANCE=$($DFX canister call ckbtc_ledger icrc1_balance_of "(record {
  owner = principal \"$($DFX identity get-principal --identity $TEST_USER)\";
})" --network $NETWORK)
echo "Test user balance: $BALANCE"
echo ""

# 6. Approve Vault to spend ckBTC
print_info "Approving Vault to spend ckBTC..."
$DFX canister call ckbtc_ledger icrc2_approve "(record {
  spender = record { owner = principal \"$VAULT_ID\" };
  amount = 100000;  // Approve 0.001 BTC
})" --network $NETWORK --identity $TEST_USER

# 7. Try a small buy order
print_info "Attempting to buy YES tokens (1000 satoshis)..."
BUY_RESULT=$($DFX canister call Markets buyTokens \
  "($MARKET_ID:nat, variant { Binary = variant { YES } }, 1000:nat64, 0.5:float64)" \
  --network $NETWORK --identity $TEST_USER 2>&1)

if echo "$BUY_RESULT" | grep -q "ok"; then
    print_info "✅ Buy order successful!"
    echo "$BUY_RESULT"
else
    print_error "❌ Buy order failed"
    echo "$BUY_RESULT"
    
    # Check if it's a slippage error
    if echo "$BUY_RESULT" | grep -q "slippage"; then
        print_warn "High slippage detected. This usually means:"
        echo "  1. Market needs more initial liquidity"
        echo "  2. Try a smaller amount (e.g., 100-500 satoshis)"
        echo "  3. Check liquidityParameter (b) value in market creation"
        echo ""
        print_info "To fix: Increase liquidity parameter when creating markets"
        print_info "Recommended: liquidityParameter = 1000 or higher"
    fi
fi

echo ""
print_info "Test complete!"
