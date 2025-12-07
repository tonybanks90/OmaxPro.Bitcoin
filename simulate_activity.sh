#!/usr/bin/env bash
set -e

# Configuration
function dfx {
    /home/antony/snap/code/214/.local/share/dfx/versions/0.29.2/dfx "$@"
}

echo "🚀 Simulating Market Activity"

IDENTITY1="trader_one"
IDENTITY2="test_user"

# Ensure identities exist
dfx identity new $IDENTITY1 --storage-mode=plaintext || true
dfx identity new $IDENTITY2 --storage-mode=plaintext || true

# Helper to mint ckBTC if needed
function mint {
    local identity=$1
    local amount=$2
    local principal=$(dfx identity get-principal --identity $identity)
    echo "Minting $amount to $identity ($principal)..."
    if [ "$identity" != "default" ]; then
        dfx canister call ckbtc_ledger icrc1_transfer "(record { 
            to = record { owner = principal \"$principal\"; subaccount = null }; 
            amount = $amount; 
            memo = null; 
            created_at_time = null; 
            fee = null; 
            from_subaccount = null 
        })" --identity default
    fi
}

mint $IDENTITY1 10000
mint $IDENTITY2 10000

# Re-wire Canisters (Required after reinstall)
echo "Wiring Canisters..."
MARKETS_ID=$(dfx canister id Markets)
FACTORY_ID=$(dfx canister id TFactory)
VAULT_ID=$(dfx canister id Vault)

echo "Setting Markets -> TFactory..."
dfx canister call Markets setTokenFactory "(principal \"$FACTORY_ID\")"

echo "Setting Markets -> Vault..."
dfx canister call Markets setVaultCanister "(principal \"$VAULT_ID\")"

echo "Setting TFactory -> Markets..."
dfx canister call TFactory setMarketsCanister "(principal \"$MARKETS_ID\")"

# Vault might need re-init
echo "Initializing Vault..."
LEDGER_ID=$(dfx canister id ckbtc_ledger)
dfx canister call Vault initialize "(principal \"$MARKETS_ID\", principal \"$LEDGER_ID\")"

# Create Market
echo "Creating Market via TFactory..."

# Get current time + 1 hour for close, + 2 hours for expiry
NOW=$(date +%s)
CLOSE=$((NOW + 3600))000000000 # Nanoseconds
EXPIRY=$((NOW + 7200))000000000

RESOLVER=$(dfx identity get-principal --identity default)

# Arguments for CreateBinaryMarketArgs
CREATE_RES=$(dfx canister call TFactory createBinaryMarket "(
  record {
    title = \"Will Bitcoin hit 100k?\";
    description = \"Prediction for Bitcoin price\";
    category = variant { Crypto };
    image = variant { ImageUrl = \"https://example.com/btc.png\" };
    tags = vec { variant { Crypto } };
    bettingCloseTime = $CLOSE;
    expirationTime = $EXPIRY;
    resolutionLink = \"https://binance.com\";
    resolutionDescription = \"Binance Price\";
    resolver = principal \"$RESOLVER\";
    liquidityParameter = 100.0;
    totalSupply = 100000;
  }
)")

MARKET_ID=$(echo "$CREATE_RES" | grep -oE '[0-9]+' | head -1)
echo "Market Created: $MARKET_ID"

# Approve Vault to spend (more for bulk trades)
echo "Approving Vault for bulk trading..."
VAULT_ID=$(dfx canister id Vault)
dfx canister call ckbtc_ledger icrc2_approve "(record { amount = 500000; spender = record { owner = principal \"$VAULT_ID\"; subaccount = null } })" --identity $IDENTITY1
dfx canister call ckbtc_ledger icrc2_approve "(record { amount = 500000; spender = record { owner = principal \"$VAULT_ID\"; subaccount = null } })" --identity $IDENTITY2

# Execute 20 Trades
echo "Executing 20 Trades..."

for i in $(seq 1 20); do
    # Alternate between identities and YES/NO
    if [ $((i % 2)) -eq 0 ]; then
        TRADER=$IDENTITY1
        if [ $((i % 4)) -eq 0 ]; then
            SIDE="YES"
        else
            SIDE="NO"
        fi
    else
        TRADER=$IDENTITY2
        if [ $((i % 3)) -eq 0 ]; then
            SIDE="NO"
        else
            SIDE="YES"
        fi
    fi
    
    # Vary the amount between 50 and 500 sats
    AMOUNT=$((50 + (i * 20)))
    
    echo "Trade $i: $TRADER buys $SIDE ($AMOUNT sats)"
    dfx canister call Markets buyTokens "($MARKET_ID, variant { Binary = variant { $SIDE } }, $AMOUNT:nat64, 50.0:float64)" --identity $TRADER || echo "Trade $i failed, continuing..."
    
    # Small delay to avoid rate limiting
    sleep 0.2
done

# Verify
echo "Fetching Activity..."
ACTIVITY_RES=$(dfx canister call Markets getMarketActivity "($MARKET_ID)")
echo "$ACTIVITY_RES"

echo "Fetching Holders..."
HOLDER_RES=$(dfx canister call Markets getMarketHolders "($MARKET_ID)")
echo "$HOLDER_RES"

echo "✅ Simulation Complete - 20 transactions generated"
