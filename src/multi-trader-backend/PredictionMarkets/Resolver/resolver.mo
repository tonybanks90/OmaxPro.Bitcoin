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
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";

actor Resolver {
    
    // ===== TYPES =====
    
    // Market types (imported from Markets Canister)
    public type MarketType = {
        #Binary;
        #MultipleChoice;
        #Compound;
    };
    
    public type MarketResolution = {
        #Binary: BinaryOutcome;
        #MultipleChoice: Text;             // Winning outcome name
        #Compound: [(Text, BinaryOutcome)]; // Subject name -> outcome
    };
    
    public type BinaryOutcome = { #Yes; #No };
    
    // Oracle source types
    public type OracleSource = {
        #PriceFeed: PriceFeedConfig;
        #EventAPI: EventAPIConfig;  
        #CustomOracle: CustomOracleConfig;
    };
    
    public type PriceFeedConfig = {
        symbol: Text;              // BTC, AAPL, etc.
        provider: OracleProvider;  // Chainlink, Coinbase, etc.
        decimals: Nat8;           // Price precision
        updateFrequency: Nat64;   // Seconds between updates
    };
    
    public type EventAPIConfig = {
        endpoint: Text;           // API endpoint URL
        authMethod: AuthMethod;   // API authentication
        dataPath: Text;          // JSON path to result
        resultMapping: [(Text, MarketOutcome)]; // Map API values to outcomes
    };
    
    public type CustomOracleConfig = {
        oracleId: Text;
        endpoint: Text;
        authMethod: AuthMethod;
        customLogic: Text;        // Custom processing logic identifier
    };
    
    public type AuthMethod = {
        #None;
        #APIKey: Text;
        #Bearer: Text;
        #Basic: (Text, Text);     // (username, password)
    };
    
    public type MarketOutcome = Text;
    
    // Oracle provider types
    public type OracleProvider = {
        #Chainlink: ChainlinkConfig;
        #CoinbaseAPI: CoinbaseConfig;
        #AlphaVantage: AlphaVantageConfig;
        #Polygon: PolygonConfig;
        #CustomHTTP: CustomHTTPConfig;
        #ICPOracle: ICPOracleConfig;
    };
    
    public type ChainlinkConfig = {
        feedId: Text;             // Chainlink feed identifier
        network: ChainlinkNetwork; // Ethereum, BSC, etc.
        contractAddress: Text;    // Feed contract address
    };
    
    public type ChainlinkNetwork = {
        #Ethereum;
        #BSC;
        #Polygon;
        #Avalanche;
    };
    
    public type CoinbaseConfig = {
        productId: Text;          // BTC-USD, ETH-USD, etc.
        apiKey: Text;            // API authentication
        sandbox: Bool;           // Use sandbox for testing
    };
    
    public type AlphaVantageConfig = {
        symbol: Text;
        function: Text;          // TIME_SERIES_DAILY, etc.
        apiKey: Text;
    };
    
    public type PolygonConfig = {
        ticker: Text;
        apiKey: Text;
    };
    
    public type CustomHTTPConfig = {
        url: Text;
        headers: [(Text, Text)];
        method: HTTPMethod;
    };
    
    public type ICPOracleConfig = {
        canisterId: Principal;
        method: Text;
    };
    
    public type HTTPMethod = {
        #GET;
        #POST;
        #PUT;
    };
    
    // Oracle response structure
    public type OracleResponse = {
        value: Float;
        timestamp: Nat64;
        source: OracleProvider;
        confidence: Float;        // 0.0 - 1.0 confidence score
        signature: ?[Nat8];       // Cryptographic signature if available
    };
    
    // Resolution condition types
    public type ResolutionCondition = {
        #PriceThreshold: {
            symbol: Text;
            operator: ComparisonOperator;
            threshold: Float;
            timeframe: ?TimeFrame;
        };
        #EventOutcome: {
            eventId: Text;
            expectedValue: Text;
        };
        #CustomLogic: {
            conditionId: Text;
            parameters: [(Text, Text)];
        };
    };
    
    public type ComparisonOperator = {
        #GreaterThan;
        #LessThan; 
        #EqualTo;
        #GreaterThanOrEqual;
        #LessThanOrEqual;
    };
    
    public type TimeFrame = {
        #AtTime: Nat64;           // Resolve at specific timestamp
        #DuringPeriod: (Nat64, Nat64); // Resolve if condition met in period
        #AverageOver: Nat64;      // Average price over duration
    };
    
    // Market resolution mapping
    public type MarketResolutionRule = {
        marketId: Nat;
        marketType: MarketType;   // From Markets Canister
        conditions: [ResolutionCondition];
        logic: ResolutionLogic;   // How to combine conditions
        autoResolve: Bool;        // Auto-resolve or require manual trigger
        disputePeriod: Nat64;     // Time window for disputes (seconds)
        fallbackResolver: ?Principal; // Manual resolver if oracle fails
    };
    
    public type ResolutionLogic = {
        #AND;  // All conditions must be true
        #OR;   // Any condition can be true
        #MAJORITY; // Majority of conditions must be true
        #CUSTOM: Text; // Custom logic identifier
    };
    
    // Dispute system types
    public type DisputeStatus = {
        #Open;
        #UnderReview;
        #Resolved;
        #Rejected;
    };
    
    public type MarketDispute = {
        disputeId: Nat;
        marketId: Nat;
        challenger: Principal;
        reason: Text;
        evidence: [DisputeEvidence];
        status: DisputeStatus;
        createdAt: Nat64;
        reviewedBy: ?Principal;
        resolution: ?DisputeResolution;
    };
    
    public type DisputeEvidence = {
        evidenceType: EvidenceType;
        data: [Nat8];            // Raw evidence data
        description: Text;
        timestamp: Nat64;
        source: Text;            // Evidence source/URL
    };
    
    public type EvidenceType = {
        #OracleData;             // Alternative oracle data
        #Screenshot;             // Screenshot evidence
        #APIResponse;            // Raw API response
        #NewsArticle;            // Supporting news
        #OfficialStatement;      // Official announcements
    };
    
    public type DisputeResolution = {
        decision: DisputeDecision;
        explanation: Text;
        reviewer: Principal;
        resolvedAt: Nat64;
    };
    
    public type DisputeDecision = {
        #Upheld: MarketResolution;  // Dispute accepted, new resolution
        #Rejected;                  // Dispute rejected, keep original
    };
    
    // Result types
    public type ResolutionResult = {
        marketId: Nat;
        resolution: MarketResolution;
        resolvedAt: Nat64;
        oracleDataUsed: [OracleResponse];
        resolutionMethod: ResolutionMethod;
    };
    
    public type ResolutionMethod = {
        #Automatic;
        #Manual;
        #Fallback;
    };
    
    public type ResolutionStatus = {
        marketId: Nat;
        isResolved: Bool;
        scheduledTime: ?Nat64;
        lastAttempt: ?Nat64;
        attemptCount: Nat;
        errors: [Text];
    };
    
    // Markets Canister Interface
    public type MarketsInterface = actor {
        resolveMarket : (Nat, MarketResolution) -> async (Result.Result<(), Text>);
        getMarket : (Nat) -> async (Result.Result<MarketInfo, Text>);
    };
    
    public type MarketInfo = {
        id: Nat;
        active: Bool;
        resolved: ?MarketResolution;
        expiry: Nat64;
    };
    
    // Monitoring types
    public type SystemStatus = {
        activeOracles: Nat;
        pendingResolutions: Nat;
        openDisputes: Nat;
        systemHealth: HealthScore;
        lastHeartbeat: Nat64;
        oracleLatency: [(Text, Nat64)]; // Oracle ID -> avg response time
    };
    
    public type HealthScore = {
        #Healthy;
        #Degraded: Text;  // Reason for degradation
        #Critical: Text;  // Critical issues
    };
    
    public type ResolutionMetrics = {
        totalResolutions: Nat;
        successfulAutoResolutions: Nat;
        fallbackResolutions: Nat;
        disputedResolutions: Nat;
        averageResolutionTime: Float; // Seconds
        oracleReliability: [(Text, Float)]; // Oracle ID -> reliability score
    };
    
    // Emergency state
    public type EmergencyState = {
        #Normal;
        #Paused: {
            reason: Text;
            pausedAt: Nat64;
            pausedBy: Principal;
        };
        #Emergency: {
            reason: Text;
            activatedAt: Nat64;
            activatedBy: Principal;
        };
    };
    
    // ===== STATE =====
    
    // Resolution rules storage
    stable var resolutionRulesEntries : [(Nat, MarketResolutionRule)] = [];
    private var resolutionRules : TrieMap.TrieMap<Nat, MarketResolutionRule> = 
        TrieMap.TrieMap<Nat, MarketResolutionRule>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    
    // Oracle sources storage
    stable var oracleSourcesEntries : [(Text, OracleSource)] = [];
    private var oracleSources : TrieMap.TrieMap<Text, OracleSource> = 
        TrieMap.TrieMap<Text, OracleSource>(Text.equal, Text.hash);
    
    // Dispute storage
    stable var disputeEntries : [(Nat, MarketDispute)] = [];
    private var disputes : TrieMap.TrieMap<Nat, MarketDispute> = 
        TrieMap.TrieMap<Nat, MarketDispute>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    stable var nextDisputeId : Nat = 1;
    
    // Resolution schedule
    stable var scheduledResolutions : [(Nat64, Nat)] = []; // (timestamp, marketId)
    private var resolutionSchedule = Buffer.Buffer<(Nat64, Nat)>(100);
    
    // Configuration
    private stable var marketsCanister : ?Principal = null;
    private stable var systemState: EmergencyState = #Normal;
    private stable var lastHeartbeatTime : Nat64 = 0;
    
    // Access control
    private stable var disputeReviewers : [Principal] = [];
    private stable var oracleProviders : [Principal] = [];
    
    // Rate limiting
    private var oracleRequestLimits = HashMap.HashMap<Text, (Nat64, Nat)>(10, Text.equal, Text.hash);
    
    // Audit log
    stable var auditLogEntries : [(Nat, AuditEntry)] = [];
    private var auditLog : TrieMap.TrieMap<Nat, AuditEntry> = 
        TrieMap.TrieMap<Nat, AuditEntry>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });
    stable var nextAuditId : Nat = 1;
    
    public type AuditEntry = {
        id: Nat;
        marketId: Nat;
        action: AuditAction;
        timestamp: Nat64;
        actor: Principal;
        details: Text;
        oracleResponses: [(Text, Bool)]; // Oracle ID -> success
        scheduledAt: Nat64;
        resolvedAt: Nat64;
        resolutionMethod: ResolutionMethod;
    };
    
    public type AuditAction = {
        #RuleRegistered;
        #ResolutionAttempted;
        #ResolutionSucceeded;
        #ResolutionFailed;
        #DisputeFiled;
        #DisputeResolved;
        #FallbackTriggered;
    };
    
    // ===== INITIALIZATION =====
    
    public shared(msg) func setMarketsCanister(canister: Principal) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can set Markets canister");
        };
        marketsCanister := ?canister;
        #ok()
    };
    
    public shared(msg) func addDisputeReviewer(reviewer: Principal) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can add dispute reviewers");
        };
        disputeReviewers := Array.append(disputeReviewers, [reviewer]);
        #ok()
    };
    
    public shared(msg) func addOracleProvider(provider: Principal) : async Result.Result<(), Text> {
        if (not Principal.isController(msg.caller)) {
            return #err("Only controller can add oracle providers");
        };
        oracleProviders := Array.append(oracleProviders, [provider]);
        #ok()
    };
    
    // ===== HELPER FUNCTIONS =====
    
    private func isAuthorizedCaller(caller: Principal) : Bool {
        Principal.isController(caller) or 
        (switch (marketsCanister) {
            case (?markets) { caller == markets };
            case (null) { false };
        })
    };
    
    private func isDisputeReviewer(caller: Principal) : Bool {
        Principal.isController(caller) or
        Option.isSome(Array.find<Principal>(disputeReviewers, func(r) = r == caller))
    };
    
    private func isOracleProvider(caller: Principal) : Bool {
        Principal.isController(caller) or
        Option.isSome(Array.find<Principal>(oracleProviders, func(p) = p == caller))
    };
    
    private func validateResolutionRule(rule: MarketResolutionRule) : Result.Result<(), Text> {
        if (rule.conditions.size() == 0) {
            return #err("At least one condition is required");
        };
        
        if (rule.disputePeriod > 2_592_000_000_000_000) { // 30 days max
            return #err("Dispute period cannot exceed 30 days");
        };
        
        // Validate each condition
        for (condition in rule.conditions.vals()) {
            switch (validateCondition(condition)) {
                case (#err(error)) { return #err(error) };
                case (#ok()) {};
            };
        };
        
        #ok()
    };
    
    private func validateCondition(condition: ResolutionCondition) : Result.Result<(), Text> {
        switch (condition) {
            case (#PriceThreshold(config)) {
                if (Text.size(config.symbol) == 0) {
                    return #err("Symbol cannot be empty");
                };
                if (config.threshold <= 0.0) {
                    return #err("Threshold must be positive");
                };
            };
            case (#EventOutcome(config)) {
                if (Text.size(config.eventId) == 0) {
                    return #err("Event ID cannot be empty");
                };
                if (Text.size(config.expectedValue) == 0) {
                    return #err("Expected value cannot be empty");
                };
            };
            case (#CustomLogic(config)) {
                if (Text.size(config.conditionId) == 0) {
                    return #err("Condition ID cannot be empty");
                };
            };
        };
        #ok()
    };
    
    private func checkRateLimit(oracleId: Text) : Bool {
        let currentTime = Nat64.fromNat(Int.abs(Time.now()));
        let hourStart = (currentTime / 3_600_000_000_000) * 3_600_000_000_000;
        
        switch (oracleRequestLimits.get(oracleId)) {
            case (null) {
                oracleRequestLimits.put(oracleId, (hourStart, 1));
                true
            };
            case (?(lastHour, count)) {
                if (hourStart == lastHour) {
                    if (count >= 100) { // Max 100 requests per hour
                        false
                    } else {
                        oracleRequestLimits.put(oracleId, (hourStart, count + 1));
                        true
                    }
                } else {
                    oracleRequestLimits.put(oracleId, (hourStart, 1));
                    true
                }
            };
        }
    };
    
    // ===== ORACLE MANAGEMENT =====
    
    public shared(msg) func addOracleSource(source: OracleSource) : async Result.Result<Text, Text> {
        if (not isAuthorizedCaller(msg.caller) and not isOracleProvider(msg.caller)) {
            return #err("Unauthorized to add oracle sources");
        };
        
        let oracleId = generateOracleId(source);
        oracleSources.put(oracleId, source);
        #ok(oracleId)
    };
    
    private func generateOracleId(source: OracleSource) : Text {
        switch (source) {
            case (#PriceFeed(config)) {
                config.symbol # "_" # getProviderName(config.provider)
            };
            case (#EventAPI(config)) {
                "event_" # Text.replace(config.endpoint, #char('/'), "_")
            };
            case (#CustomOracle(config)) {
                "custom_" # config.oracleId
            };
        }
    };
    
    private func getProviderName(provider: OracleProvider) : Text {
        switch (provider) {
            case (#Chainlink(_)) { "chainlink" };
            case (#CoinbaseAPI(_)) { "coinbase" };
            case (#AlphaVantage(_)) { "alphavantage" };
            case (#Polygon(_)) { "polygon" };
            case (#CustomHTTP(_)) { "custom_http" };
            case (#ICPOracle(_)) { "icp_oracle" };
        }
    };
    
    // ===== ORACLE DATA FETCHING =====
    
    private func fetchOracleData(
        sources: [OracleSource],
        symbol: Text
    ) : async Result.Result<[OracleResponse], Text> {
        
        var responses: [OracleResponse] = [];
        
        for (source in sources.vals()) {
            let oracleId = generateOracleId(source);
            
            if (not checkRateLimit(oracleId)) {
                continue; // Skip if rate limited
            };
            
            switch (source) {
                case (#PriceFeed(config)) {
                    let response = await fetchPriceFeed(config, symbol);
                    switch (response) {
                        case (#ok(data)) { 
                            responses := Array.append(responses, [data]);
                        };
                        case (#err(error)) { 
                            Debug.print("Oracle " # oracleId # " failed: " # error);
                        };
                    }
                };
                case (#EventAPI(config)) {
                    let response = await fetchEventData(config);
                    switch (response) {
                        case (#ok(data)) { 
                            responses := Array.append(responses, [data]);
                        };
                        case (#err(error)) { 
                            Debug.print("Event API " # oracleId # " failed: " # error);
                        };
                    }
                };
                case (#CustomOracle(config)) {
                    let response = await fetchCustomOracleData(config);
                    switch (response) {
                        case (#ok(data)) { 
                            responses := Array.append(responses, [data]);
                        };
                        case (#err(error)) { 
                            Debug.print("Custom oracle " # oracleId # " failed: " # error);
                        };
                    }
                };
            }
        };
        
        if (responses.size() == 0) {
            #err("No oracle sources returned valid data")
        } else {
            #ok(responses)
        }
    };
    
    // Placeholder implementations for oracle fetching
    // In a real implementation, these would make HTTP outcalls
    private func fetchPriceFeed(config: PriceFeedConfig, symbol: Text) : async Result.Result<OracleResponse, Text> {
        // Mock implementation - would make actual HTTP calls
        let mockPrice = 65000.0; // Mock Bitcoin price
        let response: OracleResponse = {
            value = mockPrice;
            timestamp = Nat64.fromNat(Int.abs(Time.now()));
            source = config.provider;
            confidence = 0.95;
            signature = null;
        };
        #ok(response)
    };
    
    private func fetchEventData(config: EventAPIConfig) : async Result.Result<OracleResponse, Text> {
        // Mock implementation
        let response: OracleResponse = {
            value = 1.0; // Mock event result
            timestamp = Nat64.fromNat(Int.abs(Time.now()));
            source = #CustomHTTP({
                url = config.endpoint;
                headers = [];
                method = #GET;
            });
            confidence = 0.90;
            signature = null;
        };
        #ok(response)
    };
    
    private func fetchCustomOracleData(config: CustomOracleConfig) : async Result.Result<OracleResponse, Text> {
        // Mock implementation
        let response: OracleResponse = {
            value = 42.0; // Mock custom data
            timestamp = Nat64.fromNat(Int.abs(Time.now()));
            source = #CustomHTTP({
                url = config.endpoint;
                headers = [];
                method = #GET;
            });
            confidence = 0.85;
            signature = null;
        };
        #ok(response)
    };
    
    // Validate and aggregate oracle responses
    private func validateOracleData(responses: [OracleResponse]) : Result.Result<Float, Text> {
        if (responses.size() < 1) {
            return #err("No oracle responses to validate");
        };
        
        // Check timestamp freshness (within last 10 minutes)
        let currentTime = Nat64.fromNat(Int.abs(Time.now()));
        let staleThreshold = currentTime - 600_000_000_000; // 10 minutes in nanoseconds
        
        let freshResponses = Array.filter<OracleResponse>(
            responses,
            func(r) = r.timestamp > staleThreshold and r.confidence >= 0.8
        );
        
        if (freshResponses.size() == 0) {
            return #err("No fresh, high-confidence oracle data available");
        };
        
        // Calculate median value (more robust than average)
        let values = Array.map<OracleResponse, Float>(freshResponses, func(r) = r.value);
        let sortedValues = Array.sort(values, Float.compare);
        
        let median = if (sortedValues.size() % 2 == 0) {
            let mid = sortedValues.size() / 2;
            (sortedValues[mid - 1] + sortedValues[mid]) / 2.0
        } else {
            sortedValues[sortedValues.size() / 2]
        };
        
        // For single oracle, return the value directly
        if (freshResponses.size() == 1) {
            return #ok(median);
        };
        
        // Check for outliers (values more than 5% from median)
        let outlierThreshold = 0.05; // 5%
        var validValues = 0;
        
        for (value in values.vals()) {
            let deviation = if (median != 0.0) { 
                Float.abs((value - median) / median) 
            } else { 
                0.0 
            };
            if (deviation <= outlierThreshold) {
                validValues += 1;
            };
        };
        
        // Require majority of values to be within threshold
        if (freshResponses.size() >= 2 and Float.fromInt(validValues) / Float.fromInt(values.size()) < 0.6) {
            return #err("Oracle data contains too many outliers");
        };
        
        #ok(median)
    };
    
    // ===== RESOLUTION ENGINE =====
    
    public shared(msg) func registerResolutionRule(
        rule: MarketResolutionRule
    ) : async Result.Result<(), Text> {
        
        // Validate caller is Markets Canister or authorized resolver
        if (not isAuthorizedCaller(msg.caller)) {
            return #err("Unauthorized: Only Markets Canister can register resolution rules");
        };
        
        // Check system state
        switch (systemState) {
            case (#Paused(_)) { return #err("System is paused") };
            case (#Emergency(_)) { return #err("System is in emergency mode") };
            case (#Normal) {};
        };
        
        // Validate resolution rule
        let validation = validateResolutionRule(rule);
        switch (validation) {
            case (#err(error)) { return #err(error) };
            case (#ok()) {};
        };
        
        // Store resolution rule
        resolutionRules.put(rule.marketId, rule);
        
        // Log registration
        await recordAuditEntry(rule.marketId, #RuleRegistered, msg.caller, "Resolution rule registered", [], 0, 0, #Manual);
        
        // Start monitoring if auto-resolve is enabled
        if (rule.autoResolve) {
            await scheduleAutoResolution(rule);
        };
        
        #ok()
    };
    
    public func resolveMarket(marketId: Nat) : async Result.Result<ResolutionResult, Text> {
        
        // Check system state
        switch (systemState) {
            case (#Paused(_)) { return #err("System is paused") };
            case (#Emergency(_)) { return #err("System is in emergency mode") };
            case (#Normal) {};
        };
        
        switch (resolutionRules.get(marketId)) {
            case (null) { return #err("No resolution rule found for market") };
            case (?rule) {
                
                // Check if market is already resolved
                if (await isMarketResolved(marketId)) {
                    return #err("Market already resolved");
                };
                
                await recordAuditEntry(marketId, #ResolutionAttempted, Principal.fromActor(Resolver), "Resolution attempt started", [], Nat64.fromNat(Int.abs(Time.now())), 0, #Automatic);
                
                // Evaluate all conditions
                var conditionResults: [Bool] = [];
                var oracleResponses: [OracleResponse] = [];
                
                for (condition in rule.conditions.vals()) {
                    let result = await evaluateCondition(condition);
                    switch (result) {
                        case (#ok((isTrue, responses))) { 
                            conditionResults := Array.append(conditionResults, [isTrue]);
                            oracleResponses := Array.append(oracleResponses, responses);
                        };
                        case (#err(error)) { 
                            await recordAuditEntry(marketId, #ResolutionFailed, Principal.fromActor(Resolver), "Condition evaluation failed: " # error, [], Nat64.fromNat(Int.abs(Time.now())), Nat64.fromNat(Int.abs(Time.now())), #Automatic);
                            return #err("Failed to evaluate condition: " # error) 
                        };
                    }
                };
                
                // Apply resolution logic
                let shouldResolve = applyResolutionLogic(rule.logic, conditionResults);
                
                if (not shouldResolve) {
                    await recordAuditEntry(marketId, #ResolutionFailed, Principal.fromActor(Resolver), "Resolution conditions not met", [], Nat64.fromNat(Int.abs(Time.now())), Nat64.fromNat(Int.abs(Time.now())), #Automatic);
                    return #err("Resolution conditions not met");
                };
                
                // Determine market outcome
                let outcome = determineMarketOutcome(rule, conditionResults);
                
                // Submit resolution to Markets Canister
                let resolutionResult = await submitResolution(marketId, rule.marketType, outcome);
                
                switch (resolutionResult) {
                    case (#ok()) {
                        let result: ResolutionResult = {
                            marketId = marketId;
                            resolution = outcome;
                            resolvedAt = Nat64.fromNat(Int.abs(Time.now()));
                            oracleDataUsed = oracleResponses;
                            resolutionMethod = #Automatic;
                        };
                        
                        // Record successful resolution
                        await recordAuditEntry(marketId, #ResolutionSucceeded, Principal.fromActor(Resolver), "Market resolved successfully", Array.map(oracleResponses, func(_) = ("oracle", true)), Nat64.fromNat(Int.abs(Time.now())), Nat64.fromNat(Int.abs(Time.now())), #Automatic);
                        
                        #ok(result)
                    };
                    case (#err(error)) {
                        await recordAuditEntry(marketId, #ResolutionFailed, Principal.fromActor(Resolver), "Resolution submission failed: " # error, [], Nat64.fromNat(Int.abs(Time.now())), Nat64.fromNat(Int.abs(Time.now())), #Automatic);
                        
                        // Trigger fallback if available
                        ignore await triggerFallbackResolution(marketId, "Automatic resolution failed: " # error);
                        
                        #err("Resolution failed: " # error)
                    };
                }
            };
        }
    };
    
    //