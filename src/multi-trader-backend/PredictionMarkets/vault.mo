import Debug "mo:base/Debug";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";
import Array "mo:base/Array";

actor Vault {
    
    // ===== TYPES =====
    
    public type MarketId = Nat;
    
    // ICRC-1 and ICRC-2 Types
    public type Account = {
        owner: Principal;
        subaccount: ?[Nat8];
    };
    
    public type TransferArgs = {
        from_subaccount: ?[Nat8];
        to: Account;
        amount: Nat;
        fee: ?Nat;
        memo: ?[Nat8];
        created_at_time: ?Nat64;
    };
    
    public type TransferFromArgs = {
        spender_subaccount: ?[Nat8];
        from: Account;
        to: Account;
        amount: Nat;
        fee: ?Nat;
        memo: ?[Nat8];
        created_at_time: ?Nat64;
    };
    
    public type TransferResult = {
        #Ok: Nat;
        #Err: TransferError;
    };
    
    public type TransferError = {
        #BadFee: { expected_fee: Nat };
        #BadBurn: { min_burn_amount: Nat };
        #InsufficientFunds: { balance: Nat };
        #InsufficientAllowance: { allowance: Nat };
        #TooOld;
        #CreatedInFuture: { ledger_time: Nat64 };
        #TemporarilyUnavailable;
        #Duplicate: { duplicate_of: Nat };
        #GenericError: { error_code: Nat; message: Text };
    };
    
    public type Allowance = {
        allowance: Nat;
        expires_at: ?Nat64;
    };
    
    public type AllowanceArgs = {
        account: Account;
        spender: Account;
    };
    
    // ICRC-1 Ledger Interface
    public type ICRC1Interface = actor {
        icrc1_transfer: (TransferArgs) -> async (TransferResult);
        icrc1_balance_of: (Account) -> async (Nat);
        icrc1_fee: () -> async (Nat);
        icrc2_transfer_from: (TransferFromArgs) -> async (TransferResult);
        icrc2_allowance: (AllowanceArgs) -> async (Allowance);
    };
    
    public type MarketInfo = {
        id: MarketId;
        subaccount: [Nat8];
        balance: Nat;
        totalDeposited: Nat;
        totalWithdrawn: Nat;
        active: Bool;
    };
    
    // ===== STATE =====
    
    // Market subaccounts storage
    stable var marketAccountsEntries : [(MarketId, [Nat8])] = [];
    private var marketAccounts : TrieMap.TrieMap<MarketId, [Nat8]> = TrieMap.TrieMap<MarketId, [Nat8]>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    
    // Market statistics
    stable var marketStatsEntries : [(MarketId, (Nat, Nat))] = []; // (totalDeposited, totalWithdrawn)
    private var marketStats : TrieMap.TrieMap<MarketId, (Nat, Nat)> = TrieMap.TrieMap<MarketId, (Nat, Nat)>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    
    // Active markets
    stable var activeMarketsEntries : [(MarketId, Bool)] = [];
    private var activeMarkets : TrieMap.TrieMap<MarketId, Bool> = TrieMap.TrieMap<MarketId, Bool>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    
    // Configuration
    private stable var marketsCanister : ?Principal = null;
    private stable var ckbtcLedger : ?Principal = null;
    private stable var ckbtcFee : Nat = 10; // Default ckBTC fee in satoshis
    
    // ===== INITIALIZATION =====
    
    public shared(msg) func initialize(markets: Principal, ledger: Principal) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can initialize");
        };
        
        marketsCanister := ?markets;
        ckbtcLedger := ?ledger;
        
        // Get actual fee from ledger
        try {
            let ledgerActor : ICRC1Interface = actor(Principal.toText(ledger));
            ckbtcFee := await ledgerActor.icrc1_fee();
        } catch (error) {
            Debug.print("Warning: Could not fetch fee from ledger, using default: " # debug_show(ckbtcFee));
        };
        
        #ok()
    };
    
    // ===== SUBACCOUNT MANAGEMENT =====
    
    private func deriveSubaccount(marketId: MarketId) : [Nat8] {
        // Create a 32-byte subaccount from market ID
        // Format: [0, 0, ..., marketId_bytes (big-endian)]
        let buffer = Buffer.Buffer<Nat8>(32);
        
        // Fill with zeros
        for (i in Iter.range(0, 27)) {
            buffer.add(0);
        };
        
        // Add market ID as big-endian 4-byte integer
        let marketIdNat32 = Nat32.fromNat(marketId % (2**32));
        let byte0 = Nat8.fromNat(Nat32.toNat((marketIdNat32 >> 24) & 0xFF));
        let byte1 = Nat8.fromNat(Nat32.toNat((marketIdNat32 >> 16) & 0xFF));
        let byte2 = Nat8.fromNat(Nat32.toNat((marketIdNat32 >> 8) & 0xFF));
        let byte3 = Nat8.fromNat(Nat32.toNat(marketIdNat32 & 0xFF));
        
        buffer.add(byte0);
        buffer.add(byte1);
        buffer.add(byte2);
        buffer.add(byte3);
        
        Buffer.toArray(buffer)
    };
    
    private func getVaultAccount(subaccount: [Nat8]) : Account {
        {
            owner = Principal.fromActor(Vault);
            subaccount = ?subaccount;
        }
    };
    
    // ===== MARKET REGISTRATION =====
    
    public shared(msg) func registerMarket(marketId: MarketId) : async Result.Result<(), Text> {
        // Only Markets canister can register
        switch (marketsCanister) {
            case (null) { return #err("Markets canister not set") };
            case (?markets) {
                if (msg.caller != markets) {
                    return #err("Only Markets canister can register markets");
                }
            };
        };
        
        // Check if already registered
        switch (marketAccounts.get(marketId)) {
            case (?_) { return #err("Market already registered") };
            case (null) {};
        };
        
        // Derive and store subaccount
        let subaccount = deriveSubaccount(marketId);
        marketAccounts.put(marketId, subaccount);
        marketStats.put(marketId, (0, 0));
        activeMarkets.put(marketId, true);
        
        Debug.print("Registered market " # Nat.toText(marketId) # " with subaccount");
        #ok()
    };
    
    // ===== FUND MOVEMENT =====
    
    public shared(msg) func pull_ckbtc(marketId: MarketId, user: Principal, amount: Nat) : async Result.Result<(), Text> {
        // Only Markets canister can call this
        switch (marketsCanister) {
            case (null) { return #err("Markets canister not set") };
            case (?markets) {
                if (msg.caller != markets) {
                    return #err("Only Markets canister can pull ckBTC");
                }
            };
        };
        
        // Check if market is registered and active
        switch (marketAccounts.get(marketId)) {
            case (null) { return #err("Market not registered") };
            case (?subaccount) {
                switch (activeMarkets.get(marketId)) {
                    case (?false) { return #err("Market is not active") };
                    case _ {};
                };
                
                // Validate amount
                if (amount == 0) {
                    return #err("Amount must be greater than zero");
                };
                
                // Check ledger is set
                switch (ckbtcLedger) {
                    case (null) { return #err("ckBTC ledger not set") };
                    case (?ledger) {
                        let ledgerActor : ICRC1Interface = actor(Principal.toText(ledger));
                        
                        // Prepare accounts
                        let userAccount = { owner = user; subaccount = null };
                        let vaultAccount = getVaultAccount(subaccount);
                        
                        // Check user's allowance to vault
                        try {
                            let allowanceArgs = {
                                account = userAccount;
                                spender = { owner = Principal.fromActor(Vault); subaccount = null };
                            };
                            let allowance = await ledgerActor.icrc2_allowance(allowanceArgs);
                            
                            if (allowance.allowance < amount + ckbtcFee) {
                                return #err("Insufficient allowance. Required: " # Nat.toText(amount + ckbtcFee) # ", Available: " # Nat.toText(allowance.allowance));
                            };
                        } catch (error) {
                            return #err("Failed to check allowance");
                        };
                        
                        // Execute transfer_from
                        let transferArgs : TransferFromArgs = {
                            spender_subaccount = null;
                            from = userAccount;
                            to = vaultAccount;
                            amount = amount;
                            fee = ?ckbtcFee;
                            memo = ?Blob.toArray(Text.encodeUtf8("Market deposit: " # Nat.toText(marketId)));
                            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                        };
                        
                        try {
                            switch (await ledgerActor.icrc2_transfer_from(transferArgs)) {
                                case (#Ok(blockIndex)) {
                                    // Update statistics
                                    switch (marketStats.get(marketId)) {
                                        case (?stats) {
                                            let (deposited, withdrawn) = stats;
                                            marketStats.put(marketId, (deposited + amount, withdrawn));
                                        };
                                        case (null) {
                                            marketStats.put(marketId, (amount, 0));
                                        };
                                    };
                                    
                                    Debug.print("Pulled " # Nat.toText(amount) # " ckBTC from " # Principal.toText(user) # " to market " # Nat.toText(marketId) # " (block: " # Nat.toText(blockIndex) # ")");
                                    #ok()
                                };
                                case (#Err(error)) {
                                    let errorMsg = switch (error) {
                                        case (#InsufficientFunds(details)) { "Insufficient funds: " # Nat.toText(details.balance) };
                                        case (#InsufficientAllowance(details)) { "Insufficient allowance: " # Nat.toText(details.allowance) };
                                        case (#BadFee(details)) { "Bad fee. Expected: " # Nat.toText(details.expected_fee) };
                                        case (#TooOld) { "Transaction too old" };
                                        case (#CreatedInFuture(_)) { "Transaction created in future" };
                                        case (#TemporarilyUnavailable) { "Service temporarily unavailable" };
                                        case (#GenericError(details)) { "Error " # Nat.toText(details.error_code) # ": " # details.message };
                                        case _ { "Unknown transfer error" };
                                    };
                                    #err("Transfer failed: " # errorMsg)
                                };
                            }
                        } catch (error) {
                            #err("Failed to execute transfer_from")
                        }
                    };
                }
            };
        }
    };
    
    public shared(msg) func pay_ckbtc(marketId: MarketId, user: Principal, amount: Nat) : async Result.Result<(), Text> {
        // Only Markets canister can call this
        switch (marketsCanister) {
            case (null) { return #err("Markets canister not set") };
            case (?markets) {
                if (msg.caller != markets) {
                    return #err("Only Markets canister can pay ckBTC");
                }
            };
        };
        
        // Check if market is registered
        switch (marketAccounts.get(marketId)) {
            case (null) { return #err("Market not registered") };
            case (?subaccount) {
                // Validate amount
                if (amount == 0) {
                    return #err("Amount must be greater than zero");
                };
                
                // Check ledger is set
                switch (ckbtcLedger) {
                    case (null) { return #err("ckBTC ledger not set") };
                    case (?ledger) {
                        let ledgerActor : ICRC1Interface = actor(Principal.toText(ledger));
                        
                        // Prepare accounts
                        let userAccount = { owner = user; subaccount = null };
                        let vaultAccount = getVaultAccount(subaccount);
                        
                        // Check vault balance
                        try {
                            let balance = await ledgerActor.icrc1_balance_of(vaultAccount);
                            if (balance < amount + ckbtcFee) {
                                return #err("Insufficient vault balance. Required: " # Nat.toText(amount + ckbtcFee) # ", Available: " # Nat.toText(balance));
                            };
                        } catch (error) {
                            return #err("Failed to check vault balance");
                        };
                        
                        // Execute transfer
                        let transferArgs : TransferArgs = {
                            from_subaccount = ?subaccount;
                            to = userAccount;
                            amount = amount;
                            fee = ?ckbtcFee;
                            memo = ?Blob.toArray(Text.encodeUtf8("Market payout: " # Nat.toText(marketId)));
                            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                        };
                        
                        try {
                            switch (await ledgerActor.icrc1_transfer(transferArgs)) {
                                case (#Ok(blockIndex)) {
                                    // Update statistics
                                    switch (marketStats.get(marketId)) {
                                        case (?stats) {
                                            let (deposited, withdrawn) = stats;
                                            marketStats.put(marketId, (deposited, withdrawn + amount));
                                        };
                                        case (null) {
                                            marketStats.put(marketId, (0, amount));
                                        };
                                    };
                                    
                                    Debug.print("Paid " # Nat.toText(amount) # " ckBTC from market " # Nat.toText(marketId) # " to " # Principal.toText(user) # " (block: " # Nat.toText(blockIndex) # ")");
                                    #ok()
                                };
                                case (#Err(error)) {
                                    let errorMsg = switch (error) {
                                        case (#InsufficientFunds(details)) { "Insufficient funds: " # Nat.toText(details.balance) };
                                        case (#BadFee(details)) { "Bad fee. Expected: " # Nat.toText(details.expected_fee) };
                                        case (#TooOld) { "Transaction too old" };
                                        case (#CreatedInFuture(_)) { "Transaction created in future" };
                                        case (#TemporarilyUnavailable) { "Service temporarily unavailable" };
                                        case (#GenericError(details)) { "Error " # Nat.toText(details.error_code) # ": " # details.message };
                                        case _ { "Unknown transfer error" };
                                    };
                                    #err("Transfer failed: " # errorMsg)
                                };
                            }
                        } catch (error) {
                            #err("Failed to execute transfer")
                        }
                    };
                }
            };
        }
    };
    
    // ===== BALANCE QUERIES =====
    
    public query func get_balance(marketId: MarketId) : async Result.Result<Nat, Text> {
        switch (marketAccounts.get(marketId)) {
            case (null) { #err("Market not registered") };
            case (?subaccount) {
                switch (ckbtcLedger) {
                    case (null) { #err("ckBTC ledger not set") };
                    case (?ledger) {
                        // Note: This is a query call, so we can't make async calls to other canisters
                        // Return 0 for now - use get_balance_async for actual balance
                        #ok(0)
                    };
                }
            };
        }
    };
    
    public func get_balance_async(marketId: MarketId) : async Result.Result<Nat, Text> {
        switch (marketAccounts.get(marketId)) {
            case (null) { #err("Market not registered") };
            case (?subaccount) {
                switch (ckbtcLedger) {
                    case (null) { #err("ckBTC ledger not set") };
                    case (?ledger) {
                        try {
                            let ledgerActor : ICRC1Interface = actor(Principal.toText(ledger));
                            let vaultAccount = getVaultAccount(subaccount);
                            let balance = await ledgerActor.icrc1_balance_of(vaultAccount);
                            #ok(balance)
                        } catch (error) {
                            #err("Failed to get balance")
                        }
                    };
                }
            };
        }
    };
    
    // ===== MARKET MANAGEMENT =====
    
    public shared(msg) func deactivateMarket(marketId: MarketId) : async Result.Result<(), Text> {
        // Only Markets canister can deactivate
        switch (marketsCanister) {
            case (null) { return #err("Markets canister not set") };
            case (?markets) {
                if (msg.caller != markets) {
                    return #err("Only Markets canister can deactivate markets");
                }
            };
        };
        
        switch (activeMarkets.get(marketId)) {
            case (null) { return #err("Market not found") };
            case (?_) {
                activeMarkets.put(marketId, false);
                #ok()
            };
        }
    };
    
    // ===== QUERY FUNCTIONS =====
    
    public query func getMarketInfo(marketId: MarketId) : async Result.Result<MarketInfo, Text> {
        switch (marketAccounts.get(marketId)) {
            case (null) { #err("Market not registered") };
            case (?subaccount) {
                let (deposited, withdrawn) = switch (marketStats.get(marketId)) {
                    case (?stats) { stats };
                    case (null) { (0, 0) };
                };
                
                let active = switch (activeMarkets.get(marketId)) {
                    case (?status) { status };
                    case (null) { false };
                };
                
                #ok({
                    id = marketId;
                    subaccount = subaccount;
                    balance = 0; // Would need async call to get real balance
                    totalDeposited = deposited;
                    totalWithdrawn = withdrawn;
                    active = active;
                })
            };
        }
    };
    
    public query func getAllMarkets() : async [MarketInfo] {
        let buffer = Buffer.Buffer<MarketInfo>(marketAccounts.size());
        
        for ((marketId, subaccount) in marketAccounts.entries()) {
            let (deposited, withdrawn) = switch (marketStats.get(marketId)) {
                case (?stats) { stats };
                case (null) { (0, 0) };
            };
            
            let active = switch (activeMarkets.get(marketId)) {
                case (?status) { status };
                case (null) { false };
            };
            
            buffer.add({
                id = marketId;
                subaccount = subaccount;
                balance = 0; // Would need async call to get real balance
                totalDeposited = deposited;
                totalWithdrawn = withdrawn;
                active = active;
            });
        };
        
        Buffer.toArray(buffer)
    };
    
    public query func getConfiguration() : async {
        marketsCanister: ?Principal;
        ckbtcLedger: ?Principal;
        ckbtcFee: Nat;
        totalMarkets: Nat;
    } {
        {
            marketsCanister = marketsCanister;
            ckbtcLedger = ckbtcLedger;
            ckbtcFee = ckbtcFee;
            totalMarkets = marketAccounts.size();
        }
    };
    
    // ===== ADMIN FUNCTIONS =====
    
    public shared(msg) func updateConfiguration(markets: ?Principal, ledger: ?Principal) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can update configuration");
        };
        
        switch (markets) {
            case (?m) { marketsCanister := ?m };
            case (null) {};
        };
        
        switch (ledger) {
            case (?l) { 
                ckbtcLedger := ?l;
                // Update fee
                try {
                    let ledgerActor : ICRC1Interface = actor(Principal.toText(l));
                    ckbtcFee := await ledgerActor.icrc1_fee();
                } catch (error) {
                    Debug.print("Warning: Could not fetch fee from new ledger");
                };
            };
            case (null) {};
        };
        
        #ok()
    };
    
    // ===== SYSTEM FUNCTIONS =====
    
    system func preupgrade() {
        marketAccountsEntries := Iter.toArray(marketAccounts.entries());
        marketStatsEntries := Iter.toArray(marketStats.entries());
        activeMarketsEntries := Iter.toArray(activeMarkets.entries());
    };
    
    system func postupgrade() {
        marketAccounts := TrieMap.fromEntries(marketAccountsEntries.vals(), Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
        marketStats := TrieMap.fromEntries(marketStatsEntries.vals(), Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
        activeMarkets := TrieMap.fromEntries(activeMarketsEntries.vals(), Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
        
        marketAccountsEntries := [];
        marketStatsEntries := [];
        activeMarketsEntries := [];
    };
} 