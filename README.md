# 🧠 OMAX – Bitcoin DeFi Trading Hub & Prediction Markets

## 📖 **Important Documentation Links**

### **Core Documentation**
- **[Factory Documentation](https://github.com/tonybanks90/OmaxPro.Bitcoin/blob/dev/FactoryDOC.md)**
- **[Market Documentation](https://github.com/tonybanks90/OmaxPro.Bitcoin/blob/dev/MarketDOC.md)**
- **[Resolver Documentation](https://github.com/tonybanks90/OmaxPro.Bitcoin/blob/dev/ResolverDOC.md)**
- **[Vault Documentation](https://github.com/tonybanks90/OmaxPro.Bitcoin/blob/dev/VaultDOC.md)**
- **[Technical Diagrams & FlowCharts](https://drive.google.com/drive/folders/1rdkEPO3itqNCUCrYQsVdlBKKW6tHZXAb?usp=sharing){:target="_blank"}**
- **[📚 Documentation Hub](https://omaxpro.gitbook.io/omaxpro-docs/){:target="_blank"}**

### **🎬 Platform Demo**
- **[OMAX YouTube Channel](https://www.youtube.com/@Omax.Bitcoin){:target="_blank"}**

### **ICRC-151 MTLS Implementation**
- **[MTLS Test Implementation (Local)](https://github.com/tonybanks90)/OmaxPro.Bitcoin/tree/dev/src/multi-trader-backend/Predict(Test)**
- **[Multi-Token Ledger Standard - Motoko Version (GitHub)](https://github.com/tonybanks90/Multi-Token-Ledger-Standard-motoko-version){:target="_blank"}**

---


Welcome to **OMAX**, the first advanced **Bitcoin-native DeFi trading platform** with integrated **prediction markets**.  
OMAX unlocks the full potential of Bitcoin DeFi, including memecoins, Runes, experimental tokens, and sophisticated prediction markets powered by ckBTC.

**Watch the demo:**  

OMAX enables users to trade assets from **Odin.fun, Tyche.run, AstroApe.fun** seamlessly, plus participate in **Bitcoin prediction markets** with satoshi-level precision, all from a **single interface**.  
Users sign in with **Bitcoin, Ethereum, Solana, or Google**, and manage their assets using a **secure onchain wallet** powered by **chain-key cryptography**.

---

## 🚀 Key Features

### 📈 Bitcoin Prediction Markets
- 🎯 **Multi-Market Types**: Binary (YES/NO), Multiple Choice (elections, competitions), and Compound markets (multi-subject analysis)
- ⚡ **Instant Liquidity**: LMSR automated market making with no order books
- 💰 **Satoshi Precision**: Native ckBTC integration with 1:1 redemption for winning tokens
- 🔒 **Isolated Vaults**: Dedicated vault addresses per market for enhanced security
- 🏆 **Professional Resolution**: Designated resolvers with permissionless redemption

### 🔄 DeFi Trading Hub  
- 🔗 **Runes Aggregator**: Aggregate liquidity from Bitcoin DeFi DEXs like Odin.fun, Tyche.run, KongSwap, AstroApe
- 🔐 **Secure Onchain Wallets**: Generated and secured with chain-key cryptography & Internet Identity
- 👀 **Wallet Tracking & Copy Trading**: Follow top wallets and mirror trades with one click
- 🤖 **Automation & Sniper Tools**: Quick buy on token launches, auto-triggers, trailing strategies

### 📊 Analytics & Discovery
- 📊 **Real-Time P&L & Analytics**: Track per-trade, per-wallet, and per-market profit/loss
- 🌱 **Curated Discovery Pipeline**: Newly Created → About to Graduate → Graduated tokens with Quick Buy CTA
- 💹 **Market Insights**: Live prediction market odds, volume tracking, and outcome probabilities
- 🔍 **Advanced Filtering**: Filter by market type, category (Crypto, Political, Sports, etc.), and resolution timeframes

### 🌐 User Experience
- 🌍 **Translator & Localization**: Built-in language switcher for global accessibility
- 🖥 **Polished UI/UX**: Clean, fast, and intuitive trading interface
- 🔮 **Future Onchain Agents**: Programmable bots for autonomous strategies like arbitrage, DCA, and prediction market analysis

---

## 🧱 Architecture Overview

OMAX is fully **decentralized on ICP** using **Chain Fusion** technology, focused on **Bitcoin DeFi** and **prediction markets**.

### 🏭 MarketFactory Canister
- Creates and manages ICRC-2 token ledgers for prediction market outcomes
- Handles market metadata with comprehensive validation (titles, descriptions, categories, tags)
- Supports all market types with creator tracking and resolution frameworks
- Automatic token deployment for YES/NO, outcome, and subject-specific tokens

### 📊 Markets Canister  
- Executes prediction market trading with LMSR automated market making
- Manages market registration, resolution, and redemption processes
- Handles vault isolation per market type for enhanced security
- Processes real-time pricing with slippage protection

### 🏦 Vault Canister
- Provides secure ckBTC custody with isolated fund management
- Unique vault addresses per market (Binary/Multiple Choice) or per subject (Compound)
- Handles automated payments and 1:1 redemption ratios
- Comprehensive audit trails for all transactions

### 🔧 Wallet Manager Canister
- Generates and manages Bitcoin addresses securely
- Supports multiple sign-in options: Internet Identity, Bitcoin, Ethereum, Solana, Google
- Unified balance tracking across prediction markets and DeFi positions

### 🔄 Trading Engine 
- Executes trades across Odin.fun, Tyche.run, AstroApe.fun
- Reads onchain market data via their APIs
- Supports assisted quick buys, automation triggers, and copy-trading
- Integrates with prediction market pricing for unified P&L tracking

### 🌱 Discovery & Analytics Canister
- Curated pipeline: Newly Created → About to Graduate → Graduated tokens
- Token metrics, liquidity alerts, whale activity, and performance analytics  
- Prediction market analytics: volume, probability tracking, resolution history
- Quick Buy CTA for every stage to capture fast-moving opportunities

### 🖥 Frontend Canister
- React-based interface served onchain
- Proxy-based development flow (Vite → DFX)
- Uses `@dfinity/agent` for secure backend interaction
- Unified interface for DeFi trading and prediction markets
- Built-in Translator for multi-language support

### 🤖 Onchain Agents (Future)
- Programmable bots that monitor onchain events
- Execute decentralized trading strategies autonomously
- Prediction market analysis and automated betting strategies
- Safety controls and permissioned execution

---

## 🎯 Prediction Markets Examples

### Binary Markets
```
"Will Bitcoin reach $100k by end of 2024?"
- YES tokens win if BTC ≥ $100k before Jan 1, 2025
- NO tokens win if BTC < $100k 
- Complementary pricing: YES + NO ≈ 1.0 BTC
```

### Multiple Choice Markets
```
"Who will win the 2024 US Presidential Election?"
- Outcomes: Trump, Harris, Kennedy, Other
- Only one outcome wins
- All probabilities sum ≤ 1.0 BTC
```

### Compound Markets
```
"Tech Stock Performance 2024"
- Subjects: Apple, Microsoft, Google (each independent)
- Each subject has YES/NO tokens for meeting targets
- Apple's performance doesn't affect Microsoft pricing
```

---

## 📈 Roadmap Highlights
- **July**: Team formation, ideation, core technologies
- **August**: Prototype, UI/UX, feedback, partner integrations, data API
- **September**: Wallet Tracker, wallet generation, swap component, Closed Alpha
- **October**: Prediction Markets MVP, LMSR implementation, Advanced charts, sniper component, Public Alpha
- **November**: Multi-market trading, vault integration, resolution framework
- **December**: Full prediction markets launch, automated market making, CI/CD deployment

---

## 🔗 Get Started
1. Clone the repository  
   ```bash
   git clone https://github.com/tonybanks90/OmaxPro.Bitcoin.git
   ```

## 🧪 Local Development Guide

OMAX Pro is initialized using the Internet Computer SDK (`dfx`) with full support for frontend and backend development.

### 📦 Prerequisites

- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- Node.js & npm

### 📁 Project Structure

```bash
multi-trader/ (OMAX root)
├── src/
│   ├── multi-trader-backend/       # Core backend canisters
│   │   ├── KongRouter/             # Kong DEX integration
│   │   ├── Predict(testMTLS)/      # ICRC-151 MTLS test implementation
│   │   ├── PredictionMarkets/      # Main prediction markets logic
│   │   ├── RunesTrading/           # Bitcoin Runes trading functionality
│   │   └── Wallet/                 # Wallet management & address generation
│   ├── omax-pro-frontend/          # Web frontend (React + Vite)
│  
├── dfx.json                        # DFX configuration
├── package.json                    # NPM metadata
└── README.md                       # You're here!
```

### 🚀 Quick Start

```bash
cd omaxpro.bitcoin/
dfx help
dfx canister --help
```

## Running the project locally

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

### 🎯 Prediction Markets Testing

```bash
# Upload ICRC-2 ledger WASM for token creation
node scripts/upload-wasm.js

# Create test markets
dfx canister call TokenFactory createBinaryMarket '(record {
  title = "Will Bitcoin reach $100k by 2024?";
  description = "Market resolves YES if BTC reaches $100k";
  category = variant { Crypto };
  image = variant { ImageUrl = "" };
  tags = vec { variant { Crypto } };
  bettingCloseTime = 1735689600;
  expirationTime = 1735689600;
  resolutionLink = "https://coinmarketcap.com";
  resolutionDescription = "Based on CoinMarketCap data";
})'
```

### 🔄 Development Workflow

If you have made changes to your backend canister, you can generate a new candid interface with:

```bash
npm run generate
```

For frontend development:

```bash
cd src/
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set `DFX_NETWORK` to `ic` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
- Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor

---

## 📊 Market Statistics

- **Market Types Supported**: 3 (Binary, Multiple Choice, Compound)
- **Maximum Outcomes**: 50 per Multiple Choice market
- **Maximum Subjects**: 20 per Compound market  
- **Precision**: Satoshi-level (0.00000001 BTC minimum)
- **Capacity**: Up to 18.4M BTC equivalent per market
- **Slippage Protection**: 0-100% configurable per trade

---

## 🛡️ Security Features

- **Vault Isolation**: Dedicated addresses per market/subject
- **Access Control**: Role-based permissions (TokenFactory, Resolvers, Controllers)
- **Financial Security**: Automatic rollbacks, balance validation, error recovery
- **Audit Trail**: Complete transaction history per vault
- **Type Safety**: Compile-time validation of all market operations

---

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** License.

See the full license: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)