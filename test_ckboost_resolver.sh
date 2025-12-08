#!/usr/bin/env bash
# CKBoost Resolver Test Script
# Tests if the automated booster is resolving deposit requests

set -e

echo "🚀 CKBoost Resolver Test"
echo "========================"

# Check if booster is running
echo ""
echo "📋 Step 1: Check Booster Status"
echo "--------------------------------"
if pgrep -f "booster" > /dev/null; then
    echo "✅ Booster process is running"
else
    echo "⚠️ Booster process not detected. Make sure 'npm run booster' is running."
    echo "   You can start it with: cd src/omax-pro-frontend && npm run booster"
fi

# Query the CKBoost backend for pending requests
echo ""
echo "📋 Step 2: Query Pending Requests"
echo "----------------------------------"

# Use dfx to call the backend canister directly
CKBOOST_BACKEND="75egi-7qaaa-aaaao-qj6ma-cai"

echo "Querying CKBoost backend ($CKBOOST_BACKEND) for pending requests..."

# This requires dfx to be available. If running against mainnet, use --ic flag
PENDING=$(dfx canister call --ic $CKBOOST_BACKEND getPendingBoostRequests '()' 2>/dev/null || echo "FAILED")

if [ "$PENDING" == "FAILED" ]; then
    echo "⚠️ Could not query pending requests via dfx."
    echo "   This is expected if you don't have dfx configured for mainnet."
    echo ""
    echo "📝 Alternative: Check the booster logs for activity:"
    echo "   - Look for '🔍 Evaluating Request' messages"
    echo "   - Look for '✅ Accepted Request' messages"
    echo "   - Look for any error messages"
else
    echo "Pending Requests:"
    echo "$PENDING" | head -50
    
    # Count requests
    REQ_COUNT=$(echo "$PENDING" | grep -c "id =" || echo "0")
    echo ""
    echo "📊 Found approximately $REQ_COUNT pending requests"
fi

# Check booster logs if available
echo ""
echo "📋 Step 3: Booster Activity Summary"
echo "------------------------------------"
echo "To verify the resolver is working:"
echo ""
echo "1. Create a new deposit request via the UI at /ckbtcdeposit"
echo "2. Watch the booster terminal for:"
echo "   - '🔍 Evaluating Request X' - Shows request was found"
echo "   - '✓ Auto-approving specific test user' - Shows user approved"
echo "   - 'Amount' and 'Max Fee' details"
echo ""
echo "3. Check /boosterstats page for your request status"
echo ""
echo "4. If you fund the booster wallet, you should see:"
echo "   - '✅ Accepted Request X' - Request was boosted"
echo "   - Stats update showing fees earned"

echo ""
echo "📋 Current Configuration Check"
echo "-------------------------------"

# Check .env for booster config
if [ -f "src/omax-pro-frontend/.env" ]; then
    echo "Found .env file. Key settings:"
    grep -E "BOOSTER_|PLATFORM_|MAX_AMOUNT|MIN_FEE" src/omax-pro-frontend/.env 2>/dev/null || echo "   (No booster-specific settings found)"
else
    echo "No .env file found in src/omax-pro-frontend/"
fi

echo ""
echo "🎉 Test Complete!"
echo ""
echo "Next steps to fully test the resolver:"
echo "1. Ensure the booster wallet has ckTESTBTC balance"
echo "2. Create a deposit request from the UI"
echo "3. Watch for the booster to accept and process it"
echo "4. Verify status changes on /boosterstats"
