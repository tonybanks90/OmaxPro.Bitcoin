#!/usr/bin/env bash
set -e

# Configuration
function dfx {
    /home/antony/snap/code/214/.local/share/dfx/versions/0.29.2/dfx "$@"
}

echo "🚀 Starting Trading End-to-End Test"

# 1. Setup Identities
echo "--- Setting up Identities ---"
IDENTITY_USER="trader_e2e"
dfx identity new $IDENTITY_USER --storage-mode=plaintext || true
USER_PRINCIPAL=$(dfx identity get-principal --identity $IDENTITY_USER)
# Resolver
RESOLVER_PRINCIPAL=$(dfx identity get-principal --identity default)

# 2. Wire Canisters
echo "--- Ensuring Canisters are Wired ---"
MARKETS_ID=$(dfx canister id Markets)
FACTORY_ID=$(dfx canister id TFactory)
VAULT_ID=$(dfx canister id Vault)
CKBTC_ID=$(dfx canister id ckbtc_ledger)

echo "Markets: $MARKETS_ID"
echo "Factory: $FACTORY_ID"
echo "Vault:   $VAULT_ID"
echo "ckBTC:   $CKBTC_ID"

# Top up Factory (just in case)
dfx canister deposit-cycles 1000000000000 TFactory --identity default

dfx canister call Markets setTokenFactory "(principal \"$FACTORY_ID\")"
dfx canister call Markets setVaultCanister "(principal \"$VAULT_ID\")"
dfx canister call TFactory setMarketsCanister "(principal \"$MARKETS_ID\")"

# 3. Create Binary Market for Trading
echo "--- Step 1: Create Market ---"
NOW=$(date +%s)
CLOSE=$((NOW + 3600))000000000
EXPIRY=$((NOW + 7200))000000000

RES_CREATE=$(dfx canister call TFactory createBinaryMarket "(
  record {
    title = \"Will it rain today?\";
    description = \"Trading test market\";
    category = variant { Sports };
    image = variant { ImageUrl = \"\" };
    tags = vec { variant { Sports } };
    bettingCloseTime = $CLOSE;
    expirationTime = $EXPIRY;
    resolutionLink = \"\";
    resolutionDescription = \"\";
    resolver = principal \"$RESOLVER_PRINCIPAL\";
    liquidityParameter = 1000.0;
    totalSupply = 1000000;
  }
)")
echo "DEBUG - Full Create Result: $RES_CREATE"
MARKET_ID=$(echo "$RES_CREATE" | grep -oE '[0-9]+' | head -1)

if [[ -z "$MARKET_ID" ]]; then
  echo "❌ Failed to create Market"
  exit 1
fi
echo "✅ Market Created with ID: $MARKET_ID"

# Wait a bit for async operations? Although await should handle it.
sleep 2

# 4. Verify Registration and Get Token Ledger
echo "--- Step 2: Verify Registration & Get Ledgers ---"
RES_MARKET=$(dfx canister call Markets getMarket "($MARKET_ID)")
echo "DEBUG - Markets.getMarket result: $RES_MARKET"

if echo "$RES_MARKET" | grep -q "Market not found"; then
    echo "❌ Market not found in Markets canister!"
    exit 1
fi

# Extract YES Ledger Principal (Quick and dirty grep)
# Look for "yesLedger = principal" and grab the content inside quotes
YES_LEDGER=$(echo "$RES_MARKET" | grep -o 'yesLedger = principal "[^"]*"' | head -1 | cut -d'"' -f2)

if [[ -z "$YES_LEDGER" ]]; then
    echo "❌ Failed to extract YES Ledger Principal"
    echo "Full output: $RES_MARKET"
    exit 1
fi
echo "✅ YES Ledger: $YES_LEDGER"

# 5. Mint ckBTC and Approve Vault
echo "--- Step 3: Mint & Approve ---"
# Mint 100,000 sats
dfx canister call ckbtc_ledger icrc1_transfer "(record { 
    to = record { owner = principal \"$USER_PRINCIPAL\"; subaccount = null }; 
    amount = 100000; 
    memo = null; 
    created_at_time = null; 
    fee = null; 
    from_subaccount = null 
})" --identity default

echo "Approved tokens for Vault..."
# Approve Vault to spend 50,000 sats
dfx canister call ckbtc_ledger icrc2_approve "(record {
    amount = 50000;
    spender = record { owner = principal \"$VAULT_ID\"; subaccount = null };
    fee = null;
    memo = null;
    from_subaccount = null;
    created_at_time = null;
    expires_at = null;
    expected_allowance = null;
})" --identity $IDENTITY_USER

# 6. Buy Tokens
echo "--- Step 4: Buy YES Tokens ---"
# Buy 1000 sats worth
BUY_RES=$(dfx canister call Markets buyTokens "($MARKET_ID, variant { Binary = variant { YES } }, 1000:nat64, 20.0:float64)" --identity $IDENTITY_USER)
echo "Buy Result: $BUY_RES"

if echo "$BUY_RES" | grep -q "err"; then
    echo "❌ Buy Failed"
    exit 1
fi
echo "✅ Buy Successful"

# 7. Check Token Balance
echo "--- Step 5: Check YES Token Balance ---"
# Check balance on YES Ledger
BALANCE_RES=$(dfx canister call "$YES_LEDGER" icrc1_balance_of "(record { owner = principal \"$USER_PRINCIPAL\"; subaccount = null })")
# Remove underscores, parentheses, and get just the number
BALANCE=$(echo "$BALANCE_RES" | tr -d '()_: nat' | tr -d '\n' | tr -d ' ')

echo "YES Balance: $BALANCE"
if [[ "$BALANCE" =~ ^[0-9]+$ ]] && [[ "$BALANCE" -gt 0 ]]; then
    echo "✅ User holds YES tokens"
else
    echo "❌ User has 0 YES tokens or invalid balance"
    exit 1
fi

# 8. Approve Markets to spend YES tokens (for sell)
echo "--- Step 6: Approve Markets for Sell ---"
dfx canister call "$YES_LEDGER" icrc2_approve "(record {
    amount = 1000;
    spender = record { owner = principal \"$MARKETS_ID\"; subaccount = null };
    fee = opt 0;
    memo = null;
    from_subaccount = null;
    created_at_time = null;
    expires_at = null;
    expected_allowance = null;
})" --identity $IDENTITY_USER

# 9. Sell Tokens
echo "--- Step 7: Sell YES Tokens ---"
# Sell 10 tokens (assuming we got more than 10)
SELL_RES=$(dfx canister call Markets sellTokens "($MARKET_ID, variant { Binary = variant { YES } }, 10:nat64, 0:nat64)" --identity $IDENTITY_USER)
echo "Sell Result: $SELL_RES"

if echo "$SELL_RES" | grep -q "err"; then
    echo "❌ Sell Failed"
    exit 1
fi
echo "✅ Sell Successful"

echo "🎉 All Trading E2E Tests Passed!"
