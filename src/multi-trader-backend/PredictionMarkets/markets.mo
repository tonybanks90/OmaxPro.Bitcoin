import Debug "mo:base/Debug";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";

actor Markets {
    
    // ===== TYPES =====
    
    public type Outcome = { #Yes; #No };
    
    public type MarketState = {
        id: Nat;
        question: Text;
        resolver: Principal;
        expiry: Nat64;
        yesLedger: Principal;
        noLedger: Principal;
        b: Float;                  // LMSR liquidity parameter
        qYes: Float;               // YES inventory
        qNo: Float;                // NO inventory
        resolved: ?Outcome;        // null = unresolved
        active: Bool;
        totalVolume: Nat;          // Total ckBTC volume traded
        createdAt: Nat64;
    };
    
    public type CreateMarketArgs = {
        question: Text;
        resolver: Principal;
        expiry: Nat64;
        yesLedger: Principal;
        noLedger: Principal;
        b: Float;
    };
    
    public type BuyResult = {
        tokensReceived: Float;
        actualCost: Nat;
        newPrice: Float;
    };
    
    public type SellResult = {
        ckBTCReceived: Nat;
        newPrice: Float;
    };
    
    // ICRC-1 Ledger Interface (simplified for our needs)
    public type ICRC1Interface = actor {
        icrc1_transfer : (TransferArgs) -> async (TransferResult);
        icrc1_balance_of : (Account) -> async (Nat);
    };
    
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
    
    public type TransferResult = {
        #Ok: Nat;
        #Err: TransferError;
    };
    
    public type TransferError = {
        #BadFee: { expected_fee: Nat };
        #BadBurn: { min_burn_amount: Nat };
        #InsufficientFunds: { balance: Nat };
        #TooOld;
        #CreatedInFuture: { ledger_time: Nat64 };
        #TemporarilyUnavailable;
        #Duplicate: { duplicate_of: Nat };
        #GenericError: { error_code: Nat; message: Text };
    };
    
    // Vault Interface
    public type VaultInterface = actor {
        pull_ckbtc : (Nat, Principal, Nat) -> async (Result.Result<(), Text>);
        pay_ckbtc : (Nat, Principal, Nat) -> async (Result.Result<(), Text>);
    };
    
    // ===== STATE =====
    
    stable var marketsEntries : [(Nat, MarketState)] = [];
    private var markets : TrieMap.TrieMap<Nat, MarketState> = TrieMap.TrieMap<Nat, MarketState>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    stable var nextMarketId : Nat = 1;
    
    // Configuration
    private stable var tokenFactoryCanister : ?Principal = null;
    private stable var vaultCanister : ?Principal = null;
    
    // ===== INITIALIZATION =====
    
    public shared(msg) func setTokenFactory(canister: Principal) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can set TokenFactory canister");
        };
        tokenFactoryCanister := ?canister;
        #ok()
    };
    
    public shared(msg) func setVaultCanister(canister: Principal) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can set Vault canister");
        };
        vaultCanister := ?canister;
        #ok()
    };
    
    // ===== LMSR MATH =====
    
    private func costFunction(qYes: Float, qNo: Float, b: Float) : Float {
        // LMSR cost function: C(q) = b * ln(e^(qYes/b) + e^(qNo/b))
        let expYes = Float.exp(qYes / b);
        let expNo = Float.exp(qNo / b);
        b * Float.log(expYes + expNo)
    };
    
    private func calculatePrice(qYes: Float, qNo: Float, b: Float, outcome: Outcome) : Float {
        // Price = derivative of cost function = probability
        let expYes = Float.exp(qYes / b);
        let expNo = Float.exp(qNo / b);
        let sum = expYes + expNo;
        
        switch (outcome) {
            case (#Yes) { expYes / sum };
            case (#No) { expNo / sum };
        }
    };
    
    private func calculateTokensForCost(
        qYes: Float, 
        qNo: Float, 
        b: Float, 
        outcome: Outcome, 
        costInCkBTC: Float
    ) : Float {
        // Solve for tokens: cost = C(q + tokens) - C(q)
        let currentCost = costFunction(qYes, qNo, b);
        let targetCost = currentCost + costInCkBTC;
        
        // Binary search to find tokens needed
        var low : Float = 0.0;
        var high : Float = costInCkBTC * 2.0; // Upper bound estimate
        var iterations = 0;
        
        while (iterations < 50 and (high - low) > 0.000001) {
            let mid = (low + high) / 2.0;
            let testCost = switch (outcome) {
                case (#Yes) { costFunction(qYes + mid, qNo, b) };
                case (#No) { costFunction(qYes, qNo + mid, b) };
            };
            
            if (testCost < targetCost) {
                low := mid;
            } else {
                high := mid;
            };
            iterations += 1;
        };
        
        (low + high) / 2.0
    };
    
    private func calculateCostForTokens(
        qYes: Float, 
        qNo: Float, 
        b: Float, 
        outcome: Outcome, 
        tokens: Float
    ) : Float {
        let currentCost = costFunction(qYes, qNo, b);
        let newCost = switch (outcome) {
            case (#Yes) { costFunction(qYes + tokens, qNo, b) };
            case (#No) { costFunction(qYes, qNo + tokens, b) };
        };
        newCost - currentCost
    };
    
    // ===== INTER-CANISTER COMMUNICATION =====
    
    private func pullCkBTC(marketId: Nat, user: Principal, amount: Nat) : async Result.Result<(), Text> {
        switch (vaultCanister) {
            case (null) { #err("Vault canister not set") };
            case (?vault) {
                let vaultActor : VaultInterface = actor(Principal.toText(vault));
                await vaultActor.pull_ckbtc(marketId, user, amount);
            };
        }
    };
    
    private func payCkBTC(marketId: Nat, user: Principal, amount: Nat) : async Result.Result<(), Text> {
        switch (vaultCanister) {
            case (null) { #err("Vault canister not set") };
            case (?vault) {
                let vaultActor : VaultInterface = actor(Principal.toText(vault));
                await vaultActor.pay_ckbtc(marketId, user, amount);
            };
        }
    };
    
    private func mintTokens(ledgerPrincipal: Principal, user: Principal, amount: Nat) : async Result.Result<(), Text> {
        let ledger : ICRC1Interface = actor(Principal.toText(ledgerPrincipal));
        let transferArgs : TransferArgs = {
            from_subaccount = null; // Minting from default subaccount
            to = { owner = user; subaccount = null };
            amount = amount;
            fee = ?0; // Assume no fee for minting
            memo = null;
            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
        };
        
        switch (await ledger.icrc1_transfer(transferArgs)) {
            case (#Ok(_)) { #ok() };
            case (#Err(error)) {
                #err("Failed to mint tokens")
            };
        }
    };
    
    private func burnTokens(ledgerPrincipal: Principal, user: Principal, amount: Nat) : async Result.Result<(), Text> {
        let ledger : ICRC1Interface = actor(Principal.toText(ledgerPrincipal));
        let transferArgs : TransferArgs = {
            from_subaccount = null;
            to = { owner = Principal.fromActor(Markets); subaccount = null }; // Burn to canister
            amount = amount;
            fee = ?0;
            memo = null;
            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
        };
        
        switch (await ledger.icrc1_transfer(transferArgs)) {
            case (#Ok(_)) { #ok() };
            case (#Err(error)) {
                #err("Failed to burn tokens")
            };
        }
    };
    
    private func getTokenBalance(ledgerPrincipal: Principal, user: Principal) : async Result.Result<Nat, Text> {
        let ledger : ICRC1Interface = actor(Principal.toText(ledgerPrincipal));
        let account = { owner = user; subaccount = null };
        
        try {
            let balance = await ledger.icrc1_balance_of(account);
            #ok(balance)
        } catch (error) {
            #err("Failed to get token balance")
        }
    };
    
    // ===== PUBLIC API =====
    
    public shared(msg) func createMarket(args: CreateMarketArgs) : async Result.Result<Nat, Text> {
        // Only TokenFactory can create markets
        switch (tokenFactoryCanister) {
            case (null) { return #err("TokenFactory canister not set") };
            case (?factory) {
                if (msg.caller != factory) {
                    return #err("Only TokenFactory can create markets");
                }
            };
        };
        
        // Validate inputs
        if (Text.size(args.question) == 0) {
            return #err("Question cannot be empty");
        };
        
        if (args.expiry <= Nat64.fromNat(Int.abs(Time.now()))) {
            return #err("Expiry must be in the future");
        };
        
        if (args.b <= 0.0) {
            return #err("Liquidity parameter b must be positive");
        };
        
        let marketId = nextMarketId;
        nextMarketId += 1;
        
        let market : MarketState = {
            id = marketId;
            question = args.question;
            resolver = args.resolver;
            expiry = args.expiry;
            yesLedger = args.yesLedger;
            noLedger = args.noLedger;
            b = args.b;
            qYes = 0.0;
            qNo = 0.0;
            resolved = null;
            active = true;
            totalVolume = 0;
            createdAt = Nat64.fromNat(Int.abs(Time.now()));
        };
        
        markets.put(marketId, market);
        #ok(marketId)
    };
    
    public query func getMarket(marketId: Nat) : async Result.Result<MarketState, Text> {
        switch (markets.get(marketId)) {
            case (null) { #err("Market not found") };
            case (?market) { #ok(market) };
        }
    };
    
    public query func getAllMarkets() : async [MarketState] {
        Iter.toArray(markets.vals())
    };
    
    public query func getMarketPrice(marketId: Nat, outcome: Outcome) : async Result.Result<Float, Text> {
        switch (markets.get(marketId)) {
            case (null) { #err("Market not found") };
            case (?market) {
                let price = calculatePrice(market.qYes, market.qNo, market.b, outcome);
                #ok(price)
            };
        }
    };
    
    public shared(msg) func buy(marketId: Nat, outcome: Outcome, amountCkBTC: Nat) : async Result.Result<BuyResult, Text> {
        // Get market
        switch (markets.get(marketId)) {
            case (null) { return #err("Market not found") };
            case (?market) {
                // Security checks
                if (not market.active) {
                    return #err("Market is not active");
                };
                
                if (market.resolved != null) {
                    return #err("Market is already resolved");
                };
                
                if (Nat64.fromNat(Int.abs(Time.now())) >= market.expiry) {
                    return #err("Market has expired");
                };
                
                if (amountCkBTC == 0) {
                    return #err("Amount must be greater than 0");
                };
                
                // Calculate tokens to receive
                let costInFloat = Float.fromInt(amountCkBTC);
                let tokensToReceive = calculateTokensForCost(
                    market.qYes, 
                    market.qNo, 
                    market.b, 
                    outcome, 
                    costInFloat
                );
                
                if (tokensToReceive <= 0.0) {
                    return #err("Invalid token calculation");
                };
                
                // Pull ckBTC from user
                switch (await pullCkBTC(marketId, msg.caller, amountCkBTC)) {
                    case (#err(error)) { return #err("Failed to pull ckBTC: " # error) };
                    case (#ok()) {};
                };
                
                // Mint tokens to user
                let ledger = switch (outcome) {
                    case (#Yes) { market.yesLedger };
                    case (#No) { market.noLedger };
                };
                
                let tokensToMint = Int.abs(Float.toInt(tokensToReceive));
                switch (await mintTokens(ledger, msg.caller, tokensToMint)) {
                    case (#err(error)) { 
                        // Try to refund ckBTC on mint failure
                        ignore await payCkBTC(marketId, msg.caller, amountCkBTC);
                        return #err("Failed to mint tokens: " # error) 
                    };
                    case (#ok()) {};
                };
                
                // Update market state
                let updatedMarket = switch (outcome) {
                    case (#Yes) {
                        {
                            market with
                            qYes = market.qYes + tokensToReceive;
                            totalVolume = market.totalVolume + amountCkBTC;
                        }
                    };
                    case (#No) {
                        {
                            market with
                            qNo = market.qNo + tokensToReceive;
                            totalVolume = market.totalVolume + amountCkBTC;
                        }
                    };
                };
                
                markets.put(marketId, updatedMarket);
                
                let newPrice = calculatePrice(updatedMarket.qYes, updatedMarket.qNo, updatedMarket.b, outcome);
                
                #ok({
                    tokensReceived = tokensToReceive;
                    actualCost = amountCkBTC;
                    newPrice = newPrice;
                })
            };
        }
    };
    
    public shared(msg) func sell(marketId: Nat, outcome: Outcome, amountTokens: Nat) : async Result.Result<SellResult, Text> {
        // Get market
        switch (markets.get(marketId)) {
            case (null) { return #err("Market not found") };
            case (?market) {
                // Security checks
                if (not market.active) {
                    return #err("Market is not active");
                };
                
                if (market.resolved != null) {
                    return #err("Market is already resolved");
                };
                
                if (Nat64.fromNat(Int.abs(Time.now())) >= market.expiry) {
                    return #err("Market has expired");
                };
                
                if (amountTokens == 0) {
                    return #err("Amount must be greater than 0");
                };
                
                // Check user has enough tokens
                let ledger = switch (outcome) {
                    case (#Yes) { market.yesLedger };
                    case (#No) { market.noLedger };
                };
                
                switch (await getTokenBalance(ledger, msg.caller)) {
                    case (#err(error)) { return #err("Failed to check token balance: " # error) };
                    case (#ok(balance)) {
                        if (balance < amountTokens) {
                            return #err("Insufficient token balance");
                        }
                    };
                };
                
                // Calculate ckBTC to receive (negative tokens sold)
                let tokensInFloat = Float.fromInt(amountTokens);
                let ckBTCToReceive = calculateCostForTokens(
                    market.qYes, 
                    market.qNo, 
                    market.b, 
                    outcome, 
                    -tokensInFloat // Negative for selling
                );
                
                if (ckBTCToReceive <= 0.0) {
                    return #err("Invalid cost calculation");
                };
                
                let ckBTCAmount = Int.abs(Float.toInt(ckBTCToReceive));
                
                // Burn tokens from user
                switch (await burnTokens(ledger, msg.caller, amountTokens)) {
                    case (#err(error)) { return #err("Failed to burn tokens: " # error) };
                    case (#ok()) {};
                };
                
                // Pay ckBTC to user
                switch (await payCkBTC(marketId, msg.caller, ckBTCAmount)) {
                    case (#err(error)) {
                        // Try to re-mint tokens on payment failure
                        ignore await mintTokens(ledger, msg.caller, amountTokens);
                        return #err("Failed to pay ckBTC: " # error)
                    };
                    case (#ok()) {};
                };
                
                // Update market state
                let updatedMarket = switch (outcome) {
                    case (#Yes) {
                        {
                            market with
                            qYes = market.qYes - tokensInFloat;
                            totalVolume = market.totalVolume + ckBTCAmount;
                        }
                    };
                    case (#No) {
                        {
                            market with
                            qNo = market.qNo - tokensInFloat;
                            totalVolume = market.totalVolume + ckBTCAmount;
                        }
                    };
                };
                
                markets.put(marketId, updatedMarket);
                
                let newPrice = calculatePrice(updatedMarket.qYes, updatedMarket.qNo, updatedMarket.b, outcome);
                
                #ok({
                    ckBTCReceived = ckBTCAmount;
                    newPrice = newPrice;
                })
            };
        }
    };
    
    public shared(msg) func resolve(marketId: Nat, outcome: Outcome) : async Result.Result<(), Text> {
        switch (markets.get(marketId)) {
            case (null) { return #err("Market not found") };
            case (?market) {
                // Only resolver can resolve
                if (msg.caller != market.resolver) {
                    return #err("Only the designated resolver can resolve this market");
                };
                
                // Check if already resolved
                if (market.resolved != null) {
                    return #err("Market is already resolved");
                };
                
                // Update market state
                let resolvedMarket = {
                    market with
                    resolved = ?outcome;
                    active = false;
                };
                
                markets.put(marketId, resolvedMarket);
                #ok()
            };
        }
    };
    
    public shared(msg) func redeem(marketId: Nat) : async Result.Result<Nat, Text> {
        switch (markets.get(marketId)) {
            case (null) { return #err("Market not found") };
            case (?market) {
                // Check if market is resolved
                switch (market.resolved) {
                    case (null) { return #err("Market is not yet resolved") };
                    case (?winningOutcome) {
                        // Get winning ledger
                        let winningLedger = switch (winningOutcome) {
                            case (#Yes) { market.yesLedger };
                            case (#No) { market.noLedger };
                        };
                        
                        // Check user's winning token balance
                        switch (await getTokenBalance(winningLedger, msg.caller)) {
                            case (#err(error)) { return #err("Failed to check token balance: " # error) };
                            case (#ok(balance)) {
                                if (balance == 0) {
                                    return #err("No winning tokens to redeem");
                                };
                                
                                // Burn winning tokens
                                switch (await burnTokens(winningLedger, msg.caller, balance)) {
                                    case (#err(error)) { return #err("Failed to burn tokens: " # error) };
                                    case (#ok()) {};
                                };
                                
                                // Pay out ckBTC 1:1
                                switch (await payCkBTC(marketId, msg.caller, balance)) {
                                    case (#err(error)) {
                                        // Try to re-mint tokens on payment failure
                                        ignore await mintTokens(winningLedger, msg.caller, balance);
                                        return #err("Failed to pay ckBTC: " # error)
                                    };
                                    case (#ok()) {};
                                };
                                
                                #ok(balance)
                            };
                        }
                    };
                }
            };
        }
    };
    
    // ===== ADMIN FUNCTIONS =====
    
    public shared(msg) func deactivateMarket(marketId: Nat) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can deactivate markets");
        };
        
        switch (markets.get(marketId)) {
            case (null) { return #err("Market not found") };
            case (?market) {
                let deactivatedMarket = { market with active = false };
                markets.put(marketId, deactivatedMarket);
                #ok()
            };
        }
    };
    
    // ===== SYSTEM FUNCTIONS =====
    
    system func preupgrade() {
        marketsEntries := Iter.toArray(markets.entries());
    };
    
    system func postupgrade() {
        markets := TrieMap.fromEntries(marketsEntries.vals(), Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
        marketsEntries := [];
    };
}