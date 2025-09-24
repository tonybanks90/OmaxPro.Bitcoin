# Markets Canister - Prediction Markets Platform

A comprehensive prediction markets system built on the Internet Computer (ICP) with precise Bitcoin (ckBTC) integration, supporting three market types: Binary, Multiple Choice, and Compound markets.

## 🚀 Features

### 🎯 **Multi-Market Type Support**
- **Binary Markets**: Simple YES/NO predictions with complementary pricing
- **Multiple Choice Markets**: N mutually exclusive outcomes 
- **Compound Markets**: Multiple independent subjects, each with YES/NO tokens

### 💰 **Bitcoin-Precise Trading**
- Native **ckBTC** integration with satoshi-level precision
- All amounts handled as `Nat64` (up to 18.4M BTC capacity)
- **1:1 redemption** for winning tokens

### 🏦 **Advanced Vault Architecture**
- **Unique vault addresses** per market type:
  - Binary: 1 vault per market
  - Multiple Choice: 1 vault per market
  - Compound: 1 vault per subject
- **Isolated fund management** for enhanced security
- **Automatic vault setup** during market registration

### 📈 **LMSR Market Making**
- **Logarithmic Market Scoring Rule** for automated pricing
- **No order books** - instant liquidity at all times
- **Slippage protection** with configurable limits
- **Independent pricing** for compound market subjects

### 🔒 **Enterprise Security**
- **Role-based access control** (TokenFactory, Resolvers, Controllers)
- **Comprehensive error recovery** with automatic rollbacks
- **Balance validation** before all operations
- **Type-safe market resolution** with validation

## 📋 Prerequisites

- [DFINITY SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (dfx)
- [Motoko](https://internetcomputer.org/docs/current/motoko/intro/) 
- [Node.js](https://nodejs.org/) (for deployment scripts)

## 🛠 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd markets-canister

# Install dependencies
npm install

# Start local replica
dfx start --background

# Deploy the canister
dfx deploy
```
 
## 🏗 Architecture Overview

```
TokenFactory → Markets Canister ← Vault Canister
                     ↓
            ICRC-2 Token Ledgers
            (YES/NO/Outcome tokens)
```

### Core Components

1. **Markets Canister** - Main trading and resolution logic
2. **Vault Canister** - ckBTC custody and payment processing  
3. **Token Factory** - Creates ICRC-2 tokens and registers markets
4. **ICRC-2 Ledgers** - Individual token contracts for each outcome

## 🎮 Usage Examples

### 1. Binary Market Trading

```motoko
// Buy YES tokens - "Will Bitcoin reach $100k by 2024?"
let result = await markets.buyTokens(
    marketId: 1,
    tokenIdentifier: #Binary(#YES),
    amountSatoshis: 50_000_000, // 0.5 BTC
    maxSlippage: 0.1           // 10% max price increase
);

// Sell NO tokens
let sellResult = await markets.sellTokens(
    marketId: 1, 
    tokenIdentifier: #Binary(#NO),
    amountTokens: 25_000_000,  // Token amount to sell
    minPrice: 40_000_000       // Minimum 0.4 BTC payout
);
```

### 2. Multiple Choice Market Trading

```motoko
// Buy Trump tokens - "Who will win 2024 election?"
let result = await markets.buyTokens(
    marketId: 2,
    tokenIdentifier: #Outcome("Donald Trump"),
    amountSatoshis: 25_000_000, // 0.25 BTC
    maxSlippage: 0.05          // 5% max slippage
);
```

### 3. Compound Market Trading

```motoko
// Buy Apple YES tokens - "Tech Stock Performance 2024"
let result = await markets.buyTokens(
    marketId: 3,
    tokenIdentifier: #Subject(("Apple", #YES)),
    amountSatoshis: 30_000_000, // 0.3 BTC
    maxSlippage: 0.08          // 8% max slippage
);

// Sell Microsoft NO tokens (independent from Apple)
let sellResult = await markets.sellTokens(
    marketId: 3,
    tokenIdentifier: #Subject(("Microsoft", #NO)), 
    amountTokens: 15_000_000,
    minPrice: 12_000_000
);
```

## 🔧 API Reference

### Market Registration

```motoko
// Binary market registration (TokenFactory only)
registerBinaryMarketWithVault(args: BinaryRegistrationArgs) 
    : async Result.Result<MarketRegistrationResult, Text>

// Multiple choice registration  
registerMultipleChoiceMarketWithVault(args: MultipleChoiceRegistrationArgs)
    : async Result.Result<MarketRegistrationResult, Text>

// Compound market registration
registerCompoundMarketWithVault(args: CompoundRegistrationArgs)
    : async Result.Result<MarketRegistrationResult, Text>
```

### Trading Operations

```motoko
// Universal buy function (all market types)
buyTokens(
    marketId: Nat,
    tokenIdentifier: TokenIdentifier, 
    amountSatoshis: Nat64,
    maxSlippage: Float
) : async Result.Result<BuyResult, Text>

// Universal sell function (all market types)
sellTokens(
    marketId: Nat,
    tokenIdentifier: TokenIdentifier,
    amountTokens: Nat64, 
    minPrice: Nat64
) : async Result.Result<SellResult, Text>
```

### Market Resolution

```motoko
// Resolve market (Resolver only)
resolveMarket(marketId: Nat, resolution: MarketResolution)
    : async Result.Result<(), Text>

// Redeem winning tokens (Anyone)
redeemWinningTokens(marketId: Nat) 
    : async Result.Result<RedemptionResult, Text>
```

### Query Functions

```motoko
// Get market information
getMarket(marketId: Nat) : async Result.Result<MarketState, Text>
getAllMarkets() : async [MarketState]
getMarketsByType(marketType: MarketType) : async [MarketState]

// Get pricing information
getMarketPrice(marketId: Nat, tokenIdentifier: TokenIdentifier) 
    : async Result.Result<Float, Text>
getMarketPrices(marketId: Nat) 
    : async Result.Result<[(TokenIdentifier, Float)], Text>

// Get configuration
getMarketConfig(marketId: Nat) : async Result.Result<MarketConfigResponse, Text>
getVaultAddresses(marketId: Nat) : async Result.Result<VaultAddressConfig, Text>
```

## 📊 Market Types Explained

### 1. Binary Markets
**Structure**: Two tokens (YES, NO)  
**Example**: "Will Bitcoin reach $100k by 2024?"
- YES tokens win if Bitcoin reaches $100k
- NO tokens win if Bitcoin doesn't reach $100k  
- Prices are complementary: YES_price + NO_price ≈ 1.0

### 2. Multiple Choice Markets  
**Structure**: N outcome tokens (mutually exclusive)
**Example**: "Who will win the 2024 US Election?"
- Outcomes: Trump, Harris, Kennedy, Other
- Only one outcome can win
- All outcome probabilities sum ≤ 1.0

### 3. Compound Markets
**Structure**: Multiple subjects × (YES, NO) tokens
**Example**: "Tech Stock Performance 2024"  
- Subjects: Apple, Microsoft, Google
- Each subject has independent YES/NO tokens
- Apple's performance doesn't affect Microsoft's pricing
- Each subject resolved independently

## 🔐 Security Model

### Access Control
- **Controllers**: Deploy, configure, deactivate markets
- **TokenFactory**: Register new markets only
- **Resolvers**: Resolve specific markets only  
- **Users**: Trade and redeem tokens

### Financial Security
- **Vault Isolation**: Each market/subject has dedicated vaults
- **Error Recovery**: Automatic rollbacks on failed operations
- **Balance Validation**: Insufficient funds prevented
- **Slippage Protection**: Price movement limits

### Operational Security  
- **Type Safety**: Compile-time validation of market operations
- **State Consistency**: Atomic updates with rollback capability
- **Audit Trail**: Complete transaction history per vault

## 🧮 LMSR Pricing Model

The system uses **Logarithmic Market Scoring Rule (LMSR)** for automated market making:

### Cost Function
```
C(q) = b × ln(e^(q₁/b) + e^(q₂/b) + ... + e^(qₙ/b))
```

### Price Function  
```
P(i) = e^(qᵢ/b) / Σⱼ e^(qⱼ/b)
```

Where:
- `b` = liquidity parameter (higher = more liquidity, lower price sensitivity)
- `qᵢ` = quantity of outcome i tokens in circulation
- `P(i)` = current price/probability of outcome i

### Key Properties
- **Instant Liquidity**: No waiting for counterparties
- **Automatic Pricing**: Prices adjust based on trading activity  
- **Bounded Loss**: Market maker loss is bounded by `b × ln(n)`
- **Proper Scoring**: Incentivizes truthful probability reporting

## 🚀 Deployment Guide

### 1. Setup Configuration

```bash
# Set canister principals in deployment script
MARKETS_CANISTER="rdmx6-jaaaa-aaaaa-aaadq-cai"
VAULT_CANISTER="renrk-eyaaa-aaaaa-aaada-cai"  
TOKEN_FACTORY="rrkah-fqaaa-aaaaa-aaaaq-cai"
```

### 2. Initialize Canisters

```bash
# Deploy markets canister
dfx deploy markets

# Set TokenFactory canister  
dfx canister call markets setTokenFactory '(principal "rrkah-fqaaa-aaaaa-aaaaq-cai")'

# Set Vault canister
dfx canister call markets setVaultCanister '(principal "renrk-eyaaa-aaaaa-aaada-cai")'
```

### 3. Register First Market

```motoko
// Binary market example
let args = {
    base = {
        question = "Will Bitcoin reach $100k by end of 2024?";
        resolver = principal "resolver-principal-here";
        expiry = 1735689600; // Dec 31, 2024 timestamp
        b = 100.0;           // Liquidity parameter
        totalSupply = 1_000_000_000_000; // 10,000 BTC worth
    };
    yesLedger = principal "yes-token-ledger";
    noLedger = principal "no-token-ledger";
};

let result = await tokenFactory.createBinaryMarket(args);
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test with local replica
dfx start --background
npm run test:local
```

## 📈 Monitoring & Analytics

### Market Metrics
- Total volume traded (satoshis)
- Current token supply
- Price history
- Vault balances

### Query Examples
```bash
# Get market overview
dfx canister call markets getAllMarkets

# Check market prices
dfx canister call markets getMarketPrices '(1)'

# Check vault addresses
dfx canister call markets getVaultAddresses '(1)'
```

## 🔧 Configuration

### Market Limits
- **Multiple Choice**: Maximum 50 outcomes per market
- **Compound Markets**: Maximum 20 subjects per market  
- **Trading**: Minimum 1 satoshi per trade
- **Slippage**: 0-100% configurable per trade

### LMSR Parameters
- **Liquidity Parameter (b)**: 1.0 - 1000.0 (higher = more liquidity)
- **Token Supply**: Up to 18.4M BTC equivalent (Nat64 limit)
- **Precision**: Satoshi-level (0.00000001 BTC minimum)

## 🐛 Troubleshooting

### Common Issues

**Market Registration Fails**
```
Error: "Vault setup failed"
```
- Ensure Vault canister is deployed and configured
- Check TokenFactory has correct Markets canister principal

**Trading Fails**
```  
Error: "Vault not registered"
```
- Market registration must complete successfully first
- Check market.vaultRegistered = true

**Resolution Fails**
```
Error: "Only designated resolver can resolve market"  
```
- Only the resolver principal set during registration can resolve
- Check msg.caller matches market.resolver

### Getting Help

- 📧 Issues: [GitHub Issues](your-repo/issues)
- 💬 Discord: [Your Discord Link]
- 📚 Docs: [Full Documentation](your-docs-link)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open Pull Request

### Development Setup
```bash
# Install development dependencies
npm install --dev

# Run linting
npm run lint

# Format code
npm run format
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Vault Canister](link-to-vault-repo) - ckBTC custody and payments
- [Token Factory](link-to-factory-repo) - ICRC-2 token creation  
- [Frontend Interface](link-to-frontend-repo) - Web trading interface

---

## 📊 Quick Reference

| Market Type | Tokens | Vault Addresses | Use Case |
|-------------|---------|-----------------|----------|
| **Binary** | 2 (YES/NO) | 1 per market | Simple predictions |
| **Multiple Choice** | N outcomes | 1 per market | Elections, competitions |
| **Compound** | 2N (subjects × YES/NO) | 1 per subject | Multi-subject analysis |

| Function | Access Level | Purpose |
|----------|-------------|---------|
| `buyTokens` | Public | Trade on any market |
| `sellTokens` | Public | Trade on any market |  
| `registerMarket*` | TokenFactory | Create new markets |
| `resolveMarket` | Resolver | Determine winners |
| `redeemWinningTokens` | Public | Cash out winnings |

---

**Built with ❤️ on the Internet Computer**