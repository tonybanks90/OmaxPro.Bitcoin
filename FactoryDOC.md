# MarketFactory - Prediction Market Token Factory

A sophisticated prediction market system built on the Internet Computer (IC) that creates and manages ICRC-1/ICRC-2 compliant tokens for different types of prediction markets.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Market Types](#market-types)
- [Fee System](#fee-system)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Admin Guide](#admin-guide)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

MarketFactory is a canister that dynamically creates ICRC-1/ICRC-2 compliant token canisters for prediction markets. It supports three types of markets and integrates with ckBTC for market creation fees.

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User/dApp     │───▶│  MarketFactory   │───▶│  Token Ledgers  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         │
                       ┌──────────────────┐            │
                       │ Markets Canister │◀───────────┘
                       │   (Minter)       │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   ckBTC Ledger   │
                       │  (Fee Payment)   │
                       └──────────────────┘
```

## Features

- ✅ **Three Market Types**: Binary, Multiple Choice, Compound markets
- ✅ **ICRC Standards**: Full ICRC-1 and ICRC-2 compliance for all tokens
- ✅ **Dynamic Token Creation**: Automatic token canister deployment
- ✅ **ckBTC Fee System**: 3,300 satoshi creation fee using ICRC-2 approvals
- ✅ **Rich Metadata**: Comprehensive market information and categorization
- ✅ **Admin Controls**: Network switching, fee management, emergency controls
- ✅ **Cycle Management**: Built-in cycle management for sustainability
- ✅ **Markets Canister Integration**: Separate minting canister for trading operations

## Quick Start

### Prerequisites

```bash
# Install DFX
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# Start local replica
dfx start --background
```

### Basic Setup

```bash
# Deploy the factory
dfx deploy market_factory

# Set admin (first time only)
dfx canister call market_factory setAdmin '(principal "YOUR_PRINCIPAL")'

# Upload ICRC-1/ICRC-2 WASM module
dfx canister call market_factory uploadWasm '(blob "WASM_BYTES")'

# Set markets canister
dfx canister call market_factory setMarketsCanister '(principal "MARKETS_CANISTER_ID")'
```

### Create Your First Market

```javascript
// 1. Check fee requirements
const feeInfo = await marketFactory.getMarketCreationFee();
console.log(`Fee: ${feeInfo.feeSats} satoshis`);

// 2. Approve ckBTC spending (user side)
const approveResult = await ckbtcLedger.icrc2_approve({
    spender: { owner: marketFactoryPrincipal, subaccount: [] },
    amount: 3300n,
    fee: [10n]
});

// 3. Create binary market
const marketArgs = {
    title: "Will Bitcoin reach $100K by 2025?",
    description: "Market resolves YES if Bitcoin reaches $100,000 USD by Dec 31, 2025",
    category: { Crypto: null },
    image: { ImageUrl: "https://example.com/btc.png" },
    tags: [{ Crypto: null }],
    bettingCloseTime: 1735689600000000000n, // End of 2025
    expirationTime: 1735776000000000000n,   // Resolution deadline
    resolutionLink: "https://coinmarketcap.com",
    resolutionDescription: "Based on CoinMarketCap closing price"
};

const result = await marketFactory.createBinaryMarket(marketArgs);
console.log(`Market created with ID: ${result.Ok}`);
```

## System Requirements

### Minimum Cycles
- **Binary Market**: 2T cycles (2 tokens)
- **Multiple Choice Market**: N × 1T cycles (N outcomes)
- **Compound Market**: 2N × 1T cycles (N subjects × 2 tokens each)

### ckBTC Requirements
- **Creation Fee**: 3,300 satoshis per market
- **Transfer Fee**: 10 satoshis per ckBTC transaction
- **User must approve**: Factory to spend creation fee amount

### Network Support
- **Mainnet**: ckBTC ledger `mxzaz-hqaaa-aaaar-qaada-cai`
- **Testnet**: ckTESTBTC ledger `mc6ru-gyaaa-aaaar-qaaaq-cai`

## Installation

### Using DFX

```bash
# Clone repository
git clone <repository-url>
cd market-factory

# Install dependencies
npm install

# Deploy to local replica
dfx deploy --network local

# Deploy to mainnet
dfx deploy --network ic
```

### Manual Deployment

```bash
# Build canister
dfx build market_factory

# Deploy with specific cycles
dfx canister create market_factory --with-cycles 10000000000000
dfx canister install market_factory --wasm .dfx/local/canisters/market_factory/market_factory.wasm
```

## Configuration

### Initial Setup Checklist

1. **Set Admin**
```motoko
dfx canister call market_factory setAdmin '(principal "YOUR_ADMIN_PRINCIPAL")'
```

2. **Upload WASM Module**
```motoko
dfx canister call market_factory uploadWasm '(blob "ICRC_LEDGER_WASM")'
```

3. **Set Markets Canister**
```motoko
dfx canister call market_factory setMarketsCanister '(principal "MARKETS_CANISTER_ID")'
```

4. **Configure Network** (Optional, defaults to testnet)
```motoko
dfx canister call market_factory setNetwork '(true)' // true for mainnet
```

5. **Add Cycles**
```motoko
dfx canister deposit-cycles 100000000000000 market_factory
```

### Environment Variables

```bash
# .env file
MARKET_FACTORY_CANISTER_ID=your_canister_id
MARKETS_CANISTER_ID=your_markets_canister_id
ADMIN_PRINCIPAL=your_admin_principal
NETWORK=local|ic
```

## Market Types

### 1. Binary Markets

Simple YES/NO prediction markets.

```javascript
const binaryMarket = {
    title: "Will it rain tomorrow?",
    description: "Weather prediction for tomorrow",
    category: { Entertainment: null },
    image: { ImageUrl: "weather.png" },
    tags: [{ web2: null }],
    bettingCloseTime: tomorrow,
    expirationTime: dayAfterTomorrow,
    resolutionLink: "weather.com",
    resolutionDescription: "Based on official weather reports"
};

const marketId = await marketFactory.createBinaryMarket(binaryMarket);
```

**Tokens Created:**
- `YES{marketId}` - Pays out if market resolves YES
- `NO{marketId}` - Pays out if market resolves NO

### 2. Multiple Choice Markets

Markets with 2-20 possible outcomes.

```javascript
const multipleChoiceMarket = {
    title: "Who will win the 2028 Election?",
    description: "US Presidential Election prediction",
    category: { Political: null },
    outcomes: ["Candidate A", "Candidate B", "Candidate C"],
    // ... other fields
};

const marketId = await marketFactory.createMultipleChoiceMarket(multipleChoiceMarket);
```

**Tokens Created:**
- One token per outcome (e.g., `CANDIDATE_A1`, `CANDIDATE_B1`, etc.)

### 3. Compound Markets

Markets with multiple subjects, each having YES/NO outcomes.

```javascript
const compoundMarket = {
    title: "Tech Stock Performance 2025",
    description: "Will these stocks outperform S&P 500?",
    category: { Stocks: null },
    subjects: ["AAPL", "GOOGL", "MSFT"],
    // ... other fields
};

const marketId = await marketFactory.createCompoundMarket(compoundMarket);
```

**Tokens Created:**
- `AAPL_YES1`, `AAPL_NO1`
- `GOOGL_YES1`, `GOOGL_NO1`  
- `MSFT_YES1`, `MSFT_NO1`

## Fee System

### How It Works

The factory uses ICRC-2's `approve`/`transfer_from` pattern for seamless fee collection:

1. **User approves** factory to spend ckBTC
2. **Factory collects fee** during market creation
3. **Admin can withdraw** collected fees

### Fee Structure

```typescript
interface FeeInfo {
    feeSats: number;           // 3,300 satoshis
    transferFeeSats: number;   // 10 satoshis
    totalRequired: number;     // Amount user needs to approve
    ledgerCanister: string;    // ckBTC ledger principal
}
```

### User Flow

```javascript
// 1. Check fee requirements
const feeInfo = await marketFactory.getMarketCreationFee();

// 2. Approve spending (one-time or per-market)
await ckbtcLedger.icrc2_approve({
    spender: { owner: factoryPrincipal, subaccount: [] },
    amount: BigInt(feeInfo.feeSats),
    fee: [BigInt(feeInfo.transferFeeSats)]
});

// 3. Create market (fee automatically deducted)
const result = await marketFactory.createBinaryMarket(marketArgs);
```

### Admin Fee Management

```javascript
// Check collected fees
const stats = await marketFactory.getCollectedFees();
console.log(`Total collected: ${stats.totalCollected} satoshis`);

// Withdraw all fees
await marketFactory.withdrawCollectedFees(
    { owner: adminPrincipal, subaccount: [] },
    null // null = withdraw all
);

// Withdraw specific amount
await marketFactory.withdrawCollectedFees(
    { owner: adminPrincipal, subaccount: [] },
    1000n // 1,000 satoshis
);
```

## API Reference

### Market Creation

#### `createBinaryMarket(args: CreateBinaryMarketArgs) -> Result<MarketId, Text>`

Creates a binary (YES/NO) prediction market.

**Parameters:**
```typescript
interface CreateBinaryMarketArgs {
    title: string;                    // 1-200 characters
    description: string;              // 1-1000 characters
    category: Category;               // Market category
    image: ImageData;                 // Market image
    tags: Tag[];                      // Max 5 tags
    bettingCloseTime: bigint;         // Nanosecond timestamp
    expirationTime: bigint;           // Nanosecond timestamp
    resolutionLink: string;           // Resolution source
    resolutionDescription: string;    // How market resolves
}
```

**Returns:**
- `Ok(MarketId)` - Unique market identifier
- `Err(Text)` - Error message

**Example:**
```javascript
const result = await marketFactory.createBinaryMarket({
    title: "Will ETH reach $5K in 2025?",
    description: "Ethereum price prediction",
    category: { Crypto: null },
    image: { ImageUrl: "eth-logo.png" },
    tags: [{ Crypto: null }],
    bettingCloseTime: 1735689600000000000n,
    expirationTime: 1735776000000000000n,
    resolutionLink: "coinmarketcap.com",
    resolutionDescription: "Based on CMC closing price"
});

if ('Ok' in result) {
    console.log(`Market ID: ${result.Ok}`);
} else {
    console.error(`Error: ${result.Err}`);
}
```

#### `createMultipleChoiceMarket(args: CreateMultipleChoiceMarketArgs) -> Result<MarketId, Text>`

Creates a multiple choice market with 2-20 outcomes.

**Additional Parameters:**
```typescript
interface CreateMultipleChoiceMarketArgs extends BaseMarketArgs {
    outcomes: string[];  // 2-20 outcomes, each 1-50 characters
}
```

#### `createCompoundMarket(args: CreateCompoundMarketArgs) -> Result<MarketId, Text>`

Creates a compound market with 2-10 subjects.

**Additional Parameters:**
```typescript
interface CreateCompoundMarketArgs extends BaseMarketArgs {
    subjects: string[];  // 2-10 subjects, each 1-50 characters
}
```

### Query Functions

#### `getMarketInfo(marketId: MarketId) -> ?MarketInfo`

Get complete information about a specific market.

```javascript
const marketInfo = await marketFactory.getMarketInfo(1n);
if (marketInfo) {
    console.log(`Title: ${marketInfo.metadata.title}`);
    console.log(`Creator: ${marketInfo.metadata.creator}`);
    console.log(`Tokens:`, marketInfo.tokens);
}
```

#### `getAllMarkets() -> MarketInfo[]`

Get all markets created by the factory.

```javascript
const allMarkets = await marketFactory.getAllMarkets();
console.log(`Total markets: ${allMarkets.length}`);
```

#### `getMarketsByCategory(category: Category) -> MarketInfo[]`

Filter markets by category.

```javascript
const cryptoMarkets = await marketFactory.getMarketsByCategory({ Crypto: null });
```

#### `getActiveMarkets() -> MarketInfo[]`

Get markets that are still accepting bets.

```javascript
const activeMarkets = await marketFactory.getActiveMarkets();
```

#### `getMarketTokens(marketId: MarketId) -> ?Principal[]`

Get all token canister principals for a market.

```javascript
const tokens = await marketFactory.getMarketTokens(1n);
if (tokens) {
    console.log("Market tokens:", tokens);
}
```

### Fee System

#### `getMarketCreationFee() -> FeeInfo`

Get current fee information.

```javascript
const feeInfo = await marketFactory.getMarketCreationFee();
console.log(`Fee: ${feeInfo.feeSats} sats on ${feeInfo.ledgerCanister}`);
```

#### `checkUserAllowance(user: Principal) -> Nat`

Check user's current ckBTC allowance to the factory.

```javascript
const allowance = await marketFactory.checkUserAllowance(userPrincipal);
console.log(`Current allowance: ${allowance} satoshis`);
```

#### `getCollectedFees() -> FeeStats`

Get fee collection statistics (admin only).

```javascript
const stats = await marketFactory.getCollectedFees();
console.log(`Total collected: ${stats.totalCollected} sats`);
console.log(`Markets created: ${stats.totalMarketsCreated}`);
```

### Admin Functions

#### `setAdmin(newAdmin: Principal) -> Result<Text, Text>`

Set or update admin principal.

#### `setMarketsCanister(canister: Principal) -> Result<Text, Text>`

Configure the markets canister (required before creating markets).

#### `setNetwork(mainnet: Bool) -> Result<Text, Text>`

Switch between mainnet and testnet ckBTC.

#### `withdrawCollectedFees(to: Account, amount: ?Nat) -> Result<Nat, Text>`

Withdraw collected fees to specified account.

#### `setMarketCreationEnabled(enabled: Bool) -> Result<Text, Text>`

Emergency disable/enable market creation.

## Examples

### Complete Market Creation Flow

```javascript
// Market creation with full error handling
async function createMarketWithFee(marketArgs) {
    try {
        // 1. Check system status
        const status = await marketFactory.getSystemStatus();
        if (!status.marketCreationEnabled) {
            throw new Error("Market creation is disabled");
        }
        
        if (!status.marketsCanisterSet) {
            throw new Error("Markets canister not configured");
        }

        // 2. Get fee info
        const feeInfo = await marketFactory.getMarketCreationFee();
        console.log(`Fee required: ${feeInfo.feeSats} satoshis`);

        // 3. Check current allowance
        const allowance = await marketFactory.checkUserAllowance(userPrincipal);
        
        if (allowance < feeInfo.feeSats) {
            console.log("Approving ckBTC spending...");
            
            // 4. Approve ckBTC spending
            const approveResult = await ckbtcLedger.icrc2_approve({
                spender: { owner: factoryPrincipal, subaccount: [] },
                amount: BigInt(feeInfo.feeSats),
                fee: [BigInt(feeInfo.transferFeeSats)],
                memo: [],
                from_subaccount: [],
                created_at_time: [],
                expected_allowance: [],
                expires_at: []
            });

            if ('Err' in approveResult) {
                throw new Error(`Approval failed: ${JSON.stringify(approveResult.Err)}`);
            }
            
            console.log(`Approved at block: ${approveResult.Ok}`);
        }

        // 5. Create market
        console.log("Creating market...");
        const result = await marketFactory.createBinaryMarket(marketArgs);
        
        if ('Ok' in result) {
            const marketId = result.Ok;
            console.log(`✅ Market created successfully! ID: ${marketId}`);
            
            // 6. Get market info
            const marketInfo = await marketFactory.getMarketInfo(marketId);
            console.log("Market details:", marketInfo);
            
            return marketId;
        } else {
            throw new Error(`Market creation failed: ${result.Err}`);
        }
        
    } catch (error) {
        console.error("❌ Error creating market:", error);
        throw error;
    }
}

// Usage
const marketArgs = {
    title: "Will AI achieve AGI by 2030?",
    description: "Artificial General Intelligence milestone",
    category: { AI: null },
    image: { ImageUrl: "agi-icon.png" },
    tags: [{ AI: null }, { Technology: null }],
    bettingCloseTime: 1893456000000000000n, // 2030
    expirationTime: 1893456000000000000n,
    resolutionLink: "research-papers.com",
    resolutionDescription: "Based on expert consensus"
};

createMarketWithFee(marketArgs);
```

### Market Discovery

```javascript
// Find markets by different criteria
async function discoverMarkets() {
    // Get active crypto markets
    const cryptoMarkets = await marketFactory.getMarketsByCategory({ Crypto: null });
    const activeOnly = cryptoMarkets.filter(market => 
        market.metadata.bettingCloseTime > Date.now() * 1000000
    );
    
    console.log(`Active crypto markets: ${activeOnly.length}`);

    // Get markets by specific creator
    const myMarkets = await marketFactory.getMarketsByCreator(myPrincipal);
    console.log(`My markets: ${myMarkets.length}`);

    // Get AI-tagged markets
    const aiMarkets = await marketFactory.getMarketsByTag({ AI: null });
    console.log(`AI markets: ${aiMarkets.length}`);

    // Get market statistics
    const stats = await marketFactory.getMarketCountByType();
    console.log("Market statistics:", stats);
}
```

### Token Interaction

```javascript
// Interact with created market tokens
async function interactWithMarketTokens(marketId) {
    // Get all tokens for the market
    const tokenPrincipals = await marketFactory.getMarketTokens(marketId);
    
    if (!tokenPrincipals) {
        console.log("Market not found");
        return;
    }

    console.log(`Market ${marketId} has ${tokenPrincipals.length} tokens`);

    // Get token metadata for each token
    for (const tokenPrincipal of tokenPrincipals) {
        const metadata = await marketFactory.getTokenMetadata(tokenPrincipal);
        if (metadata) {
            console.log(`Token: ${metadata.symbol}`);
            console.log(`Name: ${metadata.name}`);
            console.log(`Minter: ${metadata.minting_account.owner}`);
        }

        // Create token actor to interact with ICRC-1 functions
        const tokenActor = Actor.createActor(icrcInterface, {
            agent,
            canisterId: tokenPrincipal
        });

        // Check balance
        const balance = await tokenActor.icrc1_balance_of({
            owner: userPrincipal,
            subaccount: []
        });
        console.log(`Balance: ${balance}`);
    }
}
```

## Admin Guide

### Initial Setup

1. **Deploy Factory**
```bash
dfx deploy MarketFactory --with-cycles 10000000000000
```

2. **Set Yourself as Admin**
```bash
dfx canister call MarketFactory setAdmin "(principal \"$(dfx identity get-principal)\")"
```

3. **Upload ICRC Ledger WASM**
```bash
# Get ICRC ledger WASM from DFINITY
wget https://download.dfinity.systems/ic/latest/canisters/ic-icrc1-ledger.wasm.gz
gunzip ic-icrc1-ledger.wasm.gz

# Upload to factory
dfx canister call market_factory uploadWasm "(blob \"$(xxd -p ic-icrc1-ledger.wasm | tr -d '\n')\")"
```

4. **Deploy Markets Canister**
```bash
dfx deploy Markets
dfx canister call MarketFactory setMarketsCanister "(principal \"$(dfx canister id Markets)\")"
```

```bash
dfx canister call mc6ru-gyaaa-aaaar-qaaaq-cai icrc2_approve "(record { 
  spender = record { 
    owner = principal \"475h5-dyaaa-aaaab-qac4a-cai\"; 
    subaccount = null 
  }; 
  amount = 1000000
})" --network ic
```

5. **Configure Network**
```bash
# For mainnet
dfx canister call MarketFactory setNetwork "(true)"

# For testnet (default)
dfx canister call market_factory setNetwork "(false)"
```

### Monitoring

```bash
# Check system status
dfx canister call market_factory getSystemStatus

# Monitor fee collection
dfx canister call market_factory getCollectedFees

# Check cycle balance
dfx canister call market_factory getCycleBalance

# View all markets
dfx canister call market_factory getAllMarkets
```

### Fee Management

```bash
# Withdraw all collected fees
dfx canister call market_factory withdrawCollectedFees "(record { owner = principal \"$(dfx identity get-principal)\"; subaccount = null }, null)"

# Withdraw specific amount (1000 sats)
dfx canister call market_factory withdrawCollectedFees "(record { owner = principal \"$(dfx identity get-principal)\"; subaccount = null }, opt 1000)"
```

### Emergency Controls

```bash
# Disable market creation
dfx canister call market_factory setMarketCreationEnabled "(false)"

# Re-enable market creation
dfx canister call market_factory setMarketCreationEnabled "(true)"

# Change admin
dfx canister call market_factory setAdmin "(principal \"NEW_ADMIN_PRINCIPAL\")"
```

## Error Handling

### Common Error Types

#### Fee Collection Errors
```typescript
// Insufficient allowance
"Insufficient ckBTC allowance. Please approve 3300 satoshis"

// Insufficient balance
"Insufficient ckBTC balance: 1000 satoshis"

// Transfer failed
"Fee collection failed: BadFee"
```

#### Market Creation Errors
```typescript
// Validation errors
"Title must be between 1 and 200 characters"
"Too many outcomes. Maximum is 20"
"Betting close time must be in the future"

// System errors
"Markets canister not configured"
"Insufficient cycles. Need 2000000000000"
"WASM module not available"
```

#### Admin Errors
```typescript
// Authorization
"Unauthorized: Admin access required"

// Configuration
"Markets canister not set"
"Market creation temporarily disabled"
```

### Error Recovery

```javascript
// Robust error handling pattern
async function createMarketSafely(args) {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            return await marketFactory.createBinaryMarket(args);
        } catch (error) {
            retries++;
            
            if (error.message.includes("allowance")) {
                // Handle allowance issues
                console.log("Re-approving ckBTC...");
                await reapproveSpending();
                continue;
            }
            
            if (error.message.includes("cycles")) {
                // Handle cycle issues
                console.log("Cycle issue, waiting...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }
            
            if (retries >= maxRetries) {
                throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
            }
        }
    }
}
```

## Testing

### Local Testing Setup

```bash
# Start local replica
dfx start --clean --background

# Deploy ckBTC ledger for testing
dfx deploy ckbtc_ledger --argument '(record {
    minting_account = record { owner = principal "$(dfx identity get-principal)" };
    transfer_fee = 10;
    token_symbol = "ckTESTBTC";
    token_name = "Test ckBTC";
    metadata = vec {};
    initial_balances = vec { record { record { owner = principal "$(dfx identity get-principal)"; subaccount = null }; 100_000_000 } };
    archive_options = record {
        num_blocks_to_archive = 1000;
        trigger_threshold = 2000;
        controller_id = principal "$(dfx canister id ckbtc_ledger)";
        cycles_for_archive_creation = null;
    };
})'

# Deploy factory
dfx deploy market_factory

# Run tests
npm test
```

### Test Scenarios

```javascript
// Test fee collection
describe("Fee Collection", () => {
    test("collects fee on market creation", async () => {
        // Approve spending
        await ckbtcLedger.icrc2_approve({
            spender: { owner: factoryPrincipal, subaccount: [] },
            amount: 3300n
        });
        
        // Create market
        const result = await marketFactory.createBinaryMarket(testMarketArgs);
        
        expect('Ok' in result).toBe(true);
        
        // Check fee was collected
        const stats = await marketFactory.getCollectedFees();
        expect(stats.totalCollected).toBe(3300);
    });
    
    test("fails without sufficient allowance", async () => {
        const result = await marketFactory.createBinaryMarket(testMarketArgs);
        
        expect('Err' in result).toBe(true);
        expect(result.Err).toContain("allowance");
    });
});

// Test market types
describe("Market Creation", () => {
    test("creates binary market", async () => {
        const result = await createMarketWithFee(binaryMarketArgs);
        expect(result).toBe(1n);
        
        const tokens = await marketFactory.getMarketTokens(1n);
        expect(tokens.length).toBe(2); // YES and NO tokens
    });
    
    test("creates multiple choice market", async () => {
        const result = await createMarketWithFee(multipleChoiceArgs);
        expect(result).toBe(2n);
        
        const tokens = await marketFactory.getMarketTokens(2n);
        expect(tokens.length).toBe(3); // 3 outcome tokens
    });
});
```

### Integration Tests

```bash
# Test full flow with real ckBTC testnet
./test_integration.sh
```

## Contributing

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd market-factory

# Install dependencies
npm install

# Set up pre-commit hooks
npm run prepare

# Run linter
npm run lint

# Run tests
npm test
```

### Code Standards

- **Motoko**: Follow [official style guide](https://internetcomputer.org/docs/current/developer-docs/backend/motoko/style)
- **Documentation**: All public functions must be documented
- **Testing**: New features require test coverage
- **Error Handling**: Use `Result<T, Text>` pattern consistently

### Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Security

- Report security issues privately to [security@example.com]
- Follow responsible disclosure practices
- Security patches receive priority review

## Support

- **Documentation**: [Full API docs](./docs/api.md)
- **Examples**: [Example repository](./examples/)
- **Issues**: [GitHub Issues](./issues)
- **Discussions**: [Community forum](./discussions)

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**MarketFactory v1.0.0** - Built for the Internet Computer ecosystem