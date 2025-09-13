import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Error "mo:base/Error";
import Nat16 "mo:base/Nat16";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Char "mo:base/Char";
import Int "mo:base/Int";
import Float "mo:base/Float";
import TrieMap "mo:base/TrieMap";

actor TokenFactory {
  // ===== TYPES =====
  
  public type Account = {
    owner : Principal;
    subaccount : ?[Nat8];
  };

  public type Value = {
    #Nat : Nat;
    #Int : Int;
    #Text : Text;
    #Blob : Blob;
  };

  public type MetadataValue = {
    #Nat : Nat;
    #Int : Int;
    #Text : Text;
    #Blob : Blob;
  };

  public type LogoData = {
    #ImageUrl : Text;
    #ImageBlob : Blob;
  };

  public type TokenMetadata = {
    name : Text;
    symbol : Text;
    decimals : Nat8;
    fee : Nat;
    logo : LogoData;
    description : Text;
    created_at : Int;
    total_supply : Nat;
    minting_account : Account;
  };

  public type InitArgs = {
    token_symbol : Text;
    token_name : Text;
    decimals : ?Nat8;
    minting_account : Account;
    transfer_fee : Nat;
    metadata : [(Text, MetadataValue)];
    feature_flags : ?{ icrc2 : Bool };
    initial_balances : [(Account, Nat)];
    archive_options : {
      num_blocks_to_archive : Nat64;
      trigger_threshold : Nat64;
      controller_id : Principal;
      cycles_for_archive_creation : ?Nat64;
    };
  };

  public type LedgerArgs = {
    #Init : InitArgs;
  };

  // Market-specific types
  public type MarketId = Nat;
  
  public type CreateMarketArgs = {
    question : Text;
    expiry : Nat64;
    resolver : Principal;
    b : Float; // LMSR liquidity parameter
  };

  public type MarketTokens = {
    yesLedger : Principal;
    noLedger : Principal;
  };

  // Markets canister interface
  public type MarketsInterface = actor {
    createMarket : (CreateMarketArgs) -> async Result.Result<MarketId, Text>;
  };

  // ===== CONSTANTS =====
  
  private let DEFAULT_DECIMALS : Nat8 = 8;
  private let DEFAULT_FEE : Nat = 10_000;
  private let DEFAULT_SUPPLY : Nat = 1_000_000_000; // 1B tokens for outcomes

  // ===== STATE =====
  
  // Stable storage
  private stable var tokens : List.List<Principal> = List.nil();
  private stable var createdCanisters : List.List<Principal> = List.nil();
  private stable var wasm_module : ?Blob = null;
  private stable var tokenMetadataEntries : [(Principal, TokenMetadata)] = [];
  private stable var marketTokensEntries : [(MarketId, MarketTokens)] = [];
  private stable var nextMarketId : MarketId = 1;
  private stable var marketsCanister : ?Principal = null;
  
  // Runtime storage
  private var tokenMetadata = HashMap.HashMap<Principal, TokenMetadata>(0, Principal.equal, Principal.hash);
  private var marketTokens = TrieMap.TrieMap<MarketId, MarketTokens>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });

  // Management canister interface
  private let mgmt = actor "aaaaa-aa" : actor {
    create_canister : shared { settings : ?{ controllers : [Principal] } } -> async { canister_id : Principal };
    install_code : shared {
      canister_id : Principal;
      wasm_module : Blob;
      arg : Blob;
      mode : { #install; #reinstall; #upgrade };
    } -> async ();
  };

  // ===== INITIALIZATION =====

  system func preupgrade() {
    tokenMetadataEntries := Iter.toArray(tokenMetadata.entries());
    marketTokensEntries := Iter.toArray(marketTokens.entries());
  };

  system func postupgrade() {
    tokenMetadata := HashMap.fromIter<Principal, TokenMetadata>(
      tokenMetadataEntries.vals(), 
      tokenMetadataEntries.size(), 
      Principal.equal, 
      Principal.hash
    );
    tokenMetadataEntries := [];
    
    marketTokens := TrieMap.fromEntries(
      marketTokensEntries.vals(), 
      Nat.equal, 
      func(n: Nat) : Nat32 { Nat32.fromNat(n) }
    );
    marketTokensEntries := [];
  };

  // ===== ADMIN FUNCTIONS =====

  public shared({ caller }) func setMarketsCanister(canister : Principal) : async Result.Result<(), Text> {
    // Only controller can set markets canister
    if (not Principal.isController(caller)) {
      return #err("Only controller can set markets canister");
    };
    marketsCanister := ?canister;
    #ok()
  };

  public shared func uploadWasm(wasm_blob : Blob) : async Result.Result<Text, Text> {
    Debug.print("WASM blob received. Saving to stable memory...");
    wasm_module := ?wasm_blob;
    Debug.print("WASM blob saved successfully in stable memory.");
    #ok("WASM module uploaded and saved successfully in stable memory.")
  };

  public query func getMarketsCanister() : async ?Principal {
    marketsCanister
  };

  // ===== HELPER FUNCTIONS =====

  private func createOutcomeMetadata(
    marketId : MarketId,
    outcome : Text,
    question : Text
  ) : [(Text, MetadataValue)] {
    [
      ("icrc1:description", #Text("Outcome token for market #" # Nat.toText(marketId) # ": " # question)),
      ("custom:market_id", #Nat(marketId)),
      ("custom:outcome_type", #Text(outcome)),
      ("custom:token_type", #Text("prediction_market")),
    ]
  };

  private func deployOutcomeLedger(
    marketId : MarketId,
    outcome : Text,
    question : Text,
    minter : Principal
  ) : async Result.Result<Principal, Text> {
    try {
      if (wasm_module == null) {
        return #err("WASM module not available. Please upload it first using uploadWasm().");
      };

      Debug.print("Creating " # outcome # " token canister for market #" # Nat.toText(marketId));
      
      let createResult = await (with cycles = 1_500_000_000_000) mgmt.create_canister<system>({
        settings = null
      });
      let newCanister = createResult.canister_id;
      Debug.print("New " # outcome # " token canister created: " # Principal.toText(newCanister));

      createdCanisters := List.push(newCanister, createdCanisters);

      switch (wasm_module) {
        case (?icrc1_wasm) {
          let metadata = createOutcomeMetadata(marketId, outcome, question);
          
          let minterAccount : Account = { owner = minter; subaccount = null };
          
          let totalSupplyWithDecimals = DEFAULT_SUPPLY * (10 ** Nat8.toNat(DEFAULT_DECIMALS));
          
          let initArgs : InitArgs = {
            token_symbol = outcome # Nat.toText(marketId);
            token_name = outcome # " Token - Market #" # Nat.toText(marketId);
            decimals = ?DEFAULT_DECIMALS;
            minting_account = minterAccount; // Markets canister as minter
            transfer_fee = DEFAULT_FEE;
            metadata = metadata;
            feature_flags = ?{ icrc2 = true };
            initial_balances = []; // No initial balances, minter will mint as needed
            archive_options = {
              num_blocks_to_archive = Nat64.fromNat(1000);
              trigger_threshold = Nat64.fromNat(2000);
              controller_id = Principal.fromActor(TokenFactory);
              cycles_for_archive_creation = ?Nat64.fromNat(10_000_000_000_000);
            };
          };

          let ledgerArgs : LedgerArgs = #Init(initArgs);
          let encodedArgs = to_candid(ledgerArgs);

          Debug.print("Installing the ICRC-2 ledger code for " # outcome # " token...");
          
          await mgmt.install_code<system>({
            canister_id = newCanister;
            wasm_module = icrc1_wasm;
            arg = encodedArgs;
            mode = #install;
          });

          // Store token metadata
          let tokenMeta : TokenMetadata = {
            name = outcome # " Token - Market #" # Nat.toText(marketId);
            symbol = outcome # Nat.toText(marketId);
            decimals = DEFAULT_DECIMALS;
            fee = DEFAULT_FEE;
            logo = #ImageUrl("");
            description = "Outcome token for prediction market";
            created_at = Time.now();
            total_supply = DEFAULT_SUPPLY;
            minting_account = minterAccount;
          };
          
          tokenMetadata.put(newCanister, tokenMeta);
          tokens := List.push(newCanister, tokens);
          
          Debug.print(outcome # " token canister successfully created for market #" # Nat.toText(marketId));
          #ok(newCanister)
        };
        case null {
          #err("WASM module not available in stable memory.")
        };
      }
    } catch(e) {
      let errorMessage = "Failed to create " # outcome # " token: " # Error.message(e);
      Debug.print(errorMessage);
      #err(errorMessage)
    }
  };

  // ===== PUBLIC API =====

  public shared({ caller }) func createMarket(args : CreateMarketArgs) : async Result.Result<MarketId, Text> {
    // Check if markets canister is set
    switch (marketsCanister) {
      case (null) { return #err("Markets canister not set. Call setMarketsCanister first.") };
      case (?markets) {
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

        // Deploy YES ledger with Markets canister as minter
        let yesResult = await deployOutcomeLedger(marketId, "YES", args.question, markets);
        let yesLedger = switch (yesResult) {
          case (#ok(ledger)) ledger;
          case (#err(error)) return #err("Failed to deploy YES ledger: " # error);
        };

        // Deploy NO ledger with Markets canister as minter
        let noResult = await deployOutcomeLedger(marketId, "NO", args.question, markets);
        let noLedger = switch (noResult) {
          case (#ok(ledger)) ledger;
          case (#err(error)) return #err("Failed to deploy NO ledger: " # error);
        };

        // Store market tokens mapping
        let tokens : MarketTokens = {
          yesLedger = yesLedger;
          noLedger = noLedger;
        };
        marketTokens.put(marketId, tokens);

        // Call Markets canister to create the market
        let marketsActor : MarketsInterface = actor(Principal.toText(markets));
        let createMarketArgs = {
          question = args.question;
          resolver = args.resolver;
          expiry = args.expiry;
          yesLedger = yesLedger;
          noLedger = noLedger;
          b = args.b;
        };

        switch (await marketsActor.createMarket(createMarketArgs)) {
          case (#ok(registeredMarketId)) {
            // Verify the market ID matches
            if (registeredMarketId != marketId) {
              Debug.print("Warning: Market ID mismatch. Expected: " # Nat.toText(marketId) # ", Got: " # Nat.toText(registeredMarketId));
            };
            
            nextMarketId += 1;
            
            Debug.print("Market #" # Nat.toText(marketId) # " successfully created with ledgers:");
            Debug.print("YES: " # Principal.toText(yesLedger));
            Debug.print("NO: " # Principal.toText(noLedger));
            
            #ok(marketId)
          };
          case (#err(error)) {
            #err("Failed to register market with Markets canister: " # error)
          };
        }
      };
    }
  };

  // ===== QUERY FUNCTIONS =====

  public query func getMarketLedgers(marketId : MarketId) : async ?MarketTokens {
    marketTokens.get(marketId)
  };

  public query func getAllMarkets() : async [(MarketId, MarketTokens)] {
    Iter.toArray(marketTokens.entries())
  };

  public query func getCreatedTokens() : async [Principal] {
    List.toArray(tokens)
  };

  public query func getTokenMetadata(tokenId : Principal) : async ?TokenMetadata {
    tokenMetadata.get(tokenId)
  };

  public query func getAllTokenMetadata() : async [(Principal, TokenMetadata)] {
    Iter.toArray(tokenMetadata.entries())
  };

  // Legacy functions for backward compatibility
  public shared({ caller }) func createTokenWithChain(
    name : Text,
    symbol : Text,
    logo : LogoData,
    description : Text,
    website : ?Text,
    telegram : ?Text,
    twitter : ?Text,
    chainType : { #Bitcoin; #Ethereum }
  ) : async Result.Result<Principal, Text> {
    #err("This function is deprecated. Use createMarket instead for prediction market tokens.")
  };
}