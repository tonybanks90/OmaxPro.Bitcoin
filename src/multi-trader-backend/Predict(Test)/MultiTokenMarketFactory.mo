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
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import TrieMap "mo:base/TrieMap";

actor MarketFactory {
  // ===== TYPES =====
  
  public type TokenId = Nat;
  
  public type Account = {
    owner : Principal;
    subaccount : ?[Nat8];
  };

  public type MetadataValue = {
    #Nat : Nat;
    #Int : Int;
    #Text : Text;
    #Blob : Blob;
  };

  public type TokenMetadata = {
    name : Text;
    symbol : Text;
    decimals : Nat8;
  };

  // Multi-token ledger initialization arguments
  public type MultiTokenLedgerInitArgs = {
    owner : Principal;
    market_id : Nat;
    question : Text;
  };

  // Market types
  public type MarketId = Nat;
  
  public type CreateMarketArgs = {
    question : Text;
  };

  public type MarketTokens = {
    yesTokenId : TokenId;  // TokenId 0
    noTokenId : TokenId;   // TokenId 1
  };

  public type MarketInfo = {
    id : MarketId;
    question : Text;
    created_at : Int;
    ledger_canister : Principal;
    yes_token_id : TokenId;
    no_token_id : TokenId;
  };

  // ===== CONSTANTS =====
  
  private let YES_TOKEN_ID : TokenId = 0;
  private let NO_TOKEN_ID : TokenId = 1;
  private let DEFAULT_DECIMALS : Nat8 = 8;
  private let DEFAULT_SUPPLY : Nat = 1_000_000_000; // 1B tokens for each outcome

  // ===== STATE =====
  
  // Stable storage
  private stable var createdLedgers : List.List<Principal> = List.nil();
  private stable var multi_token_wasm : ?Blob = null;
  private stable var marketInfoEntries : [(MarketId, MarketInfo)] = [];
  private stable var nextMarketId : MarketId = 1;
  
  // Runtime storage
  private var marketInfo = TrieMap.TrieMap<MarketId, MarketInfo>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });

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
    marketInfoEntries := Iter.toArray(marketInfo.entries());
  };

  system func postupgrade() {
    marketInfo := TrieMap.fromEntries(
      marketInfoEntries.vals(), 
      Nat.equal, 
      func(n: Nat) : Nat32 { Nat32.fromNat(n) }
    );
    marketInfoEntries := [];
  };

  // ===== ADMIN FUNCTIONS =====

  public shared func uploadMultiTokenWasm(wasm_blob : Blob) : async Result.Result<Text, Text> {
    Debug.print("Multi-token ledger WASM blob received. Saving to stable memory...");
    multi_token_wasm := ?wasm_blob;
    Debug.print("Multi-token ledger WASM blob saved successfully in stable memory.");
    #ok("Multi-token ledger WASM module uploaded and saved successfully.")
  };

  public query func hasMultiTokenWasm() : async Bool {
    switch (multi_token_wasm) {
      case (null) false;
      case (?_) true;
    }
  };

  // ===== HELPER FUNCTIONS =====

  private func deployMarketLedger(
    marketId : MarketId,
    question : Text
  ) : async Result.Result<Principal, Text> {
    try {
      if (multi_token_wasm == null) {
        return #err("Multi-token ledger WASM module not available. Please upload it first using uploadMultiTokenWasm().");
      };

      Debug.print("Creating multi-token ledger for market #" # Nat.toText(marketId));
      
      // Create canister with MarketFactory as controller
      let createResult = await mgmt.create_canister({
        settings = ?{
          controllers = [Principal.fromActor(MarketFactory)];
        }
      });
      let newLedger = createResult.canister_id;
      Debug.print("New multi-token ledger created: " # Principal.toText(newLedger));

      createdLedgers := List.push(newLedger, createdLedgers);

      switch (multi_token_wasm) {
        case (?ledger_wasm) {
          // Initialize multi-token ledger with market info
          let initArgs : MultiTokenLedgerInitArgs = {
            owner = Principal.fromActor(MarketFactory); // Factory owns the ledger
            market_id = marketId;
            question = question;
          };

          let encodedArgs = to_candid(initArgs);

          Debug.print("Installing multi-token ledger code for market #" # Nat.toText(marketId));
          
          await mgmt.install_code({
            canister_id = newLedger;
            wasm_module = ledger_wasm;
            arg = encodedArgs;
            mode = #install;
          });
          
          Debug.print("Multi-token ledger successfully created for market #" # Nat.toText(marketId));
          #ok(newLedger)
        };
        case null {
          #err("Multi-token ledger WASM module not available in stable memory.")
        };
      }
    } catch(e) {
      let errorMessage = "Failed to create multi-token ledger: " # Error.message(e);
      Debug.print(errorMessage);
      #err(errorMessage)
    }
  };

  // ===== PUBLIC API =====

  public shared func createMarket(args : CreateMarketArgs) : async Result.Result<MarketId, Text> {
    // Validate inputs
    if (Text.size(args.question) == 0) {
      return #err("Question cannot be empty");
    };

    let marketId = nextMarketId;

    // Deploy multi-token ledger for this market
    let ledgerResult = await deployMarketLedger(marketId, args.question);
    let ledgerCanister = switch (ledgerResult) {
      case (#ok(ledger)) ledger;
      case (#err(error)) return #err("Failed to deploy market ledger: " # error);
    };

    // Store market info
    let info : MarketInfo = {
      id = marketId;
      question = args.question;
      created_at = Time.now();
      ledger_canister = ledgerCanister;
      yes_token_id = YES_TOKEN_ID;
      no_token_id = NO_TOKEN_ID;
    };
    marketInfo.put(marketId, info);

    nextMarketId += 1;
    
    Debug.print("Market #" # Nat.toText(marketId) # " successfully created:");
    Debug.print("Question: " # args.question);
    Debug.print("Ledger: " # Principal.toText(ledgerCanister));
    Debug.print("YES Token ID: " # Nat.toText(YES_TOKEN_ID));
    Debug.print("NO Token ID: " # Nat.toText(NO_TOKEN_ID));
    
    #ok(marketId)
  };

  // ===== QUERY FUNCTIONS =====

  public query func getMarketInfo(marketId : MarketId) : async ?MarketInfo {
    marketInfo.get(marketId)
  };

  public query func getAllMarkets() : async [MarketInfo] {
    Iter.toArray(marketInfo.vals())
  };

  public query func getMarketCount() : async Nat {
    nextMarketId - 1
  };

  public query func getCreatedLedgers() : async [Principal] {
    List.toArray(createdLedgers)
  };

  // Get market tokens for easy access
  public query func getMarketTokens(marketId : MarketId) : async ?MarketTokens {
    switch (marketInfo.get(marketId)) {
      case null { null };
      case (?info) {
        ?{
          yesTokenId = info.yes_token_id;
          noTokenId = info.no_token_id;
        }
      };
    }
  };

  // Debug function to check factory's principal
  public query func getFactoryPrincipal() : async Principal {
    Principal.fromActor(MarketFactory)
  };

  // Helper function to interact with market ledger
  public shared func getMarketLedgerActor(marketId : MarketId) : async ?Principal {
    switch (marketInfo.get(marketId)) {
      case null { null };
      case (?info) { ?info.ledger_canister };
    }
  };
}