import Text "mo:base/Text";
import Float "mo:base/Float";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import List "mo:base/List";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Hash "mo:base/Hash";


persistent actor Sniper {

    // --- Types ---

    type TradeType = {
        #buy;
        #sell;
    };

    type TradeAmount = {
        #btc : Nat;
        #token : Nat;
    };

    type TradeSettings = {
        slippage : ?(Nat, Nat); // (expectedPrice, allowedSlippageBasisPoints)
    };

    type TradeRequest = {
        tokenid : Text;
        typeof : TradeType;
        amount : TradeAmount;
        settings : ?TradeSettings;
    };

    type TradeResponse = {
        #ok : ();
        #err : Text;
    };

    type DepositResult = {
        newBalance : Nat;
    };

    type OdinActor = actor {
        token_trade : (TradeRequest) -> async TradeResponse;
        token_deposit : (Text, Nat) -> async DepositResult;
    };

    type SnipeStatus = {
        #active;
        #completed;
        #failed : Text;
        #cancelled;
    };

    type SnipeConfig = {
        id : Nat;
        owner : Principal;
        tokenId : Text;
        targetMarketCapUSD : Float; // Trigger price/MC
        amountBTC : Nat; // Amount to buy with
        status : SnipeStatus;
        createdAt : Int;
    };

    // --- State ---

    // Helper for Nat hashing
    func natHash(n : Nat) : Nat32 {
        var x = n;
        Hash.hash(x)
    };

    transient var _nextId : Nat = 1;
    // Map: SnipeID -> SnipeConfig
    transient let _snipes = HashMap.HashMap<Nat, SnipeConfig>(0, Nat.equal, natHash);
    
    // Map: Principal -> Balance (BTC Satoshis)
    transient let _balances = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);
    
    // Constants (as functions to avoid state issues)
    func getOdinActor() : OdinActor {
        actor "z2vm5-gaaaa-aaaaj-azw6q-cai"
    };
    
    transient let CHECK_INTERVAL_NS : Nat = 30_000_000_000; // 30 seconds (Nat literal is usually fine, checking if error persists)

    // Rate Limiting / Timer State
    transient var _timerId : ?Timer.TimerId = null;

    // --- Public Functions ---

    // 1. Deposit Funds (Mock/Simplified for MVP - ideally uses icrc2_transfer_from)
    // For now, we assume user transferred to canister and calls this to notify, 
    // OR we just track it virtually if we are in a test env. 
    // REAL WORLD: This would accept a notification of transfer.
    public shared ({ caller }) func deposit(amount : Nat) : async Nat {
        let currentBalance = Option.get(_balances.get(caller), 0);
        let newBalance = currentBalance + amount;
        _balances.put(caller, newBalance);
        return newBalance;
    };

    public query ({ caller }) func getBalance() : async Nat {
        return Option.get(_balances.get(caller), 0);
    };

    public shared ({ caller }) func withdraw(amount : Nat) : async Result.Result<Nat, Text> {
        let currentBalance = Option.get(_balances.get(caller), 0);
        if (currentBalance < amount) {
            return #err("Insufficient balance");
        };
        _balances.put(caller, currentBalance - amount);
        // TODO: Implement actual Ledger transfer back to user
        return #ok(currentBalance - amount);
    };

    // 2. Manage Snipes

    public shared ({ caller }) func addSnipe(tokenId : Text, targetMC : Float, amountBTC : Nat) : async Nat {
        let id = _nextId;
        _nextId += 1;

        let newSnipe : SnipeConfig = {
            id = id;
            owner = caller;
            tokenId = tokenId;
            targetMarketCapUSD = targetMC;
            amountBTC = amountBTC;
            status = #active;
            createdAt = Time.now();
        };

        _snipes.put(id, newSnipe);
        
        // Ensure timer is running
        switch (_timerId) {
            case null {
                let t = Timer.setTimer(#nanoseconds(CHECK_INTERVAL_NS), handleTimer);
                _timerId := ?t;
            };
            case (?_) { }; // Already running
        };

        return id;
    };

    public shared ({ caller }) func cancelSnipe(id : Nat) : async Result.Result<(), Text> {
        switch (_snipes.get(id)) {
            case null { return #err("Snipe not found"); };
            case (?snipe) {
                if (snipe.owner != caller) {
                    return #err("Unauthorized");
                };
                let updatedSnipe = { snipe with status = #cancelled };
                _snipes.put(id, updatedSnipe);
                return #ok(());
            };
        };
    };

    public query ({ caller }) func getUserSnipes() : async [SnipeConfig] {
        var userSnipes : [SnipeConfig] = [];
        for ((id, snipe) in _snipes.entries()) {
            if (snipe.owner == caller) {
                userSnipes := Array.append(userSnipes, [snipe]);
            };
        };
        return userSnipes;
    };

    // --- Internal Logic ---

    func handleTimer() : async () {
        // Reset timer for next loop
        // We can ignore the return value here or store it
        let t = Timer.setTimer(#nanoseconds(CHECK_INTERVAL_NS), handleTimer);
        _timerId := ?t;
        
        // 1. Filter active snipes
        // Note: For large scale, we need better indexing. For MVP, iteration is fine.
        // We accumulate active snipes to process
        
        // TODO: Group by TokenID to minimize HTTPS calls (1 call per token)
    };

     // Note: HTTP Outcalls require cycles and are async.
     // For this iteration, we will stub the HTTP check logic.
     
     // The core logic for `checkAndExecute`:
     // 1. Get List of active snipes.
     // 2. For each unique TokenID:
     //    a. HTTPS GET `https://api.odin.fun/v1/token/{id}`
     //    b. Parse MarketCap.
     // 3. For each snipe matching TokenID:
     //    a. If MarketCap <= targetMarketCapUSD (for buy? usually snipe is "buy entry")
     //       OR if MarketCap >= target (if breakout snipe? Assume "Buy if MC reaches X" or "Buy if MC enters range")
     //       Let's assume "Target MC" means "Buy when MC is BELOW or AT this value" (Dip snipe) 
     //       OR "Buy when MC reaches this value" (Breakout).
     //       User request: "snipe at sertain marketcaps". Usually implies "Catch it early" or "Catch the dip".
     //       Let's assume "Buy when Current MC <= Target MC".
     //    b. If condition met:
     //       i. Check User Balance.
     //       ii. If sufficient:
     //           - Deduct Balance.
     //           - Call Odin.token_deposit (BTC).
     //           - Call Odin.token_trade (Buy).
     //           - Update Snipe Status (#completed or #failed).
     
};
