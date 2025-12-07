#!/usr/bin/env bash
set -e

# Configuration
function dfx {
    /home/antony/snap/code/214/.local/share/dfx/versions/0.29.2/dfx "$@"
}

echo "🚀 Starting Factory End-to-End Test"

# 1. Setup Identities
echo "--- Setting up Identities ---"
IDENTITY_USER="test_user"
dfx identity new $IDENTITY_USER --storage-mode=plaintext || true
# User Principal
USER_PRINCIPAL=$(dfx identity get-principal --identity $IDENTITY_USER)
# Resolver (use default)
RESOLVER_PRINCIPAL=$(dfx identity get-principal --identity default)

# 2. Wire Canisters (Safety Check)
echo "--- Ensuring Canisters are Wired ---"
MARKETS_ID=$(dfx canister id Markets)
FACTORY_ID=$(dfx canister id TFactory)
VAULT_ID=$(dfx canister id Vault)

echo "Markets: $MARKETS_ID"
echo "Factory: $FACTORY_ID"

# Top up Factory with Cycles (Needs lots for Compound market creation)
echo "Top up Factory..."
dfx canister deposit-cycles 20000000000000 TFactory --identity default

dfx canister call Markets setTokenFactory "(principal \"$FACTORY_ID\")"
dfx canister call Markets setVaultCanister "(principal \"$VAULT_ID\")"
dfx canister call TFactory setMarketsCanister "(principal \"$MARKETS_ID\")"

# 3. Test Binary Market Creation
echo "--- Test Case 1: Create Binary Market ---"
NOW=$(date +%s)
CLOSE=$((NOW + 3600))000000000
EXPIRY=$((NOW + 7200))000000000

RES_BINARY=$(dfx canister call TFactory createBinaryMarket "(
  record {
    title = \"Will Bitcoin hit 100k?\";
    description = \"Binary prediction market\";
    category = variant { Crypto };
    image = variant { ImageUrl = \"https://example.com/btc.png\" };
    tags = vec { variant { Crypto } };
    bettingCloseTime = $CLOSE;
    expirationTime = $EXPIRY;
    resolutionLink = \"https://binance.com\";
    resolutionDescription = \"Binance Spot Price\";
    resolver = principal \"$RESOLVER_PRINCIPAL\";
    liquidityParameter = 100.0;
    totalSupply = 1000000;
  }
)")

echo "Result: $RES_BINARY"
# Extract ID (variant { Ok = ... })
BINARY_ID=$(echo "$RES_BINARY" | grep -oE '[0-9]+' | head -1)

if [[ -z "$BINARY_ID" ]]; then
  echo "❌ Failed to create Binary Market"
  exit 1
fi
echo "✅ Binary Market Created with ID: $BINARY_ID"

# 4. Test Multiple Choice Market Creation
echo "--- Test Case 2: Create Multiple Choice Market ---"
RES_MC=$(dfx canister call TFactory createMultipleChoiceMarket "(
  record {
    title = \"Who happens in 2025?\";
    description = \"Multiple choice market\";
    category = variant { Political };
    image = variant { ImageUrl = \"https://example.com/poly.png\" };
    tags = vec { variant { Political } };
    outcomes = vec { \"Option A\"; \"Option B\"; \"Option C\" };
    bettingCloseTime = $CLOSE;
    expirationTime = $EXPIRY;
    resolutionLink = \"https://news.com\";
    resolutionDescription = \"News\";
    resolver = principal \"$RESOLVER_PRINCIPAL\";
    liquidityParameter = 100.0;
    totalSupply = 1000000;
  }
)")

echo "Result: $RES_MC"
MC_ID=$(echo "$RES_MC" | grep -oE '[0-9]+' | head -1)

if [[ -z "$MC_ID" ]]; then
  echo "❌ Failed to create Multiple Choice Market"
  exit 1
fi
echo "✅ Multiple Choice Market Created with ID: $MC_ID"

# 5. Test Compound Market Creation
echo "--- Test Case 3: Create Compound Market ---"
RES_COMP=$(dfx canister call TFactory createCompoundMarket "(
  record {
    title = \"Tech Stocks 2025\";
    description = \"Compound market for tech stocks\";
    category = variant { Technology };
    image = variant { ImageUrl = \"https://example.com/tech.png\" };
    tags = vec { variant { Technology } };
    subjects = vec { \"AAPL\"; \"MSFT\"; \"GOOGL\" };
    bettingCloseTime = $CLOSE;
    expirationTime = $EXPIRY;
    resolutionLink = \"https://nasdaq.com\";
    resolutionDescription = \"Nasdaq\";
    resolver = principal \"$RESOLVER_PRINCIPAL\";
    liquidityParameter = 100.0;
    totalSupply = 1000000;
  }
)")

echo "Result: $RES_COMP"
COMP_ID=$(echo "$RES_COMP" | grep -oE '[0-9]+' | head -1)

if [[ -z "$COMP_ID" ]]; then
  echo "❌ Failed to create Compound Market"
  exit 1
fi
echo "✅ Compound Market Created with ID: $COMP_ID"

# 6. Verify Factory Queries
echo "--- Test Case 4: Verify Factory Queries ---"

# Check All Markets
ALL_MARKETS=$(dfx canister call TFactory getAllMarkets)
# Count occurrences of our IDs (simple grep check)
if echo "$ALL_MARKETS" | grep -q "$BINARY_ID"; then
  echo "✅ Binary Market found in getAllMarkets"
else 
  echo "❌ Binary Market NOT found"
fi

# Check Active Markets
ACTIVE_MARKETS=$(dfx canister call TFactory getActiveMarkets)
if echo "$ACTIVE_MARKETS" | grep -q "$MC_ID"; then
  echo "✅ Multiple Choice Market found in getActiveMarkets"
else
  echo "❌ Multiple Choice Market NOT found"
fi

# Check By Category (Crypto) - assuming Binary was Crypto
CRYPTO_MARKETS=$(dfx canister call TFactory getMarketsByCategory '(variant { Crypto })')
if echo "$CRYPTO_MARKETS" | grep -q "$BINARY_ID"; then
  echo "✅ Binary Market found in Crypto category"
else
  echo "❌ Binary Market NOT found in Crypto category"
fi

echo "🎉 All Factory E2E Tests Passed!"
