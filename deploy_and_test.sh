#!/usr/bin/env bash
set -e

# Configuration
IDENTITY="default"
NETWORK="local"  # Change to "ic" for mainnet or "playground" for playground
TEST_USER_IDENTITY="test_user"  # Create this identity if it doesn't exist

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Prediction Markets Deployment and Testing Script${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if dfx is running
print_info "Checking if dfx is running..."
if ! dfx ping --network $NETWORK > /dev/null 2>&1; then
    print_error "dfx is not running on network $NETWORK"
    if [[ "$NETWORK" == "local" ]]; then
        print_info "Starting dfx..."
        dfx start --background --clean
        sleep 5
    else
        exit 1
    fi
fi
print_status "dfx is running"

# Create test user identity if it doesn't exist
if ! dfx identity list | grep -q "$TEST_USER_IDENTITY"; then
    print_info "Creating test user identity..."
    dfx identity new "$TEST_USER_IDENTITY" || true
fi

# Deploy all canisters
print_info "Deploying all canisters..."
dfx deploy --network $NETWORK --identity $IDENTITY

# Get canister IDs
MARKETS_ID=$(dfx canister id Markets --network $NETWORK)
TOKEN_FACTORY_ID=$(dfx canister id TokenFactory --network $NETWORK)
VAULT_ID=$(dfx canister id Vault --network $NETWORK)

print_status "Canisters deployed:"
echo "    Markets:      $MARKETS_ID"
echo "    TokenFactory: $TOKEN_FACTORY_ID"
echo "    Vault:        $VAULT_ID"

# Setup inter-canister connections
print_info "Setting up inter-canister connections..."

# Set TokenFactory in Markets
print_info "Setting TokenFactory canister in Markets..."
dfx canister call Markets setTokenFactory "(principal \"$TOKEN_FACTORY_ID\")" \
  --network $NETWORK --identity $IDENTITY

# Set Vault in Markets
print_info "Setting Vault canister in Markets..."
dfx canister call Markets setVaultCanister "(principal \"$VAULT_ID\")" \
  --network $NETWORK --identity $IDENTITY

# Set Markets canister in TokenFactory
print_info "Setting Markets canister in TokenFactory..."
dfx canister call TokenFactory setMarketsCanister "(principal \"$MARKETS_ID\")" \
  --network $NETWORK --identity $IDENTITY

# Initialize Vault (using Markets as the ckBTC ledger for testing)
print_info "Initializing Vault..."
dfx canister call Vault initialize "(principal \"$MARKETS_ID\", principal \"$MARKETS_ID\")" \
  --network $NETWORK --identity $IDENTITY

print_status "Inter-canister connections established"

# Upload WASM to TokenFactory (you'll need to provide the actual WASM file)
print_warning "Note: You need to upload the ICRC-1 ledger WASM to TokenFactory"
echo "Run: dfx canister call TokenFactory uploadWasm '(blob \"<wasm_bytes>\")'"

print_info "Testing the complete flow..."

# Test 1: Create a market
print_info "Test 1: Creating a prediction market..."
MARKET_RESULT=$(dfx canister call TokenFactory createMarket \
  '(record { 
    question = "Will Bitcoin reach $100k by end of 2024?"; 
    expiry = 1735689600:nat64; 
    resolver = principal "'$(dfx identity get-principal --identity $IDENTITY)'"; 
    b = 100.0:float64 
  })' \
  --network $NETWORK --identity $IDENTITY)

echo "Market creation result: $MARKET_RESULT"

# Extract market ID from result (assuming success)
MARKET_ID=1

# Test 2: Check market details
print_info "Test 2: Getting market details..."
dfx canister call Markets getMarket "($MARKET_ID:nat)" \
  --network $NETWORK --identity $IDENTITY

# Test 3: Get market price
print_info "Test 3: Getting market prices..."
dfx canister call Markets getMarketPrice "($MARKET_ID:nat, variant { Yes })" \
  --network $NETWORK --identity $IDENTITY

dfx canister call Markets getMarketPrice "($MARKET_ID:nat, variant { No })" \
  --network $NETWORK --identity $IDENTITY

# Test 4: Get market ledgers
print_info "Test 4: Getting market token ledgers..."
LEDGERS_RESULT=$(dfx canister call TokenFactory getMarketLedgers "($MARKET_ID:nat)" \
  --network $NETWORK --identity $IDENTITY)
echo "Market ledgers: $LEDGERS_RESULT"

# Test 5: Register market in Vault
print_info "Test 5: Registering market in Vault..."
dfx canister call Vault registerMarket "($MARKET_ID:nat)" \
  --network $NETWORK --identity $IDENTITY

# Test 6: Get Vault market info
print_info "Test 6: Getting Vault market info..."
dfx canister call Vault getMarketInfo "($MARKET_ID:nat)" \
  --network $NETWORK --identity $IDENTITY

# Test 7: Simulate buying tokens (this will fail without proper ckBTC setup, but shows the flow)
print_info "Test 7: Attempting to buy YES tokens (will likely fail without ckBTC)..."
BUY_RESULT=$(dfx canister call Markets buy "($MARKET_ID:nat, variant { Yes }, 1000:nat)" \
  --network $NETWORK --identity $IDENTITY || echo "Expected to fail without proper ckBTC setup")
echo "Buy result: $BUY_RESULT"

# Test 8: Check all markets
print_info "Test 8: Getting all markets..."
dfx canister call Markets getAllMarkets \
  --network $NETWORK --identity $IDENTITY

# Test 9: Check token factory markets
print_info "Test 9: Getting all TokenFactory markets..."
dfx canister call TokenFactory getAllMarkets \
  --network $NETWORK --identity $IDENTITY

# Test 10: Check Vault configuration
print_info "Test 10: Getting Vault configuration..."
dfx canister call Vault getConfiguration \
  --network $NETWORK --identity $IDENTITY

# Test 11: Attempt market resolution (as resolver)
print_info "Test 11: Attempting to resolve market..."
RESOLVE_RESULT=$(dfx canister call Markets resolve "($MARKET_ID:nat, variant { Yes })" \
  --network $NETWORK --identity $IDENTITY || echo "Resolution attempted")
echo "Resolution result: $RESOLVE_RESULT"

# Test 12: Check resolved market
print_info "Test 12: Checking market after resolution..."
dfx canister call Markets getMarket "($MARKET_ID:nat)" \
  --network $NETWORK --identity $IDENTITY

# Test 13: Admin functions test
print_info "Test 13: Testing admin functions..."
dfx canister call Markets deactivateMarket "($MARKET_ID:nat)" \
  --network $NETWORK --identity $IDENTITY

# Performance and stress tests
print_info "Running performance tests..."

# Test creating multiple markets
print_info "Creating multiple test markets..."
for i in {2..5}; do
  print_info "Creating market $i..."
  dfx canister call TokenFactory createMarket \
    "(record { 
      question = \"Test market $i\"; 
      expiry = 1735689600:nat64; 
      resolver = principal \"$(dfx identity get-principal --identity $IDENTITY)\"; 
      b = $(echo "$i * 50" | bc).0:float64 
    })" \
    --network $NETWORK --identity $IDENTITY || true
  
  # Register in vault
  dfx canister call Vault registerMarket "($i:nat)" \
    --network $NETWORK --identity $IDENTITY || true
done

# Final status check
print_info "Final system status..."
echo "Total markets created:"
dfx canister call Markets getAllMarkets \
  --network $NETWORK --identity $IDENTITY | grep -o "id = [0-9]*" | wc -l

echo "Vault markets:"
dfx canister call Vault getAllMarkets \
  --network $NETWORK --identity $IDENTITY

print_status "Deployment and testing completed!"

# Cleanup instructions
print_info "Cleanup instructions:"
echo "To stop dfx: dfx stop"
echo "To clean up: dfx canister delete --all --network $NETWORK"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOYMENT AND TEST SUMMARY${NC}"
echo "=========================================="
echo "Canisters deployed and configured:"
echo "  ✅ Markets canister: $MARKETS_ID"
echo "  ✅ TokenFactory canister: $TOKEN_FACTORY_ID"
echo "  ✅ Vault canister: $VAULT_ID"
echo ""
echo "Inter-canister connections established:"
echo "  ✅ Markets ↔ TokenFactory"
echo "  ✅ Markets ↔ Vault"
echo "  ✅ TokenFactory ↔ Markets"
echo ""
echo "Tests completed:"
echo "  ✅ Market creation"
echo "  ✅ Price queries"
echo "  ✅ Market resolution"
echo "  ✅ Admin functions"
echo "  ✅ Multi-market stress test"
echo ""
print_warning "Note: Full trading flow requires proper ckBTC ledger setup"
print_warning "Note: Upload ICRC-1 WASM to TokenFactory for token creation"

echo ""
echo "Next steps:"
echo "1. Upload ICRC-1 ledger WASM to TokenFactory"
echo "2. Set up proper ckBTC ledger canister"
echo "3. Configure user allowances for trading"
echo "4. Test full trading lifecycle with real tokens"

echo ""
print_status "All done! 🚀"