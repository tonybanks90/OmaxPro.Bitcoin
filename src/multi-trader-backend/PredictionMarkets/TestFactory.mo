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
import Char "mo:base/Char";
import TrieMap "mo:base/TrieMap";

actor TokenFactory {
  // ===== TYPES =====
  
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

  // Market types
  public type MarketId = Nat;
  
  public type MarketType = {
    #Binary;
    #MultipleChoice : { outcomes : [Text] };
    #Compound : { subjects : [Text] }; // Each subject has Yes/No
  };

  // Unified market creation args
  public type CreateBinaryMarketArgs = {
    question : Text;
  };

  public type CreateMultipleChoiceMarketArgs = {
    question : Text;
    outcomes : [Text]; // e.g., ["Candidate A", "Candidate B", "Candidate C"]
  };

  public type CreateCompoundMarketArgs = {
    question : Text;
    subjects : [Text]; // e.g., ["Team A", "Team B", "Team C"] - each gets Yes/No
  };

  // Token mapping for different market types
  public type BinaryTokens = {
    yesLedger : Principal;
    noLedger : Principal;
  };

  public type MultipleChoiceTokens = {
    outcomeLedgers : [(Text, Principal)]; // outcome name -> ledger principal
  };

  public type CompoundTokens = {
    subjectTokens : [(Text, BinaryTokens)]; // subject -> (yes/no ledgers)
  };

  public type MarketTokens = {
    #Binary : BinaryTokens;
    #MultipleChoice : MultipleChoiceTokens;
    #Compound : CompoundTokens;
  };

  public type MarketInfo = {
    id : MarketId;
    question : Text;
    created_at : Int;
    marketType : MarketType;
    tokens : MarketTokens;
  };

  // ===== CONSTANTS =====
  
  private let DEFAULT_DECIMALS : Nat8 = 8;
  private let DEFAULT_FEE : Nat = 10_000;
  private let DEFAULT_SUPPLY : Nat = 1_000_000_000; // 1B tokens for outcomes
  private let MAX_OUTCOMES : Nat = 20; // Limit for multiple choice
  private let MAX_SUBJECTS : Nat = 10; // Limit for compound markets

  // ===== STATE =====
  
  // Stable storage
  private stable var tokens : List.List<Principal> = List.nil();
  private stable var createdCanisters : List.List<Principal> = List.nil();
  private stable var wasm_module : ?Blob = null;
  private stable var tokenMetadataEntries : [(Principal, TokenMetadata)] = [];
  private stable var marketInfoEntries : [(MarketId, MarketInfo)] = [];
  private stable var nextMarketId : MarketId = 1;
  
  // Runtime storage
  private var tokenMetadata = HashMap.HashMap<Principal, TokenMetadata>(0, Principal.equal, Principal.hash);
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

  // ===== UTILITY FUNCTIONS =====

  // Custom uppercase conversion function
  private func charToUpper(c : Char) : Char {
    let code = Char.toNat32(c);
    if (code >= 97 and code <= 122) { // 'a' to 'z'
      Char.fromNat32(code - 32) // Convert to uppercase
    } else {
      c // Return as-is if not lowercase
    }
  };

  // Convert string to uppercase with underscore replacement
  private func textToUpperSymbol(text : Text) : Text {
    Text.map(text, func(c: Char) : Char { 
      if (c == ' ') '_' else charToUpper(c)
    })
  };

  // ===== INITIALIZATION =====

  system func preupgrade() {
    tokenMetadataEntries := Iter.toArray(tokenMetadata.entries());
    marketInfoEntries := Iter.toArray(marketInfo.entries());
  };

  system func postupgrade() {
    tokenMetadata := HashMap.fromIter<Principal, TokenMetadata>(
      tokenMetadataEntries.vals(), 
      tokenMetadataEntries.size(), 
      Principal.equal, 
      Principal.hash
    );
    tokenMetadataEntries := [];
    
    marketInfo := TrieMap.fromEntries(
      marketInfoEntries.vals(), 
      Nat.equal, 
      func(n: Nat) : Nat32 { Nat32.fromNat(n) }
    );
    marketInfoEntries := [];
  };

  // ===== ADMIN FUNCTIONS =====

  public shared func uploadWasm(wasm_blob : Blob) : async Result.Result<Text, Text> {
    Debug.print("WASM blob received. Saving to stable memory...");
    wasm_module := ?wasm_blob;
    Debug.print("WASM blob saved successfully in stable memory.");
    #ok("WASM module uploaded and saved successfully in stable memory.")
  };

  public query func hasWasm() : async Bool {
    switch (wasm_module) {
      case (null) false;
      case (?_) true;
    }
  };

  // ===== HELPER FUNCTIONS =====

  private func validateOutcomeName(outcome : Text) : Bool {
    Text.size(outcome) > 0 and Text.size(outcome) <= 50
  };

  private func createTokenMetadata(
    marketId : MarketId,
    tokenName : Text,
    tokenSymbol : Text,
    question : Text,
    description : Text
  ) : [(Text, MetadataValue)] {
    [
      ("icrc1:description", #Text(description)),
      ("custom:market_id", #Nat(marketId)),
      ("custom:token_name", #Text(tokenName)),
      ("custom:market_question", #Text(question)),
      ("custom:token_type", #Text("prediction_market")),
    ]
  };

  private func deployTokenLedger(
    marketId : MarketId,
    tokenName : Text,
    tokenSymbol : Text,
    question : Text,
    description : Text
  ) : async Result.Result<Principal, Text> {
    try {
      if (wasm_module == null) {
        return #err("WASM module not available. Please upload it first using uploadWasm().");
      };

      Debug.print("Creating " # tokenName # " token canister for market #" # Nat.toText(marketId));
      
      let createResult = await mgmt.create_canister({
        settings = null
      });
      let newCanister = createResult.canister_id;
      Debug.print("New " # tokenName # " token canister created: " # Principal.toText(newCanister));

      createdCanisters := List.push(newCanister, createdCanisters);

      switch (wasm_module) {
        case (?icrc1_wasm) {
          let metadata = createTokenMetadata(marketId, tokenName, tokenSymbol, question, description);
          
          // TokenFactory is the minter
          let minterAccount : Account = { 
            owner = Principal.fromActor(TokenFactory); 
            subaccount = null 
          };
          
          let initArgs : InitArgs = {
            token_symbol = tokenSymbol;
            token_name = tokenName;
            decimals = ?DEFAULT_DECIMALS;
            minting_account = minterAccount;
            transfer_fee = DEFAULT_FEE;
            metadata = metadata;
            feature_flags = ?{ icrc2 = true };
            initial_balances = [];
            archive_options = {
              num_blocks_to_archive = Nat64.fromNat(1000);
              trigger_threshold = Nat64.fromNat(2000);
              controller_id = Principal.fromActor(TokenFactory);
              cycles_for_archive_creation = ?Nat64.fromNat(10_000_000_000_000);
            };
          };

          let ledgerArgs : LedgerArgs = #Init(initArgs);
          let encodedArgs = to_candid(ledgerArgs);

          Debug.print("Installing the ICRC-2 ledger code for " # tokenName # " token...");
          
          await mgmt.install_code({
            canister_id = newCanister;
            wasm_module = icrc1_wasm;
            arg = encodedArgs;
            mode = #install;
          });

          // Store token metadata
          let tokenMeta : TokenMetadata = {
            name = tokenName;
            symbol = tokenSymbol;
            decimals = DEFAULT_DECIMALS;
            fee = DEFAULT_FEE;
            logo = #ImageUrl("");
            description = description;
            created_at = Time.now();
            total_supply = DEFAULT_SUPPLY;
            minting_account = minterAccount;
          };
          
          tokenMetadata.put(newCanister, tokenMeta);
          tokens := List.push(newCanister, tokens);
          
          Debug.print(tokenName # " token canister successfully created for market #" # Nat.toText(marketId));
          #ok(newCanister)
        };
        case null {
          #err("WASM module not available in stable memory.")
        };
      }
    } catch(e) {
      let errorMessage = "Failed to create " # tokenName # " token: " # Error.message(e);
      Debug.print(errorMessage);
      #err(errorMessage)
    }
  };

  // ===== PUBLIC API - MARKET CREATION =====

  public shared func createBinaryMarket(args : CreateBinaryMarketArgs) : async Result.Result<MarketId, Text> {
    if (Text.size(args.question) == 0) {
      return #err("Question cannot be empty");
    };

    let marketId = nextMarketId;

    // Deploy YES ledger
    let yesResult = await deployTokenLedger(
      marketId,
      "YES" # Nat.toText(marketId),
      "YES" # Nat.toText(marketId),
      args.question,
      "YES token for: " # args.question
    );
    let yesLedger = switch (yesResult) {
      case (#ok(ledger)) ledger;
      case (#err(error)) return #err("Failed to deploy YES ledger: " # error);
    };

    // Deploy NO ledger
    let noResult = await deployTokenLedger(
      marketId,
      "NO" # Nat.toText(marketId),
      "NO" # Nat.toText(marketId),
      args.question,
      "NO token for: " # args.question
    );
    let noLedger = switch (noResult) {
      case (#ok(ledger)) ledger;
      case (#err(error)) return #err("Failed to deploy NO ledger: " # error);
    };

    // Store market info
    let info : MarketInfo = {
      id = marketId;
      question = args.question;
      created_at = Time.now();
      marketType = #Binary;
      tokens = #Binary({
        yesLedger = yesLedger;
        noLedger = noLedger;
      });
    };
    marketInfo.put(marketId, info);

    nextMarketId += 1;
    
    Debug.print("Binary Market #" # Nat.toText(marketId) # " created:");
    Debug.print("Question: " # args.question);
    Debug.print("YES: " # Principal.toText(yesLedger));
    Debug.print("NO: " # Principal.toText(noLedger));
    
    #ok(marketId)
  };

  public shared func createMultipleChoiceMarket(args : CreateMultipleChoiceMarketArgs) : async Result.Result<MarketId, Text> {
    // Validate inputs
    if (Text.size(args.question) == 0) {
      return #err("Question cannot be empty");
    };

    if (args.outcomes.size() < 2) {
      return #err("Multiple choice markets need at least 2 outcomes");
    };

    if (args.outcomes.size() > MAX_OUTCOMES) {
      return #err("Too many outcomes. Maximum is " # Nat.toText(MAX_OUTCOMES));
    };

    // Validate outcome names
    for (outcome in args.outcomes.vals()) {
      if (not validateOutcomeName(outcome)) {
        return #err("Invalid outcome name: " # outcome);
      };
    };

    let marketId = nextMarketId;
    var outcomeLedgers : [(Text, Principal)] = [];

    // Deploy ledger for each outcome
    for (outcome in args.outcomes.vals()) {
      let tokenResult = await deployTokenLedger(
        marketId,
        outcome # " - Market #" # Nat.toText(marketId),
        textToUpperSymbol(outcome) # Nat.toText(marketId),
        args.question,
        outcome # " token for: " # args.question
      );

      switch (tokenResult) {
        case (#ok(ledger)) {
          outcomeLedgers := Array.append(outcomeLedgers, [(outcome, ledger)]);
        };
        case (#err(error)) {
          return #err("Failed to deploy " # outcome # " ledger: " # error);
        };
      };
    };

    // Store market info
    let info : MarketInfo = {
      id = marketId;
      question = args.question;
      created_at = Time.now();
      marketType = #MultipleChoice({ outcomes = args.outcomes });
      tokens = #MultipleChoice({
        outcomeLedgers = outcomeLedgers;
      });
    };
    marketInfo.put(marketId, info);

    nextMarketId += 1;
    
    Debug.print("Multiple Choice Market #" # Nat.toText(marketId) # " created:");
    Debug.print("Question: " # args.question);
    for ((outcome, ledger) in outcomeLedgers.vals()) {
      Debug.print(outcome # ": " # Principal.toText(ledger));
    };
    
    #ok(marketId)
  };

  public shared func createCompoundMarket(args : CreateCompoundMarketArgs) : async Result.Result<MarketId, Text> {
    // Validate inputs
    if (Text.size(args.question) == 0) {
      return #err("Question cannot be empty");
    };

    if (args.subjects.size() < 2) {
      return #err("Compound markets need at least 2 subjects");
    };

    if (args.subjects.size() > MAX_SUBJECTS) {
      return #err("Too many subjects. Maximum is " # Nat.toText(MAX_SUBJECTS));
    };

    // Validate subject names
    for (subject in args.subjects.vals()) {
      if (not validateOutcomeName(subject)) {
        return #err("Invalid subject name: " # subject);
      };
    };

    let marketId = nextMarketId;
    var subjectTokens : [(Text, BinaryTokens)] = [];

    // Deploy YES/NO ledgers for each subject
    for (subject in args.subjects.vals()) {
      // Deploy YES ledger for this subject
      let yesResult = await deployTokenLedger(
        marketId,
        subject # " YES - Market #" # Nat.toText(marketId),
        textToUpperSymbol(subject) # "_YES" # Nat.toText(marketId),
        args.question,
        "YES token for " # subject # " in: " # args.question
      );

      let yesLedger = switch (yesResult) {
        case (#ok(ledger)) ledger;
        case (#err(error)) return #err("Failed to deploy YES ledger for " # subject # ": " # error);
      };

      // Deploy NO ledger for this subject
      let noResult = await deployTokenLedger(
        marketId,
        subject # " NO - Market #" # Nat.toText(marketId),
        textToUpperSymbol(subject) # "_NO" # Nat.toText(marketId),
        args.question,
        "NO token for " # subject # " in: " # args.question
      );

      let noLedger = switch (noResult) {
        case (#ok(ledger)) ledger;
        case (#err(error)) return #err("Failed to deploy NO ledger for " # subject # ": " # error);
      };

      let binaryTokens : BinaryTokens = {
        yesLedger = yesLedger;
        noLedger = noLedger;
      };

      subjectTokens := Array.append(subjectTokens, [(subject, binaryTokens)]);
    };

    // Store market info
    let info : MarketInfo = {
      id = marketId;
      question = args.question;
      created_at = Time.now();
      marketType = #Compound({ subjects = args.subjects });
      tokens = #Compound({
        subjectTokens = subjectTokens;
      });
    };
    marketInfo.put(marketId, info);

    nextMarketId += 1;
    
    Debug.print("Compound Market #" # Nat.toText(marketId) # " created:");
    Debug.print("Question: " # args.question);
    for ((subject, tokens) in subjectTokens.vals()) {
      Debug.print(subject # " YES: " # Principal.toText(tokens.yesLedger));
      Debug.print(subject # " NO: " # Principal.toText(tokens.noLedger));
    };
    
    #ok(marketId)
  };

  // Legacy function for backward compatibility
  public shared func createMarket(args : CreateBinaryMarketArgs) : async Result.Result<MarketId, Text> {
    await createBinaryMarket(args)
  };

  // ===== QUERY FUNCTIONS =====

  public query func getMarketInfo(marketId : MarketId) : async ?MarketInfo {
    marketInfo.get(marketId)
  };

  public query func getAllMarkets() : async [MarketInfo] {
    Iter.toArray(marketInfo.vals())
  };

  public query func getMarketsByType(marketType : MarketType) : async [MarketInfo] {
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        switch (market.marketType, marketType) {
          case (#Binary, #Binary) true;
          case (#MultipleChoice(_), #MultipleChoice(_)) true;
          case (#Compound(_), #Compound(_)) true;
          case _ false;
        }
      }
    );
    filtered
  };

  public query func getMarketCount() : async Nat {
    nextMarketId - 1
  };

  public query func getMarketCountByType() : async { binary : Nat; multipleChoice : Nat; compound : Nat } {
    var binary = 0;
    var multipleChoice = 0;
    var compound = 0;

    for (market in marketInfo.vals()) {
      switch (market.marketType) {
        case (#Binary) binary += 1;
        case (#MultipleChoice(_)) multipleChoice += 1;
        case (#Compound(_)) compound += 1;
      };
    };

    { binary = binary; multipleChoice = multipleChoice; compound = compound }
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

  public query func getCreatedCanisters() : async [Principal] {
    List.toArray(createdCanisters)
  };

  public query func getFactoryPrincipal() : async Principal {
    Principal.fromActor(TokenFactory)
  };

  // Helper query to get all tokens for a specific market
  public query func getMarketTokens(marketId : MarketId) : async ?[Principal] {
    switch (marketInfo.get(marketId)) {
      case (null) null;
      case (?info) {
        switch (info.tokens) {
          case (#Binary(tokens)) {
            ?[tokens.yesLedger, tokens.noLedger]
          };
          case (#MultipleChoice(tokens)) {
            ?Array.map<(Text, Principal), Principal>(tokens.outcomeLedgers, func((_, ledger)) = ledger)
          };
          case (#Compound(tokens)) {
            var allTokens : [Principal] = [];
            for ((_, binaryTokens) in tokens.subjectTokens.vals()) {
              allTokens := Array.append(allTokens, [binaryTokens.yesLedger, binaryTokens.noLedger]);
            };
            ?allTokens
          };
        }
      };
    }
  };
}