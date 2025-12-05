# OmaxPro Trading Guide

This guide explains how the Prediction Markets trading mechanism works, how to buy/sell tokens, and the role of the Liquidity Parameter (`b`).

## 1. How Trading Works (LMSR AMM)

The prediction markets use a **Logarithmic Market Scoring Rule (LMSR)** Automated Market Maker (AMM). Unlike an order book (where you wait for a counterparty), you trade directly against the contract's liquidity pool.

### Buying
When you buy shares (e.g., "YES" tokens), the price of that outcome increases, and the price of the opposing outcome ("NO") decreases.
-   **Cost**: The cost is calculated based on how much your purchase moves the probability.
-   **Slippage**: Larger trades move the price more. The system protects you by reverting trades if the price moves more than your `maxSlippage` tolerance.

### Selling
Selling is effectively "burning" your tokens back into the AMM to get collateral (ckBTC) back.
-   **Value**: You get back the current value of the tokens based on the current market state.

## 2. Liquidity Parameter (`b`)

The variable `b` represents the **depth of liquidity** in the market.

-   **Higher `b`** (e.g., 1000):
    -   Prices are more stable.
    -   It takes *more* money to move the price.
    -   Slippage is lower for large trades.
    -   **Cost**: The market creator puts up more initial capital (subsidy).

-   **Lower `b`** (e.g., 10):
    -   Prices are volatile.
    -   Small trades move the price significantly.
    -   High slippage.
    -   **Cost**: Cheaper to initialize.

**Analogy**: Think of `b` as the "mass" of the market object. A heavy object (high `b`) is hard to push (change price). A light object (low `b`) is easy to push.

## 3. Trading via Scripts

We have provided scripts to interact with the markets via the command line.

### Checking Markets
Run `./check_markets.sh` to see all available markets and their IDs.

### Buying Tokens
To buy tokens, you interact with the `Markets` canister's `buyTokens` method.

**Arguments**:
1.  `marketId` (Nat): The ID of the market (e.g., `1`).
2.  `tokenIdentifier` (Variant): What you want to buy (e.g., `variant { Binary = variant { YES } }`).
3.  `amountSatoshis` (Nat64): How much ckBTC you are spending (e.g., `1000`).
4.  `maxSlippage` (Float): Max acceptable price change (0.0 to 1.0, where 0.5 = 50%).

**Example Command**:
```bash
dfx canister call Markets buyTokens "(1:nat, variant { Binary = variant { YES } }, 1000:nat64, 0.1:float64)"
```

### Selling Tokens
To sell, use `sellTokens`.

**Arguments**:
1.  `marketId`: Market ID.
2.  `tokenIdentifier`: What you are selling.
3.  `amountTokens` (Nat64): Number of tokens to sell (e.g., `500` - remember decimals!).
4.  `minPrice` (Nat64): Minimum satoshis you accept receiving.

## 4. Troubleshooting High Slippage

If you see `Price slippage too high`, it means your trade size is too large relative to `b`.

**Fixes**:
1.  **Reduce Trade Size**: Buy fewer tokens.
2.  **Increase Slippage Tolerance**: Pass a higher float (e.g., `0.99`) if you don't care about price.
3.  **Create Custom Market**: Create a new market with a higher `b` (requires code change in initialization).
