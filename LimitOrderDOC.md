# Limit Order System for Prediction Markets

## Overview

A comprehensive limit order system that enables users to place conditional buy/sell orders at specific prices, improving market liquidity and price discovery. The system implements industry-standard order book mechanics similar to Polymarket and traditional financial exchanges, adapted for prediction markets on the Internet Computer.

## Core Concepts

### Order Book Structure

Each token type maintains its own order book with two sides:

```
BID SIDE (Buy Orders)          ASK SIDE (Sell Orders)
Price | Quantity | User        Price | Quantity | User
------|----------|-----        ------|----------|-----
0.65  | 1,000    | Alice       0.70  | 500      | Bob
0.60  | 2,000    | Charlie     0.75  | 1,500    | David
0.55  | 500      | Eve         0.80  | 800      | Frank
```

### Order Matching Algorithm

**Price-Time Priority:**
1. **Price Priority**: Best prices matched first (highest bid, lowest ask)
2. **Time Priority**: Within same price level, first-in-first-out (FIFO)
3. **Partial Fills**: Large orders can match multiple smaller orders

### Market Types Integration

#### Binary Markets
- Two order books per market: YES tokens, NO tokens
- Prices constrained: YES + NO ≤ 1.00
- Order book depth typically highest due to simplicity

#### Multiple Choice Markets
- Separate order book per outcome (Trump, Biden, RFK, etc.)
- Constraint: Sum of all outcome prices ≤ 1.00
- Cross-outcome arbitrage opportunities possible

#### Compound Markets
- Order book per subject-outcome combination:
  - Apple YES, Apple NO
  - Microsoft YES, Microsoft NO
  - Google YES, Google NO
- Independent pricing per subject
- Most complex UI requirements

## System Architecture

### Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Order Book    │    │   Markets       │    │     Vault       │
│   Canister      │    │   Canister      │    │   Canister      │
│                 │    │                 │    │                 │
│ • Order Storage │    │ • Validation    │    │ • Escrow        │
│ • Matching      │    │ • Token Checks  │    │ • Settlement    │
│ • Price Calc    │    │ • Market State  │    │ • Fund Mgmt     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      User       │
                    │   Interface     │
                    │                 │
                    │ • Place Orders  │
                    │ • View Books    │
                    │ • Manage Orders │
                    └─────────────────┘
```

### Data Structures

#### Order Definition
```motoko
public type Order = {
    id: OrderId;
    user: Principal;
    marketId: MarketId;
    tokenType: TokenIdentifier;
    side: OrderSide;
    price: Float;              // Price per token (0.01 to 0.99)
    originalQuantity: Nat64;   // Initial order size
    remainingQuantity: Nat64;  // Unfilled amount
    filledQuantity: Nat64;     // Amount executed
    status: OrderStatus;
    createdAt: Nat64;
    updatedAt: Nat64;
    expiresAt: ?Nat64;        // Optional expiration
};

public type OrderSide = {
    #Buy;                     // Bid - willing to purchase
    #Sell;                    // Ask - willing to sell
};

public type OrderStatus = {
    #Open;                    // Active, awaiting fill
    #PartiallyFilled;         // Some quantity filled
    #Filled;                  // Completely filled
    #Cancelled;               // User cancelled
    #Expired;                 // Time-based expiry
    #MarketResolved;          // Market ended, order cancelled
};
```

#### Order Book Structure
```motoko
public type OrderBook = {
    marketId: MarketId;
    tokenType: TokenIdentifier;
    bids: [Order];            // Buy orders (highest price first)
    asks: [Order];            // Sell orders (lowest price first)
    lastPrice: ?Float;        // Most recent trade price
    volume24h: Nat64;         // 24-hour trading volume
    updatedAt: Nat64;
};
```

#### Trade Record
```motoko
public type Trade = {
    id: TradeId;
    marketId: MarketId;
    tokenType: TokenIdentifier;
    buyOrderId: OrderId;
    sellOrderId: OrderId;
    buyer: Principal;
    seller: Principal;
    price: Float;
    quantity: Nat64;
    timestamp: Nat64;
    buyerFees: Nat;          // ckBTC fees paid by buyer
    sellerFees: Nat;         // ckBTC fees paid by seller
};
```

## Order Lifecycle

### 1. Order Placement

#### Buy Order Process
1. **Validation**
   - Check market is active and not resolved
   - Validate price within bounds (0.01 ≤ price ≤ 0.99)
   - Verify quantity > 0

2. **Escrow Calculation**
   ```
   Required ckBTC = quantity × price + trading_fees
   ```

3. **Fund Lock**
   - Call `Vault.escrow_for_order(user, amount)`
   - Funds held until order fills or cancels

4. **Order Matching**
   - Immediate matching against existing asks
   - Remaining quantity becomes open order

5. **Order Book Update**
   - Add to appropriate price level
   - Maintain price-time priority

#### Sell Order Process
1. **Token Validation**
   - Check user owns sufficient tokens
   - Verify tokens are transferable

2. **Token Escrow**
   - Lock tokens in order book canister
   - Prevent double-spending

3. **Matching & Book Update**
   - Similar to buy orders

### 2. Order Matching

#### Matching Algorithm
```
function matchOrder(newOrder):
    matches = []
    remaining = newOrder.quantity
    
    for existingOrder in oppositeBook.sortedByPrice():
        if not pricesMatch(newOrder.price, existingOrder.price):
            break
            
        fillAmount = min(remaining, existingOrder.remaining)
        matches.append({
            price: existingOrder.price,  // Existing order price takes precedence
            quantity: fillAmount,
            buyer: getBuyer(newOrder, existingOrder),
            seller: getSeller(newOrder, existingOrder)
        })
        
        remaining -= fillAmount
        if remaining == 0:
            break
    
    return matches
```

#### Price Matching Rules
- **Buy orders**: Execute at or below specified price
- **Sell orders**: Execute at or above specified price
- **Trade price**: Always at the existing order's price (price improvement)

### 3. Settlement

#### Trade Settlement Process
1. **Calculate Settlement**
   ```
   Buyer pays: quantity × trade_price + fees
   Seller receives: quantity × trade_price - fees
   Tokens transferred: quantity to buyer
   ```

2. **Execute Settlement**
   - Call `Vault.settle_trade(trade_details)`
   - Transfer ckBTC between parties
   - Transfer tokens from seller to buyer

3. **Update Orders**
   - Reduce remaining quantities
   - Update order status
   - Remove fully filled orders

### 4. Order Management

#### Order Cancellation
```motoko
public shared(msg) func cancelOrder(orderId: OrderId) : async Result<(), Text> {
    // Validate user owns order
    // Check order is cancellable (Open or PartiallyFilled)
    // Return escrowed funds/tokens
    // Remove from order book
}
```

#### Automatic Cancellation Events
- **Market Resolution**: All open orders cancelled
- **Market Pause**: All orders frozen until reactivation
- **Order Expiry**: Time-based automatic cancellation

## Trading Fees

### Fee Structure
```
Trading Fee: 0.1% of trade value
Minimum Fee: 100 satoshis
Maximum Fee: 0.001 BTC per trade

Example:
Trade: 1,000 tokens at 0.50 = 500,000 satoshis
Fee: 500 satoshis (0.1%)
```

### Fee Distribution
- **Protocol Fee**: 70% to treasury
- **Market Maker Rebate**: 20% to liquidity providers
- **Infrastructure**: 10% to canister maintenance

## API Reference

### Order Management

#### Place Order
```motoko
public shared(msg) func placeOrder(
    marketId: MarketId,
    tokenType: TokenIdentifier,
    side: OrderSide,
    price: Float,
    quantity: Nat64,
    orderType: OrderType
) : async Result<OrderId, Text>
```

**Parameters:**
- `marketId`: Target prediction market
- `tokenType`: Specific token (YES, NO, outcome name)
- `side`: #Buy or #Sell
- `price`: Price per token (0.01 to 0.99)
- `quantity`: Number of tokens
- `orderType`: #Market, #Limit, #GoodTillCancelled

**Returns:** Order ID for tracking

#### Cancel Order
```motoko
public shared(msg) func cancelOrder(orderId: OrderId) : async Result<(), Text>
```

#### Get User Orders
```motoko
public query func getUserOrders(user: Principal, status: ?OrderStatus) : async [Order]
```

### Order Book Queries

#### Get Order Book
```motoko
public query func getOrderBook(
    marketId: MarketId, 
    tokenType: TokenIdentifier,
    depth: ?Nat
) : async OrderBook
```

**Parameters:**
- `depth`: Number of price levels to return (default: 10)

#### Get Best Bid/Ask
```motoko
public query func getBestPrices(marketId: MarketId, tokenType: TokenIdentifier) : async {
    bestBid: ?Float;
    bestAsk: ?Float;
    spread: ?Float;
}
```

#### Get Recent Trades
```motoko
public query func getRecentTrades(
    marketId: MarketId,
    tokenType: TokenIdentifier,
    limit: ?Nat
) : async [Trade]
```

### Market Statistics

#### Get Market Summary
```motoko
public query func getMarketSummary(marketId: MarketId) : async {
    tokens: [{
        tokenType: TokenIdentifier;
        lastPrice: ?Float;
        priceChange24h: Float;
        volume24h: Nat64;
        bestBid: ?Float;
        bestAsk: ?Float;
        openOrders: Nat;
    }];
    totalVolume: Nat64;
    totalTrades: Nat;
}
```

## Error Handling

### Common Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `ORDER_INVALID_PRICE` | Price outside valid range (0.01-0.99) | Adjust price |
| `ORDER_INSUFFICIENT_FUNDS` | Not enough ckBTC for buy order | Add funds |
| `ORDER_INSUFFICIENT_TOKENS` | Not enough tokens for sell order | Acquire tokens |
| `ORDER_MARKET_RESOLVED` | Market already resolved | Check market status |
| `ORDER_NOT_FOUND` | Invalid order ID | Verify order ID |
| `ORDER_NOT_CANCELLABLE` | Order already filled/cancelled | Check order status |
| `ORDER_EXPIRED` | Order past expiration time | Place new order |

### Error Response Format
```motoko
public type OrderError = {
    #InvalidPrice: { min: Float; max: Float; provided: Float };
    #InsufficientFunds: { required: Nat; available: Nat };
    #InsufficientTokens: { required: Nat64; available: Nat64 };
    #MarketResolved: { resolvedAt: Nat64 };
    #OrderNotFound: { orderId: OrderId };
    #MarketNotFound: { marketId: MarketId };
    #Unauthorized: { requiredRole: Text };
}
```

## Market Type Specific Behaviors

### Binary Markets

**Order Books:** 2 per market (YES, NO)

**Price Constraints:**
```
YES_price + NO_price ≤ 1.00
If YES = 0.60, then NO ≤ 0.40
```

**Example Order Book:**
```
BTC $100k by 2024 - YES Token

BIDS                    ASKS
Price | Size | Total   Price | Size | Total
0.65  | 1000 | 1000   0.70  | 500  | 500
0.60  | 2000 | 3000   0.75  | 1500 | 2000
0.55  | 500  | 3500   0.80  | 800  | 2800

Last: 0.67 | 24h Vol: 5,200 tokens
```

### Multiple Choice Markets

**Order Books:** N per market (one per outcome)

**Price Constraints:**
```
Sum of all outcome prices ≤ 1.00
Trump + Biden + RFK + Other ≤ 1.00
```

**Cross-Market Arbitrage:**
Users can exploit price inconsistencies across outcome books.

### Compound Markets

**Order Books:** 2N per market (N subjects × 2 outcomes)

**Example Structure:**
```
Tech Stocks 2024 Performance Market

Apple Order Books:
- Apple YES: [order book data]
- Apple NO:  [order book data]

Microsoft Order Books:
- Microsoft YES: [order book data]
- Microsoft NO:  [order book data]

Google Order Books:
- Google YES: [order book data]
- Google NO:  [order book data]
```

**Independent Pricing:** Each subject maintains separate price discovery.

## Performance Considerations

### Scalability

**Order Book Size:**
- Target: 1,000 orders per book maximum
- Pruning: Remove old cancelled/expired orders
- Archival: Move historical data to separate storage

**Matching Performance:**
- O(log n) order insertion using sorted data structures
- O(1) best bid/ask queries
- O(k) matching complexity where k = number of matched orders

**Memory Management:**
- Stable storage for persistent orders
- Transient storage for active matching
- Periodic cleanup of resolved market data

### Gas Optimization

**Batch Operations:**
- Process multiple matches in single transaction
- Aggregate similar operations
- Minimize cross-canister calls

**Efficient Data Structures:**
- Use TrieMap for O(log n) lookups
- Maintain sorted price levels
- Cache frequently accessed data

## Security Considerations

### Order Validation

**Input Sanitization:**
- Price range validation (0.01 ≤ price ≤ 0.99)
- Quantity limits (min: 1 token, max: market cap)
- Market state checks before order placement

**Authorization:**
- Users can only cancel their own orders
- Admin functions restricted to controllers
- Market state changes only from Markets canister

### Fund Safety

**Escrow Management:**
- Funds locked until order execution or cancellation
- Atomic settlement operations
- Double-spend prevention for tokens

**Error Recovery:**
- Failed settlements return escrowed funds
- Orphaned orders can be manually resolved
- Emergency pause functionality for critical issues

## Integration with Existing System

### Markets Canister Integration

**Market State Sync:**
- Order book receives market status updates
- Automatic order cancellation on resolution
- Market pause/resume propagation

**Token Validation:**
- Verify token existence before order placement
- Check user token balances for sell orders
- Coordinate with token minting/burning

### Vault Canister Integration

**Escrow Operations:**
```motoko
// New vault functions needed
public shared(msg) func escrowForOrder(user: Principal, amount: Nat) : async Result<EscrowId, Text>
public shared(msg) func releaseEscrow(escrowId: EscrowId) : async Result<(), Text>
public shared(msg) func settleTrade(tradeDetails: TradeSettlement) : async Result<(), Text>
```

**Settlement Coordination:**
- Multi-step atomic settlements
- Fee calculation and distribution
- Error handling and rollback procedures

## Deployment Strategy

### Phase 1: Core Order Book
- Basic limit orders (buy/sell)
- Simple matching algorithm
- Integration with existing vault/markets

### Phase 2: Advanced Features
- Good-till-cancelled orders
- Order expiration
- Market maker rebates

### Phase 3: Professional Features
- Stop-loss orders
- Iceberg orders
- Advanced analytics and reporting

This limit order system provides institutional-grade trading capabilities while maintaining the security and transparency of blockchain-based prediction markets. The design follows industry best practices and integrates seamlessly with your existing vault and markets architecture.