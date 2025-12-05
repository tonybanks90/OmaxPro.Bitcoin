import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Error "mo:base/Error";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Char "mo:base/Char";
import TrieMap "mo:base/TrieMap";
import Cycles "mo:base/ExperimentalCycles";
import Float "mo:base/Float";

persistent actor TokenFactory {
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

  // Enhanced market types with metadata support
  public type MarketId = Nat;
  
  public type Category = {
    #Runes;
    #Stocks;
    #Political;
    #Sports;
    #Entertainment;
    #Technology;
    #Crypto;
    #AI;
  };

  public type Tag = {
    #web2;
    #AI;
    #Sports;
    #Crypto;
    #Political;
    #Technology;
    #Entertainment;
    #Runes;
  };

  public type ImageData = {
    #ImageUrl : Text;
    #ImageBlob : Blob;
  };

  public type MarketMetadata = {
    title : Text;
    description : Text;
    category : Category;
    creator : Principal;
    image : ImageData;
    tags : [Tag];
    bettingCloseTime : Int;
    expirationTime : Int;
    resolutionLink : Text;
    resolutionDescription : Text;
    created_at : Int;
  };
  
  public type MarketType = {
    #Binary;
    #MultipleChoice : { outcomes : [Text] };
    #Compound : { subjects : [Text] };
  };

  // Enhanced market creation args with full metadata
  public type CreateBinaryMarketArgs = {
    title : Text;
    description : Text;
    category : Category;
    image : ImageData;
    tags : [Tag];
    bettingCloseTime : Int;
    expirationTime : Int;
    resolutionLink : Text;
    resolutionDescription : Text;
    resolver : Principal;
    liquidityParameter : Float;
    totalSupply : Nat64;
  };

  public type CreateMultipleChoiceMarketArgs = {
    title : Text;
    description : Text;
    category : Category;
    image : ImageData;
    tags : [Tag];
    outcomes : [Text];
    bettingCloseTime : Int;
    expirationTime : Int;
    resolutionLink : Text;
    resolutionDescription : Text;
    resolver : Principal;
    liquidityParameter : Float;
    totalSupply : Nat64;
  };

  public type CreateCompoundMarketArgs = {
    title : Text;
    description : Text;
    category : Category;
    image : ImageData;
    tags : [Tag];
    subjects : [Text];
    bettingCloseTime : Int;
    expirationTime : Int;
    resolutionLink : Text;
    resolutionDescription : Text;
    resolver : Principal;
    liquidityParameter : Float;
    totalSupply : Nat64;
  };

  // Token mapping for different market types
  public type BinaryTokens = {
    yesLedger : Principal;
    noLedger : Principal;
  };

  public type MultipleChoiceTokens = {
    outcomeLedgers : [(Text, Principal)];
  };

  public type CompoundTokens = {
    subjectTokens : [(Text, BinaryTokens)];
  };

  public type MarketTokens = {
    #Binary : BinaryTokens;
    #MultipleChoice : MultipleChoiceTokens;
    #Compound : CompoundTokens;
  };

  public type MarketInfo = {
    id : MarketId;
    metadata : MarketMetadata;
    marketType : MarketType;
    tokens : MarketTokens;
    registeredInMarkets : Bool;
  };

  // Markets canister interface types
  public type BinaryRegistrationArgs = {
    base : BaseRegistrationArgs;
    yesLedger : Principal;
    noLedger : Principal;
  };

  public type MultipleChoiceRegistrationArgs = {
    base : BaseRegistrationArgs;
    outcomes : [(Text, Principal)];
  };

  public type CompoundRegistrationArgs = {
    base : BaseRegistrationArgs;
    subjects : [(Text, (Principal, Principal))];
  };

  public type BaseRegistrationArgs = {
    question : Text;
    resolver : Principal;
    expiry : Nat64;
    b : Float;
    totalSupply : Nat64;
  };

  public type VaultAddressConfig = {
    #Binary : {
      marketVault : Principal;
    };
    #MultipleChoice : {
      marketVault : Principal;
    };
    #Compound : {
      subjectVaults : [(Text, Principal)];
    };
  };

  public type MarketRegistrationResult = {
    marketId : Nat;
    vaultConfig : VaultAddressConfig;
    setupComplete : Bool;
  };

  // Markets canister interface
  public type MarketsInterface = actor {
    registerBinaryMarketWithVault : (BinaryRegistrationArgs) -> async (Result.Result<MarketRegistrationResult, Text>);
    registerMultipleChoiceMarketWithVault : (MultipleChoiceRegistrationArgs) -> async (Result.Result<MarketRegistrationResult, Text>);
    registerCompoundMarketWithVault : (CompoundRegistrationArgs) -> async (Result.Result<MarketRegistrationResult, Text>);
  };

  // ===== CONSTANTS =====
  
  private let DEFAULT_DECIMALS : Nat8 = 8;
  private let DEFAULT_FEE : Nat = 10_000;
  private let DEFAULT_SUPPLY : Nat = 1_000_000_000;
  private let MAX_OUTCOMES : Nat = 20;
  private let MAX_SUBJECTS : Nat = 10;
  private let MAX_TITLE_LENGTH : Nat = 200;
  private let MIN_TITLE_LENGTH : Nat = 1;
  private let MAX_DESCRIPTION_LENGTH : Nat = 1000;
  private let MIN_DESCRIPTION_LENGTH : Nat = 1;
  private let MAX_TAGS : Nat = 5;
  
  // Cycle constants
  private let CANISTER_CREATION_FEE : Nat = 500_000_000_000;
  private let CYCLES_PER_TOKEN : Nat = 850_000_000_000;

  // ===== STATE =====
  
  private stable var tokens : List.List<Principal> = List.nil();
  private stable var createdCanisters : List.List<Principal> = List.nil();
  private stable var wasm_module : ?Blob = null;
  private stable var tokenMetadataEntries : [(Principal, TokenMetadata)] = [];
  private stable var marketInfoEntries : [(MarketId, MarketInfo)] = [];
  private stable var nextMarketId : MarketId = 1;
  
  // NEW: Markets canister reference
  private stable var marketsCanister : ?Principal = null;
  
  private transient var tokenMetadata = HashMap.HashMap<Principal, TokenMetadata>(0, Principal.equal, Principal.hash);
  private transient var marketInfo = TrieMap.TrieMap<MarketId, MarketInfo>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });

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

  // ===== VALIDATION FUNCTIONS =====

  private func validateTitle(title : Text) : Bool {
    let length = Text.size(title);
    length >= MIN_TITLE_LENGTH and length <= MAX_TITLE_LENGTH
  };

  private func validateDescription(description : Text) : Bool {
    let length = Text.size(description);
    length >= MIN_DESCRIPTION_LENGTH and length <= MAX_DESCRIPTION_LENGTH
  };

  private func validateTags(tags : [Tag]) : Bool {
    tags.size() <= MAX_TAGS
  };

  private func validateTimes(bettingCloseTime : Int, expirationTime : Int) : Bool {
    let currentTime = Time.now();
    bettingCloseTime > currentTime and expirationTime > bettingCloseTime
  };

  private func validateOutcomeName(outcome : Text) : Bool {
    Text.size(outcome) > 0 and Text.size(outcome) <= 50
  };

  private func validateMarketArgs(
    title : Text, 
    description : Text, 
    tags : [Tag], 
    bettingCloseTime : Int, 
    expirationTime : Int
  ) : Result.Result<(), Text> {
    if (not validateTitle(title)) {
      return #err("Title must be between " # Nat.toText(MIN_TITLE_LENGTH) # " and " # Nat.toText(MAX_TITLE_LENGTH) # " characters");
    };
    if (not validateDescription(description)) {
      return #err("Description must be between " # Nat.toText(MIN_DESCRIPTION_LENGTH) # " and " # Nat.toText(MAX_DESCRIPTION_LENGTH) # " characters");
    };
    if (not validateTags(tags)) {
      return #err("Maximum " # Nat.toText(MAX_TAGS) # " tags allowed");
    };
    if (not validateTimes(bettingCloseTime, expirationTime)) {
      return #err("Betting close time must be in the future and expiration time must be after betting close time");
    };
    #ok()
  };

  // Helper function to convert text to uppercase symbol
  private func toUpperSymbol(text : Text) : Text {
    Text.map(text, func(c: Char) : Char { 
      if (c == ' ') '_' 
      else if (c >= 'a' and c <= 'z') Char.fromNat32(Char.toNat32(c) - 32)
      else c 
    })
  };

  // ===== ADMIN FUNCTIONS =====

  public shared({ caller }) func setMarketsCanister(canister : Principal) : async Result.Result<(), Text> {
    if (not Principal.isController(caller)) {
      return #err("Only controller can set Markets canister");
    };
    marketsCanister := ?canister;
    Debug.print("Markets canister set to: " # Principal.toText(canister));
    #ok()
  };

  public query func getMarketsCanister() : async ?Principal {
    marketsCanister
  };

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


  public shared({ caller }) func clearWasm() : async Result.Result<Text, Text> {
  if (not Principal.isController(caller)) {
    return #err("Only controller can clear WASM");
  };
  wasm_module := null;
  Debug.print("WASM module cleared from stable memory.");
  #ok("WASM module cleared successfully.")
};

  // ===== CYCLE MANAGEMENT =====

  public query func getCycleBalance() : async Nat {
    Cycles.balance()
  };

  public shared func acceptCycles() : async Nat {
    let amount = Cycles.accept(Cycles.available());
    Debug.print("Accepted " # Nat.toText(amount) # " cycles");
    amount
  };

  public query func canCreateMarket(tokenCount : Nat) : async { canCreate : Bool; currentBalance : Nat; requiredCycles : Nat } {
    let currentBalance = Cycles.balance();
    let requiredCycles = tokenCount * CYCLES_PER_TOKEN;
    {
      canCreate = currentBalance >= requiredCycles;
      currentBalance = currentBalance;
      requiredCycles = requiredCycles;
    }
  };

  // ===== HELPER FUNCTIONS =====

  private func createTokenMetadata(
    marketId : MarketId,
    tokenName : Text,
    tokenSymbol : Text,
    title : Text,
    description : Text
  ) : [(Text, MetadataValue)] {
    [
      ("icrc1:description", #Text(description)),
      ("custom:market_id", #Nat(marketId)),
      ("custom:token_name", #Text(tokenName)),
      ("custom:market_title", #Text(title)),
      ("custom:token_type", #Text("prediction_market")),
    ]
  };

  // NEW: Deploy token with Markets canister as minter
  private func deployTokenLedger(
    marketId : MarketId,
    tokenName : Text,
    tokenSymbol : Text,
    title : Text,
    description : Text
  ) : async Result.Result<Principal, Text> {
    try {
      if (wasm_module == null) {
        return #err("WASM module not available. Please upload it first using uploadWasm().");
      };

      // Check Markets canister is set
      let marketsPrincipal = switch (marketsCanister) {
        case (null) { return #err("Markets canister not set. Please set it using setMarketsCanister()") };
        case (?p) { p };
      };

      if (Cycles.balance() < CYCLES_PER_TOKEN) {
        return #err("Insufficient cycles. Need " # Nat.toText(CYCLES_PER_TOKEN) # " cycles but only have " # Nat.toText(Cycles.balance()));
      };

      Debug.print("Creating " # tokenName # " token canister for market #" # Nat.toText(marketId));
      
      Cycles.add(CYCLES_PER_TOKEN);
      let createResult = await mgmt.create_canister({
        settings = ?{
          controllers = [Principal.fromActor(TokenFactory)];
        }
      });
      let newCanister = createResult.canister_id;
      Debug.print("New " # tokenName # " token canister created: " # Principal.toText(newCanister));

      createdCanisters := List.push(newCanister, createdCanisters);

      switch (wasm_module) {
        case (?icrc1_wasm) {
          let metadata = createTokenMetadata(marketId, tokenName, tokenSymbol, title, description);
          
          // CHANGED: Set Markets canister as minter instead of TokenFactory
          let minterAccount : Account = { 
            owner = marketsPrincipal; 
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
          Debug.print("Minter set to Markets canister: " # Principal.toText(marketsPrincipal));
          
          await mgmt.install_code({
            canister_id = newCanister;
            wasm_module = icrc1_wasm;
            arg = encodedArgs;
            mode = #install;
          });

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

  public shared({ caller }) func createBinaryMarket(args : CreateBinaryMarketArgs) : async Result.Result<MarketId, Text> {
    // Validate input
    switch (validateMarketArgs(args.title, args.description, args.tags, args.bettingCloseTime, args.expirationTime)) {
      case (#err(msg)) return #err(msg);
      case (#ok()) {};
    };

    // Check Markets canister is set
    let marketsPrincipal = switch (marketsCanister) {
      case (null) { return #err("Markets canister not set") };
      case (?p) { p };
    };

    // Check cycles
    let cycleCheck = await canCreateMarket(2);
    if (not cycleCheck.canCreate) {
      return #err("Insufficient cycles to create binary market. Need " # Nat.toText(cycleCheck.requiredCycles) # " but have " # Nat.toText(cycleCheck.currentBalance));
    };

    let marketId = nextMarketId;

    // Deploy YES ledger
    let yesResult = await deployTokenLedger(
      marketId,
      "YES" # Nat.toText(marketId),
      "YES" # Nat.toText(marketId),
      args.title,
      "YES token for: " # args.title
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
      args.title,
      "NO token for: " # args.title
    );
    let noLedger = switch (noResult) {
      case (#ok(ledger)) ledger;
      case (#err(error)) return #err("Failed to deploy NO ledger: " # error);
    };

    // NEW: Register market with Markets canister
    let marketsActor : MarketsInterface = actor(Principal.toText(marketsPrincipal));
    
    let registrationArgs : BinaryRegistrationArgs = {
      base = {
        question = args.title;
        resolver = args.resolver;
        expiry = Nat64.fromIntWrap(args.expirationTime);
        b = args.liquidityParameter;
        totalSupply = args.totalSupply;
      };
      yesLedger = yesLedger;
      noLedger = noLedger;
    };

    let registrationResult = await marketsActor.registerBinaryMarketWithVault(registrationArgs);
    
    let registeredInMarkets = switch (registrationResult) {
      case (#ok(result)) {
        Debug.print("Market registered in Markets canister with ID: " # Nat.toText(result.marketId));
        Debug.print("Vault setup complete: " # (if (result.setupComplete) "true" else "false"));
        true
      };
      case (#err(error)) {
        Debug.print("Warning: Failed to register market in Markets canister: " # error);
        false
      };
    };

    // Create market metadata
    let metadata : MarketMetadata = {
      title = args.title;
      description = args.description;
      category = args.category;
      creator = caller;
      image = args.image;
      tags = args.tags;
      bettingCloseTime = args.bettingCloseTime;
      expirationTime = args.expirationTime;
      resolutionLink = args.resolutionLink;
      resolutionDescription = args.resolutionDescription;
      created_at = Time.now();
    };

    // Store market info
    let info : MarketInfo = {
      id = marketId;
      metadata = metadata;
      marketType = #Binary;
      tokens = #Binary({
        yesLedger = yesLedger;
        noLedger = noLedger;
      });
      registeredInMarkets = registeredInMarkets;
    };
    marketInfo.put(marketId, info);

    nextMarketId += 1;
    
    Debug.print("Binary Market #" # Nat.toText(marketId) # " created:");
    Debug.print("Title: " # args.title);
    Debug.print("YES: " # Principal.toText(yesLedger));
    Debug.print("NO: " # Principal.toText(noLedger));
    Debug.print("Registered in Markets: " # (if (registeredInMarkets) "Yes" else "No"));
    Debug.print("Remaining cycles: " # Nat.toText(Cycles.balance()));
    
    #ok(marketId)
  };

  public shared({ caller }) func createMultipleChoiceMarket(args : CreateMultipleChoiceMarketArgs) : async Result.Result<MarketId, Text> {
    // Validate input
    switch (validateMarketArgs(args.title, args.description, args.tags, args.bettingCloseTime, args.expirationTime)) {
      case (#err(msg)) return #err(msg);
      case (#ok()) {};
    };

    if (args.outcomes.size() < 2) {
      return #err("Multiple choice markets need at least 2 outcomes");
    };

    if (args.outcomes.size() > MAX_OUTCOMES) {
      return #err("Too many outcomes. Maximum is " # Nat.toText(MAX_OUTCOMES));
    };

    // Check Markets canister is set
    let marketsPrincipal = switch (marketsCanister) {
      case (null) { return #err("Markets canister not set") };
      case (?p) { p };
    };

    // Check cycles
    let cycleCheck = await canCreateMarket(args.outcomes.size());
    if (not cycleCheck.canCreate) {
      return #err("Insufficient cycles to create multiple choice market. Need " # Nat.toText(cycleCheck.requiredCycles) # " but have " # Nat.toText(cycleCheck.currentBalance));
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
        toUpperSymbol(outcome) # Nat.toText(marketId),
        args.title,
        outcome # " token for: " # args.title
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

    // NEW: Register market with Markets canister
    let marketsActor : MarketsInterface = actor(Principal.toText(marketsPrincipal));
    
    let registrationArgs : MultipleChoiceRegistrationArgs = {
      base = {
        question = args.title;
        resolver = args.resolver;
        expiry = Nat64.fromIntWrap(args.expirationTime);
        b = args.liquidityParameter;
        totalSupply = args.totalSupply;
      };
      outcomes = outcomeLedgers;
    };

    let registrationResult = await marketsActor.registerMultipleChoiceMarketWithVault(registrationArgs);
    
    let registeredInMarkets = switch (registrationResult) {
      case (#ok(result)) {
        Debug.print("Market registered in Markets canister with ID: " # Nat.toText(result.marketId));
        true
      };
      case (#err(error)) {
        Debug.print("Warning: Failed to register market in Markets canister: " # error);
        false
      };
    };

    // Create market metadata
    let metadata : MarketMetadata = {
      title = args.title;
      description = args.description;
      category = args.category;
      creator = caller;
      image = args.image;
      tags = args.tags;
      bettingCloseTime = args.bettingCloseTime;
      expirationTime = args.expirationTime;
      resolutionLink = args.resolutionLink;
      resolutionDescription = args.resolutionDescription;
      created_at = Time.now();
    };

    // Store market info
    let info : MarketInfo = {
      id = marketId;
      metadata = metadata;
      marketType = #MultipleChoice({ outcomes = args.outcomes });
      tokens = #MultipleChoice({
        outcomeLedgers = outcomeLedgers;
      });
      registeredInMarkets = registeredInMarkets;
    };
    marketInfo.put(marketId, info);

    nextMarketId += 1;
    
    Debug.print("Multiple Choice Market #" # Nat.toText(marketId) # " created:");
    Debug.print("Title: " # args.title);
    for ((outcome, ledger) in outcomeLedgers.vals()) {
      Debug.print(outcome # ": " # Principal.toText(ledger));
    };
    Debug.print("Registered in Markets: " # (if (registeredInMarkets) "Yes" else "No"));
    Debug.print("Remaining cycles: " # Nat.toText(Cycles.balance()));
    
    #ok(marketId)
  };

  public shared({ caller }) func createCompoundMarket(args : CreateCompoundMarketArgs) : async Result.Result<MarketId, Text> {
    // Validate input
    switch (validateMarketArgs(args.title, args.description, args.tags, args.bettingCloseTime, args.expirationTime)) {
      case (#err(msg)) return #err(msg);
      case (#ok()) {};
    };

    if (args.subjects.size() < 2) {
      return #err("Compound markets need at least 2 subjects");
    };

    if (args.subjects.size() > MAX_SUBJECTS) {
      return #err("Too many subjects. Maximum is " # Nat.toText(MAX_SUBJECTS));
    };

    // Check Markets canister is set
    let marketsPrincipal = switch (marketsCanister) {
      case (null) { return #err("Markets canister not set") };
      case (?p) { p };
    };

    // Check cycles
    let cycleCheck = await canCreateMarket(args.subjects.size() * 2);
    if (not cycleCheck.canCreate) {
      return #err("Insufficient cycles to create compound market. Need " # Nat.toText(cycleCheck.requiredCycles) # " but have " # Nat.toText(cycleCheck.currentBalance));
    };

    // Validate subject names
    for (subject in args.subjects.vals()) {
      if (not validateOutcomeName(subject)) {
        return #err("Invalid subject name: " # subject);
      };
    };

    let marketId = nextMarketId;
    var subjectTokens : [(Text, BinaryTokens)] = [];
    var subjectsForRegistration : [(Text, (Principal, Principal))] = [];

    // Deploy YES/NO ledgers for each subject
    for (subject in args.subjects.vals()) {
      let yesResult = await deployTokenLedger(
        marketId,
        subject # " YES - Market #" # Nat.toText(marketId),
        toUpperSymbol(subject) # "_YES" # Nat.toText(marketId),
        args.title,
        "YES token for " # subject # " in: " # args.title
      );

      let yesLedger = switch (yesResult) {
        case (#ok(ledger)) ledger;
        case (#err(error)) return #err("Failed to deploy YES ledger for " # subject # ": " # error);
      };

      let noResult = await deployTokenLedger(
        marketId,
        subject # " NO - Market #" # Nat.toText(marketId),
        toUpperSymbol(subject) # "_NO" # Nat.toText(marketId),
        args.title,
        "NO token for " # subject # " in: " # args.title
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
      subjectsForRegistration := Array.append(subjectsForRegistration, [(subject, (yesLedger, noLedger))]);
    };

    // NEW: Register market with Markets canister
    let marketsActor : MarketsInterface = actor(Principal.toText(marketsPrincipal));
    
    let registrationArgs : CompoundRegistrationArgs = {
      base = {
        question = args.title;
        resolver = args.resolver;
        expiry = Nat64.fromIntWrap(args.expirationTime);
        b = args.liquidityParameter;
        totalSupply = args.totalSupply;
      };
      subjects = subjectsForRegistration;
    };

    let registrationResult = await marketsActor.registerCompoundMarketWithVault(registrationArgs);
    
    let registeredInMarkets = switch (registrationResult) {
      case (#ok(result)) {
        Debug.print("Market registered in Markets canister with ID: " # Nat.toText(result.marketId));
        true
      };
      case (#err(error)) {
        Debug.print("Warning: Failed to register market in Markets canister: " # error);
        false
      };
    };

    // Create market metadata
    let metadata : MarketMetadata = {
      title = args.title;
      description = args.description;
      category = args.category;
      creator = caller;
      image = args.image;
      tags = args.tags;
      bettingCloseTime = args.bettingCloseTime;
      expirationTime = args.expirationTime;
      resolutionLink = args.resolutionLink;
      resolutionDescription = args.resolutionDescription;
      created_at = Time.now();
    };

    // Store market info
    let info : MarketInfo = {
      id = marketId;
      metadata = metadata;
      marketType = #Compound({ subjects = args.subjects });
      tokens = #Compound({
        subjectTokens = subjectTokens;
      });
      registeredInMarkets = registeredInMarkets;
    };
    marketInfo.put(marketId, info);

    nextMarketId += 1;
    
    Debug.print("Compound Market #" # Nat.toText(marketId) # " created:");
    Debug.print("Title: " # args.title);
    for ((subject, tokens) in subjectTokens.vals()) {
      Debug.print(subject # " YES: " # Principal.toText(tokens.yesLedger));
      Debug.print(subject # " NO: " # Principal.toText(tokens.noLedger));
    };
    Debug.print("Registered in Markets: " # (if (registeredInMarkets) "Yes" else "No"));
    Debug.print("Remaining cycles: " # Nat.toText(Cycles.balance()));
    
    #ok(marketId)
  };

  // Legacy function for backward compatibility
  public shared({ caller }) func createMarket(args : { question : Text }) : async Result.Result<MarketId, Text> {
    let legacyArgs : CreateBinaryMarketArgs = {
      title = args.question;
      description = "Legacy market created with basic question";
      category = #Technology;
      image = #ImageUrl("");
      tags = [];
      bettingCloseTime = Time.now() + (24 * 60 * 60 * 1000_000_000);
      expirationTime = Time.now() + (7 * 24 * 60 * 60 * 1000_000_000);
      resolutionLink = "";
      resolutionDescription = "Manual resolution required";
      resolver = caller;
      liquidityParameter = 100.0;
      totalSupply = 1_000_000_000_000;
    };
    await createBinaryMarket(legacyArgs)
  };

  // ===== QUERY FUNCTIONS =====

  public query func getMarketInfo(marketId : MarketId) : async ?MarketInfo {
    marketInfo.get(marketId)
  };

  public query func getAllMarkets() : async [MarketInfo] {
    Iter.toArray(marketInfo.vals())
  };

  public query func getMarketsByCategory(category : Category) : async [MarketInfo] {
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        market.metadata.category == category
      }
    );
    filtered
  };

  public query func getMarketsByCreator(creator : Principal) : async [MarketInfo] {
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        market.metadata.creator == creator
      }
    );
    filtered
  };

  public query func getMarketsByTag(tag : Tag) : async [MarketInfo] {
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        Array.find<Tag>(market.metadata.tags, func(t : Tag) : Bool { t == tag }) != null
      }
    );
    filtered
  };

  public query func getActiveMarkets() : async [MarketInfo] {
    let currentTime = Time.now();
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        market.metadata.bettingCloseTime > currentTime
      }
    );
    filtered
  };

  public query func getExpiredMarkets() : async [MarketInfo] {
    let currentTime = Time.now();
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        market.metadata.expirationTime <= currentTime
      }
    );
    filtered
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

  public query func getRegisteredMarkets() : async [MarketInfo] {
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        market.registeredInMarkets
      }
    );
    filtered
  };

  public query func getUnregisteredMarkets() : async [MarketInfo] {
    let filtered = Array.filter<MarketInfo>(
      Iter.toArray(marketInfo.vals()),
      func(market : MarketInfo) : Bool {
        not market.registeredInMarkets
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

  public query func getMarketCountByCategory() : async [(Category, Nat)] {
    let categories : [Category] = [#Runes, #Stocks, #Political, #Sports, #Entertainment, #Technology, #Crypto, #AI];
    var counts : [(Category, Nat)] = [];
    
    for (category in categories.vals()) {
      var count = 0;
      for (market in marketInfo.vals()) {
        if (market.metadata.category == category) {
          count += 1;
        };
      };
      counts := Array.append(counts, [(category, count)]);
    };
    
    counts
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