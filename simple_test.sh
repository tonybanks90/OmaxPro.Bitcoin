#!/usr/bin/env bash
set -e

# Simple test script for quick validation
NETWORK="local"
IDENTITY="default"

echo "Simple Prediction Markets Test"
echo "============================="

# Start dfx if needed
if [[ "$NETWORK" == "local" ]] && ! dfx ping --network $NETWORK > /dev/null 2>&1; then
    echo "Starting dfx..."
    dfx start --background --clean
    sleep 5
fi

# Deploy
echo "1. Deploying canisters..."
dfx deploy --network $NETWORK --identity $IDENTITY

# Get IDs
MARKETS_ID=$(dfx canister id Markets --network $NETWORK)
TOKEN_FACTORY_ID=$(dfx canister id TokenFactory --network $NETWORK)
VAULT_ID=$(dfx canister id Vault --network $NETWORK)

echo "   Markets: $MARKETS_ID"
echo "   TokenFactory: $TOKEN_FACTORY_ID" 
echo "   Vault: $VAULT_ID"

# Setup connections
echo "2. Connecting canisters..."
dfx canister call Markets setTokenFactory "(principal \"$TOKEN_FACTORY_ID\")" --network $NETWORK --identity $IDENTITY
dfx canister call Markets setVaultCanister "(principal \"$VAULT_ID\")" --network $NETWORK --identity $IDENTITY
dfx canister call TokenFactory setMarketsCanister "(principal \"$MARKETS_ID\")" --network $NETWORK --identity $IDENTITY
dfx canister call Vault initialize "(principal \"$MARKETS_ID\", principal \"$MARKETS_ID\")" --network $NETWORK --identity $IDENTITY

echo "3. Creating test market..."
RESULT=$(dfx canister call TokenFactory createMarket \
  '(record { 
    question = "Test market - will this work?"; 
    expiry = 1735689600:nat64; 
    resolver = principal "'$(dfx identity get-principal --identity $IDENTITY)'"; 
    b = 100.0:float64 
  })' \
  --network $NETWORK --identity $IDENTITY)

echo "   Result: $RESULT"

echo "4. Checking market..."
dfx canister call Markets getMarket "(1:nat)" --network $NETWORK

echo "5. Getting prices..."
dfx canister call Markets getMarketPrice "(1:nat, variant { Yes })" --network $NETWORK
dfx canister call Markets getMarketPrice "(1:nat, variant { No })" --network $NETWORK

echo "6. Registering market in vault..."
dfx canister call Vault registerMarket "(1:nat)" --network $NETWORK --identity $IDENTITY

echo "7. Resolving market..."
dfx canister call Markets resolve "(1:nat, variant { Yes })" --network $NETWORK --identity $IDENTITY

echo "8. Final market state..."
dfx canister call Markets getMarket "(1:nat)" --network $NETWORK

echo ""
echo "✅ Basic test completed successfully!"
echo ""
echo "Next steps:"
echo "- Upload ICRC-1 WASM to TokenFactory"
echo "- Set up real ckBTC ledger for trading"
echo "- Test full trading flow"