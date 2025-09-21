# Vault Canister

A secure custody system for managing ckBTC funds across prediction markets on the Internet Computer Protocol (ICP). The Vault canister provides isolated fund management, comprehensive statistics tracking, and strict access controls for prediction market operations.

## Overview

The Vault canister acts as a secure intermediary that holds user funds in market-specific subaccounts, ensuring complete fund isolation between different markets while facilitating seamless trading and payout operations through integration with the Markets canister.

### Key Features

- **Market-Specific Fund Isolation**: Each market gets a unique subaccount derived deterministically from its ID
- **Multi-Market Type Support**: Binary, Multiple Choice, and Compound prediction markets
- **ICRC-1/ICRC-2 Integration**: Standard-compliant ckBTC operations with approval-based transfers
- **Comprehensive Statistics**: Real-time tracking of deposits, withdrawals, and transaction volumes
- **Administrative Controls**: Emergency pause/resume functionality and market management
- **Audit Trail**: Complete transaction history with timestamps and block indices
- **Upgrade Safety**: Persistent state across canister upgrades

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controller    │    │  Markets        │    │   ckBTC         │
│                 │    │  Canister       │    │   Ledger        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ init/config           │ register/pull/pay     │ transfers
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vault Canister                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Market 1        │  │ Market 2        │  │ Market N        │ │
│  │ Subaccount:     │  │ Subaccount:     │  │ Subaccount:     │ │
│  │ [0,0,...,0,1]   │  │ [0,0,...,0,2]   │  │ [0,0,...,0,N]   │ │
│  │ Balance: X ckBTC│  │ Balance: Y ckBTC│  │ Balance: Z ckBTC│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Functionality

### 1. Market Registration

Markets are registered by the Markets canister with a specific type:

```motoko
public shared(msg) func registerMarket(marketId: MarketId, marketType: MarketType)
```

**Market Types:**
- `#Binary`: YES/NO markets (e.g., "Bitcoin reaches $100k by 2024?")
- `#MultipleChoice`: N-outcome markets (e.g., "2024 Election Winner")
- `#Compound`: Multi-subject markets (e.g., "Tech Stock Performance")

**Process:**
1. Validates caller is authorized Markets canister
2. Derives deterministic subaccount: `[28 zeros] + [4-byte market ID]`
3. Initializes market statistics and sets active status
4. Returns success confirmation with subaccount details

### 2. Fund Operations

#### Deposits (Pull Pattern)
```motoko
public shared(msg) func pull_ckbtc(marketId: MarketId, user: Principal, amount: Nat)
```

**Prerequisites:**
- User must approve vault for `amount + fee` using `icrc2_approve`
- Market must be registered and active

**Process:**
1. Validates market exists and is active
2. Checks user's allowance to vault
3. Executes `icrc2_transfer_from` to move funds to market subaccount
4. Updates market and system statistics
5. Returns transaction details with block index

#### Payouts
```motoko
public shared(msg) func pay_ckbtc(marketId: MarketId, user: Principal, amount: Nat)
```

**Process:**
1. Validates sufficient funds in market subaccount
2. Executes `icrc1_transfer` from market subaccount to user
3. Updates withdrawal statistics
4. Returns transaction confirmation

### 3. Market Management

#### Deactivation
```motoko
public shared(msg) func deactivateMarket(marketId: MarketId)
```
- Called by Markets canister when market resolves
- Prevents new deposits while allowing payouts
- Records deactivation timestamp

#### Emergency Controls (Controller Only)
```motoko
public shared(msg) func emergencyPause()
public shared(msg) func reactivateMarket(marketId: MarketId)
```

## Data Structures

### Market Information
```motoko
public type MarketInfo = {
    id: MarketId;
    marketType: ?MarketType;
    subaccount: [Nat8];
    balance: Nat;
    totalDeposited: Nat;
    totalWithdrawn: Nat;
    active: Bool;
    registrationTime: ?Nat64;
    deactivationTime: ?Nat64;
};
```

### Market Statistics
```motoko
public type MarketStats = {
    totalDeposited: Nat;
    totalWithdrawn: Nat;
    transactionCount: Nat;
    lastActivity: ?Nat64;
};
```

## Access Control

| Function Category | Markets Canister | Controller | Public |
|------------------|------------------|------------|--------|
| Market Registration | ✓ | ✗ | ✗ |
| Fund Operations | ✓ | ✗ | ✗ |
| Market Deactivation | ✓ | ✗ | ✗ |
| System Configuration | ✗ | ✓ | ✗ |
| Emergency Controls | ✗ | ✓ | ✗ |
| Query Functions | ✗ | ✗ | ✓ |

## API Reference

### Administrative Functions

#### `initialize(markets: Principal, ledger: Principal)`
**Access:** Controller only  
**Purpose:** Configure vault with Markets canister and ckBTC ledger  
**Returns:** `Result<(), Text>`

#### `updateConfiguration(markets: ?Principal, ledger: ?Principal)`
**Access:** Controller only  
**Purpose:** Update canister addresses and refresh ckBTC fee  
**Returns:** `Result<(), Text>`

### Market Operations

#### `registerMarket(marketId: MarketId, marketType: MarketType)`
**Access:** Markets canister only  
**Purpose:** Register new market and create subaccount  
**Returns:** `Result<(), Text>`

#### `pull_ckbtc(marketId: MarketId, user: Principal, amount: Nat)`
**Access:** Markets canister only  
**Purpose:** Transfer ckBTC from user to market subaccount  
**Returns:** `Result<{blockIndex: Nat; timestamp: Nat64}, Text>`

#### `pay_ckbtc(marketId: MarketId, user: Principal, amount: Nat)`
**Access:** Markets canister only  
**Purpose:** Transfer ckBTC from market subaccount to user  
**Returns:** `Result<{blockIndex: Nat; timestamp: Nat64}, Text>`

### Query Functions

#### `getMarketInfo(marketId: MarketId)`
**Access:** Public  
**Purpose:** Get comprehensive market information  
**Returns:** `Result<MarketInfo, Text>`

#### `get_balance_async(marketId: MarketId)`
**Access:** Public  
**Purpose:** Get current ckBTC balance for market  
**Returns:** `Result<Nat, Text>`

#### `getSystemStats()`
**Access:** Public  
**Purpose:** Get system-wide statistics and metrics  
**Returns:** System statistics including market counts and volumes

## Error Handling

### Common Error Scenarios

| Error | Cause | Resolution |
|-------|-------|------------|
| `"Market not registered"` | Invalid market ID | Register market first |
| `"Market is not active"` | Attempting deposits to resolved market | Check market status |
| `"Insufficient allowance"` | User hasn't approved vault | Call `icrc2_approve` |
| `"Insufficient vault balance"` | Not enough funds for payout | Check market balance |
| `"Only Markets canister can..."` | Unauthorized caller | Use correct canister |

### Error Response Format
All functions return `Result<Success, Text>` where error text provides specific details for debugging and user feedback.

## Security Model

### Fund Isolation
- Each market maintains completely separate funds in dedicated subaccounts
- Cross-market contamination is impossible due to subaccount isolation
- Market failures don't affect other markets

### Access Control
- **Strict Authorization**: Only Markets canister can move funds
- **Controller Privileges**: Limited to configuration and emergency functions
- **Public Queries**: Read-only access to statistics and balances

### Audit Trail
- All transactions recorded with block indices and timestamps
- Comprehensive statistics for regulatory compliance
- Complete transaction history maintained

## Deployment

### Prerequisites
- Internet Computer SDK (dfx)
- Motoko compiler
- ckBTC ledger canister deployed
- Markets canister deployed

### Deployment Steps

1. **Deploy Vault Canister**
```bash
dfx deploy Vault
```

2. **Initialize Configuration**
```bash
dfx canister call Vault initialize '(principal "markets-canister-id", principal "ckbtc-ledger-id")'
```

3. **Verify Configuration**
```bash
dfx canister call Vault getConfiguration
```

### Upgrade Process
The vault supports seamless upgrades with full state preservation:
- All market data persists across upgrades
- Statistics and timestamps maintained
- Active/inactive status preserved

## Integration Guide

### For Markets Canister

1. **Register Markets**
```motoko
let vaultResult = await vault.registerMarket(marketId, #Binary);
```

2. **Handle Deposits**
```motoko
let pullResult = await vault.pull_ckbtc(marketId, user, amount);
```

3. **Process Payouts**
```motoko
let payResult = await vault.pay_ckbtc(marketId, winner, payout);
```

### For Frontend Applications

1. **Check Market Status**
```motoko
let marketInfo = await vault.getMarketInfo(marketId);
```

2. **Monitor Balances**
```motoko
let balance = await vault.get_balance_async(marketId);
```

3. **System Monitoring**
```motoko
let stats = await vault.getSystemStats();
```

## Monitoring and Maintenance

### Key Metrics
- Total markets registered
- Active vs inactive markets
- Transaction volumes (deposits/withdrawals)
- Error rates and types
- Average transaction sizes

### Health Checks
- Market balance reconciliation
- Statistics consistency
- Access control validation
- Network connectivity to ckBTC ledger

### Maintenance Operations
- Regular configuration updates
- Fee adjustments based on network conditions
- Emergency pause during system maintenance
- Market reactivation after issues resolved

## License

This software is part of a prediction markets platform. All rights reserved.

## Support

For technical support, integration questions, or bug reports, please contact the development team or create an issue in the project repository.