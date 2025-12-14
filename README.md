# 🧠 OMAX – Bitcoin DeFi Trading Hub & Prediction Markets


> [!IMPORTANT]
> # 🚀 BREAKTHROUGH: New Prediction Markets Architecture
> **Cycle Costs Slashed by ~90% & Continuous Liquidity Enabled**
>
> We have completely re-engineered the Prediction Markets engine using the **ICRC-151 Multi-Token Standard** and **Linear Bonding Curves**.
>
> **Highlights:**
> - **ICRC-151**: Deploys a SINGLE ledger for multiple outcome tokens (Yes/No), saving massive amounts of cycles.
> - **Bonding Curve**: Ensures instant liquidity for all markets without order books.
> - **Optimized Flow**: Streamlined Factory -> Trade -> Vault architecture.
>
> 👉 **[READ THE FULL BREAKTHROUGH DOCUMENTATION HERE](src/multi-trader-backend/NewPredictionMarkets/README.md)** 👈
>
> ---
>
> [!TIP]
> # ⚡ ckBOOST: Bitcoin in the Fast Lane
> **From 60+ Minutes to < 10 Minutes**
>
> We've also solved the slow bridging problem. Using our custom **Automated Booster Service**, we provide liquidity to "boost" user deposits, effectively **swapping verification time for liquidity**.
>
> - **How?** Optimistic finality & platform-gated risk management.
> - **Why?** So you can trade the moment you deposit.
>
> 👉 **[READ THE FULL ckBOOST DOCS HERE](src/omax-pro-frontend/ckBOOST.md)** 👈

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
- **[MTLS Test Implementation (Local)](https://github.com/tonybanks90)**
- **[Multi-Token Ledger Standard - Motoko Version (GitHub)](https://github.com/tonybanks90/Multi-Token-Ledger-Standard-motoko-version)**

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

### 🛠️ One-Step Deployment & Test

We provide a comprehensive script to fast-track your local development. This script handles:
1.  Checking/Starting `dfx`
2.  Creating test identities
3.  Deploying all canisters (Ledgers, Markets, Vaults, Factories)
4.  Setting up inter-canister permissions
5.  Running end-to-end tests (Markets, Trading, Vaults)

```bash
# Make the script executable
chmod +x deploy_and_test.sh

# Run deployment and tests
./deploy_and_test.sh
```

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

## 🏗️ Advanced Technical Architecture

### 💡 ICRC-151 & Cycle Optimization (MTLS)

OMAX implements the **Multi-Token Ledger Standard (ICRC-151)** to solve a critical scalability challenge in prediction markets: **Canister Bloat**.

-   **The Problem**: Traditional architectures deploy a *new canister* for every single outcome token (YES/NO). This is expensive (cycle costs) and slow.
-   **The OMAX Solution**: We use a **Single-Canister Multi-Token Ledger**.
    -   **Cycle Saving**: Instead of paying for `N` canisters, we pay for **1** canister that manages `N` tokens using subaccounts and specialized state management.
    -   **Efficiency**: Reduces network chatter and maintenance costs by over **90%**.
    -   **D.O.G.E Friendly**: Optimized for Government Efficiency (and developer wallet efficiency).

### 🧮 Automated Market Maker (LMSR Bonding Curve)

We utilize the **Logarithmic Market Scoring Rule (LMSR)**, the gold standard for prediction markets, to ensure **Instant Liquidity**. You never need to wait for a counterparty to match your bet.

#### How it works
The cost function `C(q)` determines the total amount wagered in the market:

```math
C(q) = b \cdot \ln(e^{q_1/b} + e^{q_2/b} + \dots + e^{q_n/b})
```

-   **`b` (Liquidity Parameter)**: Controls the market depth. Higher `b` = less price movement per trade (stable). Lower `b` = dynamic price discovery.
-   **`q` (Quantity)**: The number of tokens outstanding for each outcome.

#### Why is this better?
1.  **Instant Execution**: Trades execute against the contract algorithmically.
2.  **Bounded Loss**: The market maker's worst-case loss is mathematically capped (`b * ln(n)`).
3.  **Dynamic Pricing**: Prices automatically adjust based on supply/demand.
    -   If users buy **YES**, the price of **YES** goes up and **NO** goes down.


---

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** License.

See the full license: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)