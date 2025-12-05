#!/usr/bin/env bash
set -e

# Configuration
IDENTITY="default"
NETWORK="local"  # Change to "ic" for mainnet or "playground" for playground
TEST_USER_IDENTITY="test_user"  # Create this identity if it doesn't exist
# Use specific dfx binary to bypass shim issues
function dfx {
    /home/antony/snap/code/214/.local/share/dfx/versions/0.29.2/dfx "$@"
}
export -f dfx


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
if ! pgrep -x "dfx" > /dev/null; then
    print_info "Starting dfx..."
    dfx start --background --clean
    sleep 5
else
    print_info "dfx is already running"
fi
print_status "dfx is running"

# Create test user identity if it doesn't exist
if ! dfx identity list | grep -q "$TEST_USER_IDENTITY"; then
    print_info "Creating test user identity..."
    dfx identity new "$TEST_USER_IDENTITY" --storage-mode plaintext || true
fi

# Switch to default identity for deployment
dfx identity use $IDENTITY

# Deploy all canisters
print_info "Deploying all canisters..."

# Deploy ckBTC Ledger first
print_info "Deploying ckBTC Ledger..."
MINTER_ID=$(dfx identity get-principal) # Use current identity as minter for testing
DEFAULT_ACCOUNT=$(dfx identity get-principal)

dfx deploy ckbtc_ledger --argument "(variant { Init = record {
     token_symbol = \"ckBTC\";
     token_name = \"Chain Key Bitcoin\";
     minting_account = record { owner = principal \"${MINTER_ID}\" };
     transfer_fee = 10;
     metadata = vec {};
     initial_balances = vec { record { record { owner = principal \"${DEFAULT_ACCOUNT}\" }; 100_000_000_000 } };
     archive_options = record {
         num_blocks_to_archive = 1000;
         trigger_threshold = 2000;
         controller_id = principal \"${MINTER_ID}\";
     }
 }})"

# Deploy other canisters
dfx deploy Markets --network $NETWORK --identity $IDENTITY
dfx deploy Vault --network $NETWORK --identity $IDENTITY
dfx deploy TFactory --network $NETWORK --identity $IDENTITY
# Deposit cycles to TFactory for market creation
print_info "Depositing cycles to TFactory..."
dfx ledger fabricate-cycles --canister TFactory --amount 5000000000000 --network $NETWORK || \
dfx canister deposit-cycles 5000000000000 TFactory --network $NETWORK || print_warning "Failed to deposit cycles, market creation might fail"

# WalletTracker is optional based on dfx.json but good to have if needed
# dfx deploy WalletTracker --network $NETWORK --identity $IDENTITY

# Get canister IDs
MARKETS_ID=$(dfx canister id Markets --network $NETWORK)
# Note: Script originally looked for TokenFactory, but dfx.json has TFactory
TOKEN_FACTORY_ID=$(dfx canister id TFactory --network $NETWORK)
VAULT_ID=$(dfx canister id Vault --network $NETWORK)
# LEDGER_ID=$(dfx canister id ckbtc_ledger --network $NETWORK) # Already deployed

print_status "Canisters deployed:"
echo "    Markets:      $MARKETS_ID"
echo "    TokenFactory: $TOKEN_FACTORY_ID"
echo "    Vault:        $VAULT_ID"
echo "    ckBTC Ledger: $(dfx canister id ckbtc_ledger)"

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
dfx canister call TFactory setMarketsCanister "(principal \"$MARKETS_ID\")" \
  --network $NETWORK --identity $IDENTITY

# Initialize Vault (using real ckBTC ledger)
print_info "Initializing Vault..."
LEDGER_ID=$(dfx canister id ckbtc_ledger)
dfx canister call Vault initialize "(principal \"$MARKETS_ID\", principal \"$LEDGER_ID\")" \
  --network $NETWORK --identity $IDENTITY

print_status "Inter-canister connections established"

# Upload WASM to TokenFactory
print_info "Uploading ICRC-1 WASM to TFactory..."
# We use the node script but need to ensure it targets the right canister ID if hardcoded
# Or we can do it via dfx if we have the blob. 
# For now, let's use the node script but first update it (done in previous steps of the agent)
# Executing the node script:
node deploy.mjs $TOKEN_FACTORY_ID || print_warning "Node script for upload failed, you might need to run it manually or check paths."


print_info "Testing the complete flow..."

# Faucet: Mint tokens to test user
print_info "🚰 FAUCET: Minting tokens to test user..."
TEST_USER_PRINCIPAL=$(dfx identity get-principal --identity $TEST_USER_IDENTITY)
# Since we are the minter (default identity)
dfx canister call ckbtc_ledger icrc1_transfer "(record {
  to = record { owner = principal \"$TEST_USER_PRINCIPAL\" };
  amount = 10000000;
})" --network $NETWORK --identity $IDENTITY
print_status "Sent 0.1 ckBTC to $TEST_USER_PRINCIPAL"


# Test 1: Create a market
print_info "Test 1: Creating a prediction market..."
# We need to give the creator some fee tokens possibly, but TFactory creates it.
# The user creating the market is $IDENTITY
MARKET_RESULT=$(dfx canister call TFactory createMarket \
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
dfx canister call Markets getMarketPrice "($MARKET_ID:nat, variant { Binary = variant { YES } })" \
  --network $NETWORK --identity $IDENTITY

dfx canister call Markets getMarketPrice "($MARKET_ID:nat, variant { Binary = variant { NO } })" \
  --network $NETWORK --identity $IDENTITY

# Test 7: Buy tokens
print_info "Test 7: Attempting to buy YES tokens as test_user..."

# Approve Vault to spend user's ckBTC
print_info "Approving Vault to spend ckBTC..."
dfx canister call ckbtc_ledger icrc2_approve "(record {
  spender = record { owner = principal \"$VAULT_ID\" };
  amount = 100000;
})" --network $NETWORK --identity $TEST_USER_IDENTITY

BUY_RESULT=$(dfx canister call Markets buyTokens "($MARKET_ID:nat, variant { Binary = variant { YES } }, 1000:nat64, 0.5:float64)" \
  --network $NETWORK --identity $TEST_USER_IDENTITY)
echo "Buy result: $BUY_RESULT"

print_status "All done! 🚀"