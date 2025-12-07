# Factory End-to-End Test Plan

## Overview
This document outlines the test strategy for the `TFactory` canister, which is responsible for creating different types of Prediction Markets. We have created an automated shell script (`test_factory_e2e.sh`) to execute these tests.

## Prerequisites
- Local replica running (`dfx start --background`)
- Canisters deployed (`dfx deploy`)
- `jq` installed (optional, for JSON parsing if we enhanced the script)

## Test Scenarios

### 1. Initialization and Wiring
- **Goal**: Ensure the Factory is correctly connected to the `Markets` and `Vault` canisters.
- **Action**: Call `setTokenFactory` on Markets and `setMarketsCanister` on Factory.
- **Verification**: Canisters return `(variant { ok })`.

### 2. Binary Market Creation
- **Goal**: Create a standard YES/NO market.
- **Input**: Title, Description, Category (Crypto), Tags, Expiry.
- **Verification**: 
  - Factory returns a valid Market ID (e.g., `9`).
  - YES and NO token ledgers are deployed.

### 3. Multiple Choice Market Creation
- **Goal**: Create a market with >2 outcomes.
- **Input**: Outcomes ["Option A", "Option B", "Option C"].
- **Verification**:
  - Factory returns a valid Market ID.
  - Token ledgers for all 3 outcomes are deployed.

### 4. Compound Market Creation
- **Goal**: Create a complex market with multiple subjects (e.g., stock tickers).
- **Input**: Subjects ["AAPL", "MSFT", "GOOGL"].
- **Verification**:
  - Factory returns a valid Market ID.
  - Token pairs (YES/NO) for each subject are deployed.
  - **Note**: This requires significant cycles (~5T+) as it deploys multiple canisters.

### 5. Query Functionality
- **Goal**: Verify market discovery queries.
- **Actions**:
  - `getAllMarkets`: Should list all created IDs.
  - `getActiveMarkets`: Should list markets where `bettingCloseTime > now`.
  - `getMarketsByCategory`: Should filter by variant (e.g., `variant { Crypto }`).

## Running the Verification Script

1. Make the script executable:
   ```bash
   chmod +x test_factory_e2e.sh
   ```

2. Run the script:
   ```bash
   ./test_factory_e2e.sh
   ```

## Expected Output
```text
🚀 Starting Factory End-to-End Test
--- Setting up Identities ---
...
--- Ensuring Canisters are Wired ---
...
--- Test Case 1: Create Binary Market ---
Result: (variant { ok = 9 : nat })
✅ Binary Market Created with ID: 9
...
🎉 All Factory E2E Tests Passed!
```

## Troubleshooting
- **Insufficient Cycles**: If `createCompoundMarket` fails, the Factory likely ran out of cycles. The script automatically deposits 20T cycles to handle this.
- **Identity Errors**: If `test_user` errors appear, ensure you are not running in an environment with restricted identity creation (like Playground).
