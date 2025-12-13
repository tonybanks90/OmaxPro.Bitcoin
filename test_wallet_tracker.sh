#!/bin/bash
set -e

echo "Deploying WalletTracker canister..."

# Start replica if not running
if ! dfx ping local &> /dev/null; then
    echo "Starting local replica..."
    dfx start --background --clean
    sleep 5
fi

dfx deploy WalletTracker

echo "Getting principal..."
PRINCIPAL=$(dfx identity get-principal)
echo "Current identity principal: $PRINCIPAL"

echo "Adding test wallets..."

# Address 1
ADDRESS1="h6yqn-pl6cb-ky5ps-hztzf-4mrck-kxz2r-dtzzu-kmst7-dpndl-4xvgd-iae"
echo "Adding $ADDRESS1..."
dfx canister call WalletTracker addWalletEntry "(principal \"$PRINCIPAL\", \"$ADDRESS1\", \"Test Wallet 1\")"

# Address 2
ADDRESS2="4zr5b-hgmlz-hnsxw-f2nik-2mcma-6w2bt-33pz3-h5rky-zrkg3-wtawd-2ae"
echo "Adding $ADDRESS2..."
dfx canister call WalletTracker addWalletEntry "(principal \"$PRINCIPAL\", \"$ADDRESS2\", \"Test Wallet 2\")"

# Address 3
ADDRESS3="dufiz-l2apu-372w4-3mhfc-r7vdh-5rv6n-vgoc7-fbjwe-67fhb-nwdp5-cae"
echo "Adding $ADDRESS3..."
dfx canister call WalletTracker addWalletEntry "(principal \"$PRINCIPAL\", \"$ADDRESS3\", \"Test Wallet 3\")"

echo "Verifying wallets..."
dfx canister call WalletTracker getUserWallets "(principal \"$PRINCIPAL\")"
