#!/usr/bin/env bash
set -e

# Use specific dfx binary to bypass shim issues
DFX_PATH="/home/antony/snap/code/214/.local/share/dfx/versions/0.29.2/dfx"

function dfx {
    "$DFX_PATH" "$@"
}
RECIPIENT="${1:-lbpq4-uqnev-x3fjm-l5hzy-hgigl-gaybe-rayhc-awlss-ds6zp-aok3k-eae}"

# Default amount: 10 BTC (1,000,000,000 satoshis)
AMOUNT="${2:-1000000000}"

echo "Funding account $RECIPIENT with $AMOUNT satoshis (ckBTC)..."

# Check if dfx is running
if ! pgrep -x "dfx" > /dev/null; then
    echo "Error: dfx is not running. Please start it first."
    exit 1
fi

# Execute transfer
dfx canister call "uxrrr-q7777-77774-qaaaq-cai" icrc1_transfer "(record {
  to = record { owner = principal \"$RECIPIENT\" };
  amount = $AMOUNT;
})"

echo "Funded successfully!"
