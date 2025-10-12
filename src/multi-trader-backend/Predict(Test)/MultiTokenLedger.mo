import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Option "mo:base/Option";

actor class MultiTokenLedger(initArgs : {
  owner : Principal;
  market_id : Nat;
  question : Text;
}) = this {

  // ===== TYPES =====
  
  public type TokenId = Nat;
  
  public type Account = {
    owner : Principal;
    subaccount : ?[Nat8];
  };

  public type Metadata = {
    name : Text;
    symbol : Text;
    decimals : Nat8;
  };

  public type Token = {
    var metadata : Metadata;
    var totalSupply : Nat;
    balances : HashMap.HashMap<Principal, Nat>;
    allowances : HashMap.HashMap<(Principal, Principal), Nat>;
    var creator : Principal;
    var created_at : Int;
  };

  public type TransferArgs = {
    from_subaccount : ?[Nat8];
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?[Nat8];
    created_at_time : ?Nat64;
  };

  public type TransferResult = {
    #Ok : Nat; // Transaction index
    #Err : TransferError;
  };

  public type TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #TemporarilyUnavailable;
    #Duplicate : { duplicate_of : Nat };
    #GenericError : { error_code : Nat; message : Text };
  };

  public type ApproveArgs = {
    from_subaccount : ?[Nat8];
    spender : Account;
    amount : Nat;
    expected_allowance : ?Nat;
    expires_at : ?Nat64;
    fee : ?Nat;
    memo : ?[Nat8];
    created_at_time : ?Nat64;
  };

  public type ApproveResult = {
    #Ok : Nat;
    #Err : ApproveError;
  };

  public type ApproveError = {
    #BadFee : { expected_fee : Nat };
    #InsufficientFunds : { balance : Nat };
    #AllowanceChanged : { current_allowance : Nat };
    #Expired : { ledger_time : Nat64 };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  // ===== CONSTANTS =====
  
  private let YES_TOKEN_ID : TokenId = 0;
  private let NO_TOKEN_ID : TokenId = 1;
  private let DEFAULT_DECIMALS : Nat8 = 8;
  private let DEFAULT_FEE : Nat = 10_000;
  private let DEFAULT_SUPPLY : Nat = 1_000_000_000; // 1B tokens for each outcome

  // ===== STATE =====
  
  private let owner = initArgs.owner;
  private let marketId = initArgs.market_id;
  private let question = initArgs.question;
  
  // Stable storage for tokens
  private stable var tokenEntries : [(TokenId, (Metadata, Nat, [(Principal, Nat)], [((Principal, Principal), Nat)], Principal, Int))] = [];
  private stable var nextTxId : Nat = 0;
  
  // Runtime storage
  private var tokens = HashMap.HashMap<TokenId, Token>(2, Nat.equal, Nat32.fromNat);

  // Helper functions for allowance hash/equality
  private func allowanceEqual(a : (Principal, Principal), b : (Principal, Principal)) : Bool {
    Principal.equal(a.0, b.0) and Principal.equal(a.1, b.1)
  };

  private func allowanceHash(a : (Principal, Principal)) : Nat32 {
    Principal.hash(a.0) ^ Principal.hash(a.1)
  };

  // ===== INITIALIZATION =====

  private func initializeTokens() {
    // Initialize YES token
    let yesToken : Token = {
      var metadata = {
        name = "YES - Market #" # Nat.toText(marketId);
        symbol = "YES" # Nat.toText(marketId);
        decimals = DEFAULT_DECIMALS;
      };
      var totalSupply = DEFAULT_SUPPLY;
      balances = HashMap.HashMap<Principal, Nat>(16, Principal.equal, Principal.hash);
      allowances = HashMap.HashMap<(Principal, Principal), Nat>(16, allowanceEqual, allowanceHash);
      var creator = owner;
      var created_at = Time.now();
    };
    
    // Initialize NO token
    let noToken : Token = {
      var metadata = {
        name = "NO - Market #" # Nat.toText(marketId);
        symbol = "NO" # Nat.toText(marketId);
        decimals = DEFAULT_DECIMALS;
      };
      var totalSupply = DEFAULT_SUPPLY;
      balances = HashMap.HashMap<Principal, Nat>(16, Principal.equal, Principal.hash);
      allowances = HashMap.HashMap<(Principal, Principal), Nat>(16, allowanceEqual, allowanceHash);
      var creator = owner;
      var created_at = Time.now();
    };

    // Set initial balances to the owner (MarketFactory)
    yesToken.balances.put(owner, DEFAULT_SUPPLY);
    noToken.balances.put(owner, DEFAULT_SUPPLY);

    tokens.put(YES_TOKEN_ID, yesToken);
    tokens.put(NO_TOKEN_ID, noToken);
  };

  // Initialize tokens on first deployment
  initializeTokens();

  system func preupgrade() {
    var entries : [(TokenId, (Metadata, Nat, [(Principal, Nat)], [((Principal, Principal), Nat)], Principal, Int))] = [];
    
    for ((tokenId, token) in tokens.entries()) {
      let balanceEntries = Iter.toArray(token.balances.entries());
      let allowanceEntries = Iter.toArray(token.allowances.entries());
      
      entries := Array.append(entries, [(tokenId, (
        token.metadata,
        token.totalSupply,
        balanceEntries,
        allowanceEntries,
        token.creator,
        token.created_at
      ))]);
    };
    
    tokenEntries := entries;
  };

  system func postupgrade() {
    for ((tokenId, (metadata, totalSupply, balanceEntries, allowanceEntries, creator, created_at)) in tokenEntries.vals()) {
      let token : Token = {
        var metadata = metadata;
        var totalSupply = totalSupply;
        balances = HashMap.fromIter<Principal, Nat>(balanceEntries.vals(), balanceEntries.size(), Principal.equal, Principal.hash);
        allowances = HashMap.fromIter<(Principal, Principal), Nat>(allowanceEntries.vals(), allowanceEntries.size(), allowanceEqual, allowanceHash);
        var creator = creator;
        var created_at = created_at;
      };
      
      tokens.put(tokenId, token);
    };
    
    tokenEntries := [];
  };

  // ===== HELPER FUNCTIONS =====

  private func getBalance(tokenId : TokenId, account : Principal) : Nat {
    switch (tokens.get(tokenId)) {
      case null { 0 };
      case (?token) {
        switch (token.balances.get(account)) {
          case null { 0 };
          case (?balance) { balance };
        }
      };
    }
  };

  private func getAllowance(tokenId : TokenId, owner : Principal, spender : Principal) : Nat {
    switch (tokens.get(tokenId)) {
      case null { 0 };
      case (?token) {
        switch (token.allowances.get((owner, spender))) {
          case null { 0 };
          case (?allowance) { allowance };
        }
      };
    }
  };

  // ===== ICRC-1 IMPLEMENTATION =====

  public query func icrc1_name(tokenId : TokenId) : async ?Text {
    switch (tokens.get(tokenId)) {
      case null { null };
      case (?token) { ?token.metadata.name };
    }
  };

  public query func icrc1_symbol(tokenId : TokenId) : async ?Text {
    switch (tokens.get(tokenId)) {
      case null { null };
      case (?token) { ?token.metadata.symbol };
    }
  };

  public query func icrc1_decimals(tokenId : TokenId) : async ?Nat8 {
    switch (tokens.get(tokenId)) {
      case null { null };
      case (?token) { ?token.metadata.decimals };
    }
  };

  public query func icrc1_total_supply(tokenId : TokenId) : async Nat {
    switch (tokens.get(tokenId)) {
      case null { 0 };
      case (?token) { token.totalSupply };
    }
  };

  public query func icrc1_balance_of(tokenId : TokenId, account : Account) : async Nat {
    getBalance(tokenId, account.owner)
  };

  public query func icrc1_fee(tokenId : TokenId) : async Nat {
    DEFAULT_FEE
  };

  public shared(msg) func icrc1_transfer(tokenId : TokenId, args : TransferArgs) : async TransferResult {
    let from = msg.caller;
    let to = args.to.owner;
    let amount = args.amount;
    let fee = Option.get(args.fee, DEFAULT_FEE);

    // Validate token exists
    switch (tokens.get(tokenId)) {
      case null { 
        return #Err(#GenericError({ error_code = 1; message = "Token not found" }));
      };
      case (?token) {
        let fromBalance = getBalance(tokenId, from);
        let totalAmount = amount + fee;

        // Check sufficient balance
        if (fromBalance < totalAmount) {
          return #Err(#InsufficientFunds({ balance = fromBalance }));
        };

        // Execute transfer
        token.balances.put(from, fromBalance - totalAmount);
        
        let toBalance = getBalance(tokenId, to);
        token.balances.put(to, toBalance + amount);

        // Fee goes to owner (could be burned or collected)
        if (fee > 0) {
          let ownerBalance = getBalance(tokenId, owner);
          token.balances.put(owner, ownerBalance + fee);
        };

        let txId = nextTxId;
        nextTxId += 1;
        
        Debug.print("Transfer completed - Token: " # Nat.toText(tokenId) # 
                   ", From: " # Principal.toText(from) # 
                   ", To: " # Principal.toText(to) # 
                   ", Amount: " # Nat.toText(amount));
        
        #Ok(txId)
      };
    }
  };

  // ===== ICRC-2 IMPLEMENTATION (Allowances) =====

  public shared(msg) func icrc2_approve(tokenId : TokenId, args : ApproveArgs) : async ApproveResult {
    let owner = msg.caller;
    let spender = args.spender.owner;
    let amount = args.amount;
    
    switch (tokens.get(tokenId)) {
      case null {
        return #Err(#GenericError({ error_code = 1; message = "Token not found" }));
      };
      case (?token) {
        token.allowances.put((owner, spender), amount);
        
        let txId = nextTxId;
        nextTxId += 1;
        
        Debug.print("Approval set - Token: " # Nat.toText(tokenId) # 
                   ", Owner: " # Principal.toText(owner) # 
                   ", Spender: " # Principal.toText(spender) # 
                   ", Amount: " # Nat.toText(amount));
        
        #Ok(txId)
      };
    }
  };

  public query func icrc2_allowance(tokenId : TokenId, owner : Principal, spender : Principal) : async Nat {
    getAllowance(tokenId, owner, spender)
  };

  public shared(msg) func icrc2_transfer_from(
    tokenId : TokenId,
    from : Principal,
    to : Principal,
    amount : Nat,
    fee : ?Nat
  ) : async TransferResult {
    let spender = msg.caller;
    let actualFee = Option.get(fee, DEFAULT_FEE);
    
    switch (tokens.get(tokenId)) {
      case null {
        return #Err(#GenericError({ error_code = 1; message = "Token not found" }));
      };
      case (?token) {
        let allowance = getAllowance(tokenId, from, spender);
        let totalAmount = amount + actualFee;
        
        // Check allowance
        if (allowance < totalAmount) {
          return #Err(#GenericError({ error_code = 2; message = "Insufficient allowance" }));
        };
        
        let fromBalance = getBalance(tokenId, from);
        
        // Check balance
        if (fromBalance < totalAmount) {
          return #Err(#InsufficientFunds({ balance = fromBalance }));
        };
        
        // Execute transfer
        token.balances.put(from, fromBalance - totalAmount);
        
        let toBalance = getBalance(tokenId, to);
        token.balances.put(to, toBalance + amount);
        
        // Fee to owner
        if (actualFee > 0) {
          let ownerBalance = getBalance(tokenId, owner);
          token.balances.put(owner, ownerBalance + actualFee);
        };
        
        // Update allowance
        token.allowances.put((from, spender), allowance - totalAmount);
        
        let txId = nextTxId;
        nextTxId += 1;
        
        Debug.print("Transfer from completed - Token: " # Nat.toText(tokenId) # 
                   ", From: " # Principal.toText(from) # 
                   ", To: " # Principal.toText(to) # 
                   ", Amount: " # Nat.toText(amount));
        
        #Ok(txId)
      };
    }
  };

  // ===== MULTI-TOKEN SPECIFIC FUNCTIONS =====

  public query func supported_tokens() : async [TokenId] {
    [YES_TOKEN_ID, NO_TOKEN_ID]
  };

  public query func get_market_info() : async {
    market_id : Nat;
    question : Text;
    owner : Principal;
    yes_token_id : TokenId;
    no_token_id : TokenId;
  } {
    {
      market_id = marketId;
      question = question;
      owner = owner;
      yes_token_id = YES_TOKEN_ID;
      no_token_id = NO_TOKEN_ID;
    }
  };

  public query func get_token_metadata(tokenId : TokenId) : async ?Metadata {
    switch (tokens.get(tokenId)) {
      case null { null };
      case (?token) { ?token.metadata };
    }
  };

  public query func get_all_token_metadata() : async [(TokenId, Metadata)] {
    var result : [(TokenId, Metadata)] = [];
    for ((tokenId, token) in tokens.entries()) {
      result := Array.append(result, [(tokenId, token.metadata)]);
    };
    result
  };

  // ===== OWNER FUNCTIONS =====

  public shared(msg) func mint(tokenId : TokenId, to : Principal, amount : Nat) : async Result.Result<Nat, Text> {
    if (msg.caller != owner) {
      return #err("Only owner can mint tokens");
    };

    switch (tokens.get(tokenId)) {
      case null {
        #err("Token not found")
      };
      case (?token) {
        let toBalance = getBalance(tokenId, to);
        token.balances.put(to, toBalance + amount);
        token.totalSupply += amount;
        
        let txId = nextTxId;
        nextTxId += 1;
        
        Debug.print("Minted " # Nat.toText(amount) # " tokens of ID " # Nat.toText(tokenId) # " to " # Principal.toText(to));
        
        #ok(txId)
      };
    }
  };

  public shared(msg) func burn(tokenId : TokenId, from : Principal, amount : Nat) : async Result.Result<Nat, Text> {
    if (msg.caller != owner) {
      return #err("Only owner can burn tokens");
    };

    switch (tokens.get(tokenId)) {
      case null {
        #err("Token not found")
      };
      case (?token) {
        let fromBalance = getBalance(tokenId, from);
        if (fromBalance < amount) {
          return #err("Insufficient balance to burn");
        };
        
        token.balances.put(from, fromBalance - amount);
        token.totalSupply -= amount;
        
        let txId = nextTxId;
        nextTxId += 1;
        
        Debug.print("Burned " # Nat.toText(amount) # " tokens of ID " # Nat.toText(tokenId) # " from " # Principal.toText(from));
        
        #ok(txId)
      };
    }
  };

  // ===== STANDARD COMPLIANCE =====

  public query func icrc1_supported_standards() : async [{ name : Text; url : Text }] {
    [
      { name = "ICRC-1"; url = "https://github.com/dfinity/ICRC-1" },
      { name = "ICRC-2"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2" }
    ]
  };
}