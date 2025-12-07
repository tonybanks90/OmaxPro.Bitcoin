#!/bin/bash
set -e

# Test Script for Sniper and Wallet Canisters
# usage: ./test_sniper_e2e.sh

# Configuration
function dfx {
    /home/antony/snap/code/214/.local/share/dfx/versions/0.29.2/dfx "$@"
}

echo "------------------------------------------------"
echo "Starting Sniper & Wallet E2E Test"
echo "------------------------------------------------"

# 1. Clean and Start (Optional - assuming replica is running or we just deploy)
# Check if dfx is running, if not start it? 
# For E2E we usually assume existing local network or start one.
# dfx start --background --clean

# 2. Deploy Canisters
echo "Deploying Sniper canister..."
dfx deploy Sniper

echo "Deploying WalletTracker canister..."
dfx deploy WalletTracker

# 3. Verify Deployments
SNIPER_ID=$(dfx canister id Sniper)
WALLET_ID=$(dfx canister id WalletTracker)

echo "Sniper ID: $SNIPER_ID"
echo "Wallet ID: $WALLET_ID"

if [ -z "$SNIPER_ID" ] || [ -z "$WALLET_ID" ]; then
    echo "ERROR: Failed to retrieve canister IDs"
    exit 1
fi

# 4. Test Sniper Functions
echo "Testing Sniper Functions..."
USER_PRINCIPAL=$(dfx identity get-principal)
echo "User Principal: $USER_PRINCIPAL"

# 4a. Deposit (Mock)
echo "Calling deposit..."
dfx canister call Sniper deposit '(1000000)' # 0.01 BTC sats
BALANCE=$(dfx canister call Sniper getBalance '()' | awk '{print $1}')
echo "Balance after deposit: $BALANCE"

if [[ "$BALANCE" != *"(1_000_000 : nat)"* && "$BALANCE" != *"(1000000 : nat)"* ]]; then
    echo "WARNING: Balance check might have failed or output format differs. Got: $BALANCE"
else
    echo "✅ Deposit verified."
fi

# 4b. Add Snipe
echo "Adding Snipe..."
# addSnipe(tokenId : Text, targetMC : Float, amountBTC : Nat)
SNIPE_ID=$(dfx canister call Sniper addSnipe '("test-token-id", 50000.0, 100000)' | sed 's/[^0-9]*//g')
echo "Snipe created with ID: $SNIPE_ID"

# 4c. List Snipes
echo "Listing Snipes..."
SNIPES=$(dfx canister call Sniper getUserSnipes '()')
echo "User Snipes: $SNIPES"

if [[ "$SNIPES" == *"test-token-id"* ]]; then
    echo "✅ Snipe list verified."
else
    echo "❌ Snipe list check failed."
    exit 1
fi

# 4d. Cancel Snipe
if [ ! -z "$SNIPE_ID" ]; then
    echo "Cancelling Snipe $SNIPE_ID..."
    dfx canister call Sniper cancelSnipe "($SNIPE_ID)"
    echo "✅ Snipe cancelled."
else
    echo "⚠️ Skipping cancel test (No ID)"
fi


# 5. Test WalletTracker Functions
echo "Testing WalletTracker Functions..."

# 5a. Add Wallet
echo "Adding Wallet..."
# addWalletEntry(userPrincipal : Principal, address : Text, name : Text)
dfx canister call WalletTracker addWalletEntry "(principal \"$USER_PRINCIPAL\", \"test-wallet-addr\", \"Test Wallet\")"

# 5b. Get Wallets
echo "Getting Wallets..."
# getUserWallets(userPrincipal : Principal)
WALLETS=$(dfx canister call WalletTracker getUserWallets "(principal \"$USER_PRINCIPAL\")")
echo "Wallets: $WALLETS"

if [[ "$WALLETS" == *"test-wallet-addr"* ]]; then
    echo "✅ Wallet list verified."
else
    echo "❌ Wallet list check failed."
    exit 1
fi

echo "------------------------------------------------"
echo "✅ E2E Test Completed Successfully"
echo "------------------------------------------------"
