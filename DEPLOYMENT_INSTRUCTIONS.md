# Markets Canister Deployment Instructions

## Changes Made

✅ **Updated VaultInterface** in `markets.mo`:
- Replaced `pullSatoshisFromVault` with `pull_ckbtc`
- Replaced `paySatoshisFromVault` with `pay_ckbtc`
- Updated method signatures to match actual Vault canister

✅ **Updated Method Calls**:
- Line ~671: `pullSatoshisFromVault` → `pull_ckbtc` with error handling
- Line ~719: `paySatoshisFromVault` → `pay_ckbtc` with error handling

## Deployment Steps

### 1. Redeploy Markets Canister

```bash
dfx deploy Markets --network local
```

### 2. Verify Deployment

```bash
dfx canister status Markets --network local
```

### 3. Test Trading

Try placing a bet from the UI or via CLI:

```bash
dfx canister call Markets buyTokens \
  '(7:nat, variant { Binary = variant { YES } }, 50000:nat64, 0.5:float64)' \
  --network local
```

**Expected Result**: Should succeed without "method not found" error.

## Troubleshooting

### If deployment fails:

1. **Check dfx is running**:
   ```bash
   dfx ping local
   ```

2. **Restart local replica if needed**:
   ```bash
   dfx stop
   dfx start --clean --background
   ```

3. **Redeploy all canisters**:
   ```bash
   dfx deploy --network local
   ```

### If trading still fails:

1. **Check Vault is initialized**:
   ```bash
   dfx canister call Vault getMarketInfo '(7:nat)' --network local
   ```

2. **Verify user has ckBTC and approval**:
   ```bash
   # Check balance
   dfx canister call ckbtc_ledger icrc1_balance_of \
     '(record { owner = principal "YOUR_PRINCIPAL" })' \
     --network local
   
   # Check allowance
   dfx canister call ckbtc_ledger icrc2_allowance \
     '(record { 
       account = record { owner = principal "YOUR_PRINCIPAL" }; 
       spender = record { owner = principal "VAULT_PRINCIPAL" } 
     })' \
     --network local
   ```

## What This Fixes

- ✅ "Canister has no update method 'pullSatoshisFromVault'" error
- ✅ Enables actual ckBTC transfers for trading
- ✅ Proper error handling for vault operations

## Next Steps After Deployment

1. Test buying tokens with the UI
2. Verify slippage controls work correctly
3. Check Debug Panel shows market state
4. Monitor console for any new errors
