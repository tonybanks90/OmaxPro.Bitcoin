#!/bin/bash

# Configuration
NETWORK="local"
IDENTITY="default"

# Function to get absolute path of dfx (ignores aliases/functions)
get_dfx_path() {
    find /home/antony/.cache/dfinity/versions -name dfx -type f | sort -V | tail -n 1
}

DFX=$(get_dfx_path)

echo "Using dfx at: $DFX"

echo "=================================================="
echo "Checking Markets from TFactory (Registry)"
echo "=================================================="
$DFX canister call TFactory getAllMarkets --network $NETWORK

echo ""
echo "=================================================="
echo "Checking Markets from Markets Canister (State)"
echo "=================================================="
$DFX canister call Markets getAllMarkets --network $NETWORK
