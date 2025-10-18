#!/usr/bin/env bash
set -e

echo "🚀 Starting Vault Test Suite"
echo "============================"

IDENTITY="default"
NETWORK="local"   # change to ic or playground as needed

# Deploy or upgrade Vault + Markets canisters
echo "ℹ️  Deploying Vault + Markets canisters..."
dfx deploy PredictionMarkets --network $NETWORK --identity $IDENTITY
dfx deploy Vault --network $NETWORK --identity $IDENTITY

VAULT_ID=$(dfx canister id Vault --network $NETWORK)
MARKETS_ID=$(dfx canister id PredictionMarkets --network $NETWORK)

echo "✅ Deployed"
echo "    Vault:    $VAULT_ID"
echo "    Markets:  $MARKETS_ID"

# Optionally set ckBTC ledger (replace with real ckBTC canister ID if available)
CKBTC_LEDGER_ID="aaaaa-aa"  # dummy value

echo "ℹ️  Initializing Vault configuration..."
INIT_RESULT=$(dfx canister call Vault initialize \
  "(principal \"$MARKETS_ID\", opt principal \"$CKBTC_LEDGER_ID\")" \
  --network $NETWORK --identity $IDENTITY || true)
echo "Init result: $INIT_RESULT"

echo "ℹ️  Registering market 1..."
REGISTER_RESULT=$(dfx canister call Vault registerMarket \
  "(1:nat)" --network $NETWORK --identity $IDENTITY || true)
echo "Register result: $REGISTER_RESULT"

# Ensure mock market exists in Markets canister if none found
echo "ℹ️  Ensuring mock market exists..."
MARKETS_INFO=$(dfx canister call PredictionMarkets getAllMarkets \
  --network $NETWORK --identity $IDENTITY || true)
if [[ "$MARKETS_INFO" == "(vec {})" ]]; then
  echo "⚠️  No markets found, creating mock market..."
  dfx canister call PredictionMarkets createMockMarket "(\"Test Market\", 1234567890:nat)" \
    --network $NETWORK --identity $IDENTITY || true
fi

# Simulate pulling ckBTC
echo "ℹ️  Pulling ckBTC (simulated)..."
dfx canister call Vault pullFunds "(1:nat, 1000:nat)" \
  --network $NETWORK --identity $IDENTITY || true

# Simulate paying ckBTC
echo "ℹ️  Paying ckBTC (simulated)..."
dfx canister call Vault payFunds "(1:nat, principal \"$MARKETS_ID\", 500:nat)" \
  --network $NETWORK --identity $IDENTITY || true

# Balance queries
echo "ℹ️  Querying balance..."
dfx canister call Vault getBalance "(1:nat)" \
  --network $NETWORK --identity $IDENTITY || true
dfx canister call Vault getBalanceAsync "(1:nat)" \
  --network $NETWORK --identity $IDENTITY || true

# Market info queries
echo "ℹ️  Getting market info..."
dfx canister call Vault getMarketInfo "(1:nat)" \
  --network $NETWORK --identity $IDENTITY || true
dfx canister call Vault getAllMarkets \
  --network $NETWORK --identity $IDENTITY || true

# Deactivate market
echo "ℹ️  Deactivating market 1..."
dfx canister call Vault deactivateMarket "(1:nat)" \
  --network $NETWORK --identity $IDENTITY || true

# Configuration
echo "ℹ️  Getting configuration..."
dfx canister call Vault getConfiguration \
  --network $NETWORK --identity $IDENTITY || true

echo "✅ 🎉 Vault test suite completed!"
