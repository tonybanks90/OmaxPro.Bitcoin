# 🧠 OMAX – Bitcoin DeFi Trading Hub
![OMAX Preview](./src/assets/OMAX.png)

Welcome to **OMAX**, the first advanced **Bitcoin-native DeFi trading platform**.  
OMAX unlocks the full potential of Bitcoin DeFi, including memecoins, Runes, and experimental tokens.  

**Watch the demo:**  
[![OMAX Demo](https://img.youtube.com/vi/NsO1JcFgMpg/0.jpg)](https://youtu.be/NsO1JcFgMpg?si=iObXyJ-LiKPQ2aqu)

OMAX enables users to trade assets from **Odin.fun, Tyche.run, AstroApe.fun** seamlessly, all from a **single interface**.  
Users sign in with **Bitcoin, Ethereum, Solana, or Google**, and manage their assets using a **secure onchain wallet** powered by **chain-key cryptography**.

---

## 🚀 Key Features

- 🔄 **Runes Aggregator**: Aggregate liquidity from Bitcoin DeFi DEXs like Odin.fun , Tyche.run, KongSwap, AstroApe .
- 🔐 **Secure Onchain Wallets**: Generated and secured with chain-key cryptography & Internet Identity.
- 👀 **Wallet Tracking & Copy Trading**: Follow top wallets and mirror trades with one click.
- 🤖 **Automation & Sniper Tools**: Quick buy on token launches, auto-triggers, trailing strategies.
- 📊 **Real-Time P&L & Analytics**: Track per-trade and per-wallet profit/loss.
- 🌱 **Curated Discovery Pipeline**: Newly Created → About to Graduate → Graduated tokens with Quick Buy CTA.
- 🌍 **Translator & Localization**: Built-in language switcher for global accessibility.
- 🖥 **Polished UI/UX**: Clean, fast, and intuitive trading interface.
- 🔮 **Future Onchain Agents**: Programmable bots for autonomous strategies like arbitrage, DCA, and wallet mirroring.

---

## 🧱 Architecture Overview

OMAX is fully **decentralized on ICP** using **Chain Fusion** technology, focused entirely on **Bitcoin DeFi**.

### 🔧 Wallet Manager Canister
- Generates and manages Bitcoin addresses securely.
- Supports multiple sign-in options: Internet Identity Bitcoin, Ethereum, Solana, Google.
- Unified balance tracking across all connected addresses.

### 🔄 Trading Engine Canister
- Executes trades across Odin.fun, Tyche.run, AstroApe.fun.
- Reads onchain market data via their API.
- Supports assisted quick buys, automation triggers, and copy-trading.

### 🌱 Discovery & Analytics Canister
- Curated pipeline: Newly Created → About to Graduate → Graduated.
- Token metrics, liquidity alerts, whale activity, and performance analytics.
- Quick Buy CTA for every stage to capture fast-moving opportunities.

### 🖥 Frontend Canister
- React-based interface served onchain.
- Proxy-based development flow (Vite → DFX).
- Uses `@dfinity/agent` for secure backend interaction.
- Built-in Translator for multi-language support.

### 🤖 Onchain Agents (Future)
- Programmable bots that monitor onchain events.
- Execute decentralized trading strategies autonomously.
- Safety controls and permissioned execution.

---

## 📈 Roadmap Highlights
- **July**: Team formation, ideation, core technologies.  
- **August**: Prototype, UI/UX, feedback, partner integrations, data API.  
- **September**: Wallet Tracker, wallet generation, swap component, Closed Alpha.  
- **October**: Advanced charts, sniper component, Public Alpha, CI/CD deployment.

---

## 🔗 Get Started
1. Clone the repository  
   ```bash
   git clone https://github.com/tonybanks90/multi-pro-trader.git


## 🧪 Local Development Guide

OMAXPro is initialized using the Internet Computer SDK (`dfx`) with full support for frontend and backend development.

### 📦 Prerequisites

- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- Node.js & npm

### 📁 Project Structure

```bash
multi-trader/ (OMAXPro root)
├── src/
│   ├── multi-trader-backend/       # Canister logic (Motoko or Rust)
│   ├── omax-pro-frontend/      # Web frontend (React + Vite)
│  
├── dfx.json                   # DFX config
├── package.json               # NPM metadata
└── README.md                  # You're here!


If you want to start working on your project right away, you might want to try the following commands:

```bash
cd multi-trader/
dfx help
dfx canister --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
cd/src
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`DFX_NETWORK` to `ic` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
  - Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor


## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** License.

See the full license: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
