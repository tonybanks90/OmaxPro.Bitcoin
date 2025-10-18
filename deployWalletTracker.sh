#!/bin/bash

# Wallet Address Book Canister Deployment Script

set -e

echo "🚀 Starting Wallet Address Book Canister Deployment"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install the DFINITY SDK first."
    echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install"
    exit 1
fi

# Check if dfx is running
if ! dfx ping local &> /dev/null; then
    echo "🔄 Starting local Internet Computer replica..."
    dfx start --background --clean
    sleep 5
else
    echo "✅ Local Internet Computer replica is already running"
fi

# Deploy the canister
echo "📦 Deploying Wallet Address Book canister..."
dfx deploy WalletTracker

# Get canister ID
CANISTER_ID=$(dfx canister id WalletTracker)
echo "✅ Canister deployed successfully!"
echo "📋 Canister ID: $CANISTER_ID"

# Create environment file for frontend
echo "📝 Creating environment configuration..."
cat > .env.local << EOF
# Wallet Address Book Canister Configuration
REACT_APP_WALLET_CANISTER_ID=$CANISTER_ID
REACT_APP_IC_HOST=http://localhost:8080
REACT_APP_DFX_NETWORK=local

# For production deployment, use:
# REACT_APP_IC_HOST=https://ic0.app
# REACT_APP_DFX_NETWORK=ic
EOF

# Display deployment information
echo ""
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━