# Resolver Canister - Oracle-Powered Market Resolution

A decentralized resolution system that automatically resolves prediction markets using trusted data oracles. Supports price feeds, event data, and custom resolution logic with fail-safes and dispute mechanisms.

## 🎯 Overview

The Resolver Canister acts as an autonomous resolution engine that:
- **Fetches data** from multiple oracle sources
- **Validates data integrity** through cross-reference checks
- **Resolves markets automatically** based on predefined conditions  
- **Handles disputes** through escalation mechanisms
- **Maintains resolution history** for transparency and auditing

## 🏗 Architecture

```
Data Oracles → Resolver Canister → Markets Canister
     ↓               ↓                    ↓
Price Feeds    Resolution Logic     Market Resolution
Event APIs     Dispute System       Winner Determination
Custom Data    Audit Trail          Payout Triggers
```

### Core Components

1. **Oracle Manager** - Fetches and validates external data
2. **Resolution Engine** - Applies resolution logic to market conditions
3. **Dispute Handler** - Manages challenges and escalations
4. **Market Interface** - Communicates with Markets Canister
5. **Audit System** - Maintains complete resolution history

## 📊 Supported Resolution Types

### 1. Price-Based Resolution
- **Cryptocurrency Prices** (Bitcoin, Ethereum, etc.)
- **Stock Prices** (AAPL, TSLA, GOOGL, etc.)
- **Commodity Prices** (Gold, Oil, etc.)
- **Foreign Exchange** (USD/EUR, etc.)

### 2. Event-Based Resolution
- **Sports Results** (NBA, NFL, World Cup, etc.)
- **Election Outcomes** (Presidential, Congressional, etc.)
- **Weather Data** (Temperature, Rainfall, etc.)
- **Economic Indicators** (GDP, Inflation, etc.)

### 3. Custom Resolution Logic
- **Multi-condition markets** (Price AND volume thresholds)
- **Time-weighted averages** (30-day average price)
- **Comparative markets** (Stock A vs Stock B performance)
- **Complex predicates** (If-then-else resolution rules)

## 🔧 Core Types

```motoko
// Resolution data source types
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
```

## 🌐 Oracle Integration

### Supported Oracle Providers

```motoko
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

public type CoinbaseConfig = {
    productId: Text;          // BTC-USD, ETH-USD, etc.
    apiKey: Text;            // API authentication
    sandbox: Bool;           // Use sandbox for testing
};

// Oracle response structure
public type OracleResponse = {
    value: Float;
    timestamp: Nat64;
    source: OracleProvider;
    confidence: Float;        // 0.0 - 1.0 confidence score
    signature: ?[Nat8];       // Cryptographic signature if available
};
```

### Oracle Data Fetching

```motoko
// Fetch data from multiple sources for validation
public func fetchOracleData(
    sources: [OracleSource],
    symbol: Text
) : async Result.Result<[OracleResponse], Text> {
    
    var responses: [OracleResponse] = [];
    
    for (source in sources.vals()) {
        switch (source) {
            case (#PriceFeed(config)) {
                let response = await fetchPriceFeed(config, symbol);
                switch (response) {
                    case (#ok(data)) { responses := Array.append(responses, [data]) };
                    case (#err(_)) { /* Log error, continue with other sources */ };
                }
            };
            case (#EventAPI(config)) {
                let response = await fetchEventData(config);
                switch (response) {
                    case (#ok(data)) { responses := Array.append(responses, [data]) };
                    case (#err(_)) { /* Log error, continue */ };
                }
            };
            // ... handle other source types
        }
    };
    
    if (responses.size() == 0) {
        #err("No oracle sources returned valid data")
    } else {
        #ok(responses)
    }
};

// Validate and aggregate oracle responses
private func validateOracleData(responses: [OracleResponse]) : Result.Result<Float, Text> {
    if (responses.size() < 2) {
        return #err("Insufficient oracle sources for validation");
    };
    
    // Check timestamp freshness (within last 10 minutes)
    let currentTime = Nat64.fromNat(Int.abs(Time.now()));
    let staleThreshold = currentTime - 600_000_000_000; // 10 minutes in nanoseconds
    
    let freshResponses = Array.filter<OracleResponse>(
        responses,
        func(r) = r.timestamp > staleThreshold
    );
    
    if (freshResponses.size() == 0) {
        return #err("All oracle data is stale");
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
    
    // Check for outliers (values more than 5% from median)
    let outlierThreshold = 0.05; // 5%
    var validValues = 0;
    
    for (value in values.vals()) {
        let deviation = Float.abs((value - median) / median);
        if (deviation <= outlierThreshold) {
            validValues += 1;
        };
    };
    
    // Require majority of values to be within threshold
    if (Float.fromInt(validValues) / Float.fromInt(values.size()) < 0.6) {
        return #err("Oracle data contains too many outliers");
    };
    
    #ok(median)
};
```

## 🎯 Resolution Engine

### Market Resolution Rules

```motoko
// Storage for resolution rules
private stable var resolutionRulesEntries : [(Nat, MarketResolutionRule)] = [];
private var resolutionRules : TrieMap.TrieMap<Nat, MarketResolutionRule> = 
    TrieMap.TrieMap<Nat, MarketResolutionRule>(Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n) });

// Register resolution rule for a market
public shared(msg) func registerResolutionRule(
    rule: MarketResolutionRule
) : async Result.Result<(), Text> {
    
    // Validate caller is Markets Canister or authorized resolver
    if (not isAuthorizedCaller(msg.caller)) {
        return #err("Unauthorized: Only Markets Canister can register resolution rules");
    };
    
    // Validate resolution rule
    let validation = validateResolutionRule(rule);
    switch (validation) {
        case (#err(error)) { return #err(error) };
        case (#ok()) {};
    };
    
    // Store resolution rule
    resolutionRules.put(rule.marketId, rule);
    
    // Start monitoring if auto-resolve is enabled
    if (rule.autoResolve) {
        await scheduleAutoResolution(rule);
    };
    
    #ok()
};

// Main resolution engine
public func resolveMarket(marketId: Nat) : async Result.Result<ResolutionResult, Text> {
    
    switch (resolutionRules.get(marketId)) {
        case (null) { return #err("No resolution rule found for market") };
        case (?rule) {
            
            // Check if market is already resolved
            if (await isMarketResolved(marketId)) {
                return #err("Market already resolved");
            };
            
            // Evaluate all conditions
            var conditionResults: [Bool] = [];
            
            for (condition in rule.conditions.vals()) {
                let result = await evaluateCondition(condition);
                switch (result) {
                    case (#ok(isTrue)) { 
                        conditionResults := Array.append(conditionResults, [isTrue]);
                    };
                    case (#err(error)) { 
                        return #err("Failed to evaluate condition: " # error) 
                    };
                }
            };
            
            // Apply resolution logic
            let shouldResolve = applyResolutionLogic(rule.logic, conditionResults);
            
            if (not shouldResolve) {
                return #err("Resolution conditions not met");
            };
            
            // Determine market outcome
            let outcome = await determineMarketOutcome(rule, conditionResults);
            
            // Submit resolution to Markets Canister
            let resolutionResult = await submitResolution(marketId, rule.marketType, outcome);
            
            // Record resolution in audit trail
            await recordResolution(marketId, outcome, conditionResults);
            
            resolutionResult
        };
    }
};

// Evaluate individual resolution conditions
private func evaluateCondition(condition: ResolutionCondition) : async Result.Result<Bool, Text> {
    switch (condition) {
        case (#PriceThreshold(config)) {
            let priceData = await getCurrentPrice(config.symbol);
            switch (priceData) {
                case (#err(error)) { #err(error) };
                case (#ok(price)) {
                    let result = switch (config.operator) {
                        case (#GreaterThan) { price > config.threshold };
                        case (#LessThan) { price < config.threshold };
                        case (#EqualTo) { Float.abs(price - config.threshold) < 0.001 };
                        case (#GreaterThanOrEqual) { price >= config.threshold };
                        case (#LessThanOrEqual) { price <= config.threshold };
                    };
                    #ok(result)
                };
            }
        };
        
        case (#EventOutcome(config)) {
            let eventData = await getEventResult(config.eventId);
            switch (eventData) {
                case (#err(error)) { #err(error) };
                case (#ok(actualValue)) {
                    #ok(actualValue == config.expectedValue)
                };
            }
        };
        
        case (#CustomLogic(config)) {
            await evaluateCustomCondition(config.conditionId, config.parameters)
        };
    }
};

// Apply resolution logic to combine condition results
private func applyResolutionLogic(logic: ResolutionLogic, results: [Bool]) : Bool {
    switch (logic) {
        case (#AND) { 
            Array.foldLeft<Bool, Bool>(results, true, func(acc, r) = acc and r)
        };
        case (#OR) { 
            Array.foldLeft<Bool, Bool>(results, false, func(acc, r) = acc or r)
        };
        case (#MAJORITY) {
            let trueCount = Array.foldLeft<Bool, Nat>(results, 0, func(acc, r) = if (r) { acc + 1 } else { acc });
            Float.fromInt(trueCount) > Float.fromInt(results.size()) / 2.0
        };
        case (#CUSTOM(logicId)) {
            applyCustomLogic(logicId, results)
        };
    }
};
```

## 🚨 Dispute System

### Dispute Handling

```motoko
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

// File a dispute against market resolution
public shared(msg) func fileDispute(
    marketId: Nat,
    reason: Text,
    evidence: [DisputeEvidence]
) : async Result.Result<Nat, Text> {
    
    // Check if market exists and has been resolved
    let marketExists = await checkMarketExists(marketId);
    if (not marketExists) {
        return #err("Market not found");
    };
    
    let isResolved = await isMarketResolved(marketId);
    if (not isResolved) {
        return #err("Cannot dispute unresolved market");
    };
    
    // Check if dispute period is still active
    switch (resolutionRules.get(marketId)) {
        case (null) { return #err("No resolution rule found") };
        case (?rule) {
            let resolutionTime = await getMarketResolutionTime(marketId);
            let currentTime = Nat64.fromNat(Int.abs(Time.now()));
            
            if (currentTime > resolutionTime + rule.disputePeriod) {
                return #err("Dispute period has expired");
            };
        };
    };
    
    // Create dispute record
    let disputeId = nextDisputeId;
    nextDisputeId += 1;
    
    let dispute: MarketDispute = {
        disputeId = disputeId;
        marketId = marketId;
        challenger = msg.caller;
        reason = reason;
        evidence = evidence;
        status = #Open;
        createdAt = Nat64.fromNat(Int.abs(Time.now()));
        reviewedBy = null;
        resolution = null;
    };
    
    disputes.put(disputeId, dispute);
    
    // Notify dispute reviewers
    await notifyDisputeReviewers(dispute);
    
    #ok(disputeId)
};

// Review and resolve dispute (Admin/Reviewer only)
public shared(msg) func reviewDispute(
    disputeId: Nat,
    decision: DisputeDecision,
    explanation: Text
) : async Result.Result<(), Text> {
    
    if (not isDisputeReviewer(msg.caller)) {
        return #err("Unauthorized: Only dispute reviewers can review disputes");
    };
    
    switch (disputes.get(disputeId)) {
        case (null) { return #err("Dispute not found") };
        case (?dispute) {
            if (dispute.status != #Open and dispute.status != #UnderReview) {
                return #err("Dispute is not open for review");
            };
            
            let resolution: DisputeResolution = {
                decision = decision;
                explanation = explanation;
                reviewer = msg.caller;
                resolvedAt = Nat64.fromNat(Int.abs(Time.now()));
            };
            
            let updatedDispute = {
                dispute with
                status = #Resolved;
                reviewedBy = ?msg.caller;
                resolution = ?resolution;
            };
            
            disputes.put(disputeId, updatedDispute);
            
            // If dispute is upheld, trigger market re-resolution
            switch (decision) {
                case (#Upheld(newOutcome)) {
                    await reResolveMarket(dispute.marketId, newOutcome);
                };
                case (#Rejected) {
                    // Keep original resolution
                };
            };
            
            // Notify relevant parties
            await notifyDisputeResolution(updatedDispute);
            
            #ok()
        };
    }
};
```

## ⚡ Automated Resolution

### Scheduled Resolution System

```motoko
// Auto-resolution scheduling
private stable var scheduledResolutions : [(Nat64, Nat)] = []; // (timestamp, marketId)
private var resolutionSchedule = Buffer.Buffer<(Nat64, Nat)>(100);

// Schedule automatic resolution
private func scheduleAutoResolution(rule: MarketResolutionRule) : async () {
    let resolutionTime = calculateResolutionTime(rule);
    resolutionSchedule.add((resolutionTime, rule.marketId));
    
    // Sort by timestamp for efficient processing
    let sortedSchedule = Array.sort<(Nat64, Nat)>(
        Buffer.toArray(resolutionSchedule),
        func(a, b) = Nat64.compare(a.0, b.0)
    );
    
    resolutionSchedule := Buffer.fromArray(sortedSchedule);
};

// Heartbeat function for automatic resolution (called periodically)
system func heartbeat() : async () {
    let currentTime = Nat64.fromNat(Int.abs(Time.now()));
    
    // Process all due resolutions
    let scheduleArray = Buffer.toArray(resolutionSchedule);
    var newSchedule = Buffer.Buffer<(Nat64, Nat)>(scheduleArray.size());
    
    for ((scheduledTime, marketId) in scheduleArray.vals()) {
        if (scheduledTime <= currentTime) {
            // Attempt automatic resolution
            try {
                let result = await resolveMarket(marketId);
                switch (result) {
                    case (#ok(_)) {
                        Debug.print("Auto-resolved market " # Nat.toText(marketId));
                    };
                    case (#err(error)) {
                        Debug.print("Auto-resolution failed for market " # Nat.toText(marketId) # ": " # error);
                        // Reschedule for retry in 1 hour
                        newSchedule.add((currentTime + 3_600_000_000_000, marketId));
                    };
                };
            } catch (error) {
                Debug.print("Exception in auto-resolution for market " # Nat.toText(marketId));
                // Reschedule for retry
                newSchedule.add((currentTime + 3_600_000_000_000, marketId));
            };
        } else {
            // Keep future scheduled resolutions
            newSchedule.add((scheduledTime, marketId));
        };
    };
    
    resolutionSchedule := newSchedule;
};

// Calculate when market should be resolved
private func calculateResolutionTime(rule: MarketResolutionRule) : Nat64 {
    // Extract resolution time from conditions
    for (condition in rule.conditions.vals()) {
        switch (condition) {
            case (#PriceThreshold(config)) {
                switch (config.timeframe) {
                    case (?#AtTime(timestamp)) { return timestamp };
                    case (_) {};
                };
            };
            case (_) {};
        };
    };
    
    // Default to market expiry + 1 hour grace period
    let marketExpiry = await getMarketExpiry(rule.marketId);
    marketExpiry + 3_600_000_000_000 // 1 hour in nanoseconds
};
```

## 🔍 Example Resolution Scenarios

### 1. Bitcoin Price Resolution

```motoko
// "Will Bitcoin reach $100,000 by end of 2024?"
let bitcoinRule: MarketResolutionRule = {
    marketId = 1;
    marketType = #Binary;
    conditions = [{
        #PriceThreshold({
            symbol = "BTC";
            operator = #GreaterThanOrEqual;
            threshold = 100000.0;
            timeframe = ?#DuringPeriod((
                1704067200000000000, // Jan 1, 2024
                1735689600000000000  // Dec 31, 2024
            ));
        })
    }];
    logic = #AND;
    autoResolve = true;
    disputePeriod = 604800000000000; // 7 days
    fallbackResolver = ?resolver_principal;
};

// Resolution process:
// 1. Fetch BTC price from multiple oracles (Chainlink, Coinbase, etc.)
// 2. Validate data consistency and freshness
// 3. Check if price >= $100,000 during specified period
// 4. If true: resolve as YES, if false: resolve as NO
// 5. Allow 7-day dispute period for challenges
```

### 2. Stock Performance Comparison

```motoko
// "Will Apple (AAPL) outperform Microsoft (MSFT) in 2024?"
let stockComparisonRule: MarketResolutionRule = {
    marketId = 2;
    marketType = #Binary;
    conditions = [
        {
            #CustomLogic({
                conditionId = "stock_performance_comparison";
                parameters = [
                    ("stock_a", "AAPL"),
                    ("stock_b", "MSFT"),
                    ("start_date", "2024-01-01"),
                    ("end_date", "2024-12-31"),
                    ("metric", "percentage_return")
                ];
            })
        }
    ];
    logic = #AND;
    autoResolve = true;
    disputePeriod = 432000000000000; // 5 days
    fallbackResolver = ?resolver_principal;
};

// Custom resolution logic:
// 1. Fetch AAPL and MSFT prices at start and end of period
// 2. Calculate percentage returns for both stocks
// 3. Compare performance: AAPL_return > MSFT_return = YES, else NO
```

### 3. Multi-Condition Weather Market

```motoko
// "Will New York have a hot summer? (>85°F average AND >90°F for 30+ days)"
let weatherRule: MarketResolutionRule = {
    marketId = 3;
    marketType = #Binary;
    conditions = [
        {
            #CustomLogic({
                conditionId = "temperature_average";
                parameters = [
                    ("location", "New York"),
                    ("season", "summer_2024"),
                    ("metric", "average_temp"),
                    ("threshold", "85.0"),
                    ("operator", "greater_than")
                ];
            })
        },
        {
            #CustomLogic({
                conditionId = "hot_days_count";
                parameters = [
                    ("location", "New York"),
                    ("season", "summer_2024"),
                    ("threshold", "90.0"),
                    ("min_days", "30")
                ];
            })
        }
    ];
    logic = #AND; // Both conditions must be true
    autoResolve = true;
    disputePeriod = 259200000000000; // 3 days
    fallbackResolver = ?weather_expert;
};
```

## 🛡️ Security & Fail-Safes

### Oracle Security

```motoko
// Oracle validation and security measures
private func validateOracleResponse(response: OracleResponse) : Bool {
    // Check timestamp freshness (within last hour)
    let currentTime = Nat64.fromNat(Int.abs(Time.now()));
    if (response.timestamp < currentTime - 3600000000000) {
        return false;
    };
    
    // Verify cryptographic signature if available
    switch (response.signature) {
        case (?sig) {
            if (not verifyOracleSignature(response, sig)) {
                return false;
            };
        };
        case (null) {};
    };
    
    // Check confidence score
    if (response.confidence < 0.8) { // Require 80% confidence
        return false;
    };
    
    true
};

// Rate limiting for oracle requests
private stable var oracleRequestCounts : [(Text, (Nat64, Nat))] = [];
private var requestLimits = HashMap.HashMap<Text, (Nat64, Nat)>(10, Text.equal, Text.hash);

private func checkRateLimit(oracleId: Text) : Bool {
    let currentTime = Nat64.fromNat(Int.abs(Time.now()));
    let hourStart = (currentTime / 3600000000000) * 3600000000000;
    
    switch (requestLimits.get(oracleId)) {
        case (null) {
            requestLimits.put(oracleId, (hourStart, 1));
            true
        };
        case (?(lastHour, count)) {
            if (hourStart == lastHour) {
                if (count >= 100) { // Max 100 requests per hour
                    false
                } else {
                    requestLimits.put(oracleId, (hourStart, count + 1));
                    true
                }
            } else {
                requestLimits.put(oracleId, (hourStart, 1));
                true
            }
        };
    }
};

// Fallback resolution mechanism
private func triggerFallbackResolution(marketId: Nat, reason: Text) : async Result.Result<(), Text> {
    switch (resolutionRules.get(marketId)) {
        case (null) { #err("No resolution rule found") };
        case (?rule) {
            switch (rule.fallbackResolver) {
                case (null) { 
                    #err("No fallback resolver configured") 
                };
                case (?fallbackPrincipal) {
                    // Notify fallback resolver to manually resolve market
                    await notifyFallbackResolver(marketId, fallbackPrincipal, reason);
                    
                    // Record fallback trigger in audit log
                    await recordFallbackTrigger(marketId, reason);
                    
                    #ok()
                };
            }
        };
    }
};
```

## 📈 Monitoring & Analytics

### Resolution Metrics

```motoko
public type ResolutionMetrics = {
    totalResolutions: Nat;
    successfulAutoResolutions: Nat;
    fallbackResolutions: Nat;
    disputedResolutions: Nat;
    averageResolutionTime: Float; // Seconds
    oracleReliability: [(Text, Float)]; // Oracle ID -> reliability score
};

// Get resolution statistics
public query func getResolutionMetrics() : async ResolutionMetrics {
    let auditEntries = Iter.toArray(auditLog.vals());
    
    var totalResolutions = 0;
    var autoResolutions = 0;
    var fallbackResolutions = 0;
    var totalResolutionTime: Float = 0.0;
    
    for (entry in auditEntries.vals()) {
        totalResolutions += 1;
        
        switch (entry.resolutionMethod) {
            case (#Automatic) { autoResolutions += 1 };
            case (#Fallback) { fallbackResolutions += 1 };
            case (#Manual) {};
        };
        
        totalResolutionTime += Float.fromInt(Int.fromNat64(
            entry.resolvedAt - entry.scheduledAt
        ));
    };
    
    let disputeCount = disputes.size();
    
    {
        totalResolutions = totalResolutions;
        successfulAutoResolutions = autoResolutions;
        fallbackResolutions = fallbackResolutions;
        disputedResolutions = disputeCount;
        averageResolutionTime = if (totalResolutions > 0) {
            totalResolutionTime / Float.fromInt(totalResolutions) / 1_000_000_000.0
        } else { 0.0 };
        oracleReliability = calculateOracleReliability();
    }
};

// Calculate oracle reliability scores
private func calculateOracleReliability() : [(Text, Float)] {
    var oracleStats = HashMap.HashMap<Text, (Nat, Nat)>(10, Text.equal, Text.hash);
    
    // Analyze oracle performance from audit log
    for (entry in auditLog.vals()) {
        for ((oracleId, success) in entry.oracleResponses.vals()) {
            switch (oracleStats.get(oracleId)) {
                case (null) {
                    oracleStats.put(oracleId, if (success) { (1, 1) } else { (1, 0) });
                };
                case (?(total, successful)) {
                    oracleStats.put(oracleId, (
                        total + 1,
                        if (success) { successful + 1 } else { successful }
                    ));
                };
            }
        };
    };
    
            Iter.toArray(
        Iter.map<(Text, (Nat, Nat)), (Text, Float)>(
            oracleStats.entries(),
            func((oracleId, (total, successful))) = (
                oracleId,
                if (total > 0) { Float.fromInt(successful) / Float.fromInt(total) } else { 0.0 }
            )
        )
    )
};
```

## 🔧 API Reference

### Core Resolution Functions

```motoko
// Register market for automatic resolution
public shared func registerResolutionRule(rule: MarketResolutionRule) 
    : async Result.Result<(), Text>

// Manually trigger market resolution
public shared func resolveMarket(marketId: Nat) 
    : async Result.Result<ResolutionResult, Text>

// Get current resolution status
public query func getResolutionStatus(marketId: Nat) 
    : async Result.Result<ResolutionStatus, Text>

// Update oracle configuration
public shared func updateOracleConfig(config: OracleConfiguration) 
    : async Result.Result<(), Text>
```

### Dispute Management

```motoko
// File dispute against resolution
public shared func fileDispute(marketId: Nat, reason: Text, evidence: [DisputeEvidence]) 
    : async Result.Result<Nat, Text>

// Review dispute (Reviewers only)
public shared func reviewDispute(disputeId: Nat, decision: DisputeDecision, explanation: Text) 
    : async Result.Result<(), Text>

// Get dispute information
public query func getDispute(disputeId: Nat) 
    : async Result.Result<MarketDispute, Text>

// List all disputes for a market
public query func getMarketDisputes(marketId: Nat) 
    : async [MarketDispute]
```

### Oracle Management

```motoko
// Add new oracle source
public shared func addOracleSource(source: OracleSource) 
    : async Result.Result<Text, Text>

// Test oracle connectivity
public func testOracle(oracleId: Text, testParams: TestParameters) 
    : async Result.Result<OracleTestResult, Text>

// Get oracle status and metrics
public query func getOracleStatus(oracleId: Text) 
    : async Result.Result<OracleStatus, Text>

// Disable/Enable oracle source
public shared func setOracleStatus(oracleId: Text, enabled: Bool) 
    : async Result.Result<(), Text>
```

## 🚀 Deployment Guide

### 1. Prerequisites

```bash
# Install required dependencies
dfx extension install nns
npm install @dfinity/agent @dfinity/candid @dfinity/principal

# Set up oracle API keys (environment variables)
export CHAINLINK_API_KEY="your-chainlink-key"
export COINBASE_API_KEY="your-coinbase-key"  
export ALPHAVANTAGE_API_KEY="your-alphavantage-key"
```

### 2. Deploy Resolver Canister

```bash
# Deploy to local network
dfx start --background
dfx deploy resolver

# Deploy to mainnet
dfx deploy --network ic resolver

# Initialize with Markets Canister
dfx canister call resolver setMarketsCanister '(principal "markets-canister-id")'
```

### 3. Configure Oracle Sources

```motoko
// Add Chainlink BTC/USD price feed
let chainlinkBTC = {
    #PriceFeed({
        symbol = "BTC";
        provider = #Chainlink({
            feedId = "BTC_USD";
            network = #Ethereum;
            contractAddress = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
        });
        decimals = 8;
        updateFrequency = 300; // 5 minutes
    })
};

await resolver.addOracleSource(chainlinkBTC);

// Add Coinbase Pro API
let coinbaseAPI = {
    #PriceFeed({
        symbol = "BTC";
        provider = #CoinbaseAPI({
            productId = "BTC-USD";
            apiKey = "your-api-key";
            sandbox = false;
        });
        decimals = 2;
        updateFrequency = 60; // 1 minute
    })
};

await resolver.addOracleSource(coinbaseAPI);
```

### 4. Register Market Resolution Rules

```motoko
// Bitcoin $100k market
let bitcoinMarketRule = {
    marketId = 1;
    marketType = #Binary;
    conditions = [{
        #PriceThreshold({
            symbol = "BTC";
            operator = #GreaterThanOrEqual;
            threshold = 100000.0;
            timeframe = ?#AtTime(1735689600000000000); // Dec 31, 2024
        })
    }];
    logic = #AND;
    autoResolve = true;
    disputePeriod = 604800000000000; // 7 days
    fallbackResolver = ?principal "backup-resolver-id";
};

await resolver.registerResolutionRule(bitcoinMarketRule);
```

## 🧪 Testing Framework

### Unit Tests

```motoko
// Test oracle data validation
import Debug "mo:base/Debug";

// Mock oracle responses for testing
let mockResponses: [OracleResponse] = [
    {
        value = 65000.0;
        timestamp = 1703980800000000000;
        source = #Chainlink({});
        confidence = 0.95;
        signature = null;
    },
    {
        value = 65100.0;
        timestamp = 1703980800000000000;
        source = #CoinbaseAPI({});
        confidence = 0.98;
        signature = null;
    },
    {
        value = 64950.0;
        timestamp = 1703980800000000000;
        source = #AlphaVantage({});
        confidence = 0.92;
        signature = null;
    }
];

// Test median calculation
let result = validateOracleData(mockResponses);
switch (result) {
    case (#ok(median)) {
        assert(median == 65000.0); // Should be middle value
        Debug.print("✅ Oracle validation test passed");
    };
    case (#err(error)) {
        Debug.trap("❌ Oracle validation test failed: " # error);
    };
};

// Test resolution condition evaluation
let priceCondition = #PriceThreshold({
    symbol = "BTC";
    operator = #GreaterThanOrEqual;
    threshold = 60000.0;
    timeframe = null;
});

// Should return true since 65000 >= 60000
let conditionResult = await evaluateCondition(priceCondition);
switch (conditionResult) {
    case (#ok(true)) {
        Debug.print("✅ Price condition test passed");
    };
    case (_) {
        Debug.trap("❌ Price condition test failed");
    };
};
```

### Integration Tests

```bash
# Test oracle connectivity
dfx canister call resolver testOracle '("chainlink_btc", record { symbol = "BTC"; duration = 300 })'

# Test market resolution flow
dfx canister call resolver resolveMarket '(1)'

# Test dispute filing
dfx canister call resolver fileDispute '(
    1,
    "Oracle data seems incorrect",
    vec { 
        record { 
            evidenceType = variant { OracleData };
            data = blob "raw_data_here";
            description = "Alternative price data from exchange";
            timestamp = 1703980800000000000;
            source = "binance.com/api/v3/ticker/price";
        }
    }
)'
```

## 🔍 Monitoring Dashboard

### Real-Time Status Monitoring

```motoko
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

// Get system status for monitoring
public query func getSystemStatus() : async SystemStatus {
    let currentTime = Nat64.fromNat(Int.abs(Time.now()));
    let activeOracles = getActiveOracleCount();
    let pendingCount = resolutionSchedule.size();
    let disputeCount = countOpenDisputes();
    
    // Calculate health score based on various factors
    let health = calculateSystemHealth(activeOracles, pendingCount);
    
    {
        activeOracles = activeOracles;
        pendingResolutions = pendingCount;
        openDisputes = disputeCount;
        systemHealth = health;
        lastHeartbeat = lastHeartbeatTime;
        oracleLatency = getOracleLatencyStats();
    }
};

// Alert system for critical issues
private func checkSystemAlerts() : async () {
    let status = await getSystemStatus();
    
    switch (status.systemHealth) {
        case (#Critical(reason)) {
            await sendCriticalAlert("Resolver system critical: " # reason);
        };
        case (#Degraded(reason)) {
            await sendWarningAlert("Resolver system degraded: " # reason);
        };
        case (#Healthy) {};
    };
    
    // Check for stale data
    let currentTime = Nat64.fromNat(Int.abs(Time.now()));
    if (currentTime - status.lastHeartbeat > 3600000000000) { // 1 hour
        await sendCriticalAlert("Resolver heartbeat missing for over 1 hour");
    };
};
```

## 📊 Economic Model

### Resolution Incentives

```motoko
public type ResolverRewards = {
    baseReward: Nat64;           // Base reward per resolution (satoshis)
    accuracyBonus: Nat64;        // Bonus for undisputed resolutions
    speedBonus: Nat64;           // Bonus for fast resolution
    complexityMultiplier: Float; // Multiplier for complex markets
};

public type DisputePenalties = {
    frivolousDisputeFee: Nat64;  // Fee for rejected disputes
    validDisputeReward: Nat64;   // Reward for successful disputes
    reviewerReward: Nat64;       // Reward for dispute reviewers
};

// Calculate resolver rewards
private func calculateResolverReward(
    marketId: Nat,
    resolutionTime: Nat64,
    wasDisputed: Bool
) : Nat64 {
    let baseReward: Nat64 = 100_000; // 0.001 BTC base reward
    var totalReward = baseReward;
    
    // Accuracy bonus (no successful disputes)
    if (not wasDisputed) {
        totalReward += 50_000; // 0.0005 BTC bonus
    };
    
    // Speed bonus (resolved within 1 hour of eligibility)
    let eligibleTime = await getResolutionEligibilityTime(marketId);
    if (resolutionTime - eligibleTime <= 3600000000000) {
        totalReward += 25_000; // 0.00025 BTC bonus
    };
    
    // Complexity multiplier
    switch (resolutionRules.get(marketId)) {
        case (?rule) {
            let multiplier = calculateComplexityMultiplier(rule);
            totalReward := Nat64.fromNat(
                Float.toInt(Float.fromInt(Nat64.toNat(totalReward)) * multiplier)
            );
        };
        case (null) {};
    };
    
    totalReward
};

// Oracle provider fees
private stable var oracleProviderFees : [(Text, Nat64)] = [
    ("chainlink", 1_000),    // 0.00001 BTC per request
    ("coinbase", 500),       // 0.000005 BTC per request
    ("alphavantage", 100),   // 0.000001 BTC per request
];
```

## 🔐 Security Considerations

### Access Control Matrix

| Role | Register Rules | Resolve Markets | File Disputes | Review Disputes | Manage Oracles |
|------|---------------|-----------------|---------------|-----------------|----------------|
| **Controller** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Markets Canister** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Dispute Reviewer** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Oracle Provider** | ❌ | ❌ | ✅ | ❌ | ⚠️ (Own only) |
| **Public** | ❌ | ❌ | ✅ | ❌ | ❌ |

### Security Best Practices

1. **Oracle Security**
   - Multiple oracle sources for redundancy
   - Cryptographic signature verification
   - Rate limiting and request validation
   - Outlier detection and filtering

2. **Resolution Security** 
   - Time-locked resolution (prevent front-running)
   - Multi-signature requirements for high-value markets
   - Dispute period with economic incentives
   - Audit trail for all resolutions

3. **Access Control**
   - Role-based permissions with principle of least privilege
   - Regular rotation of API keys and credentials
   - Monitoring for unauthorized access attempts
   - Emergency pause functionality

## 🚨 Emergency Procedures

### Circuit Breakers

```motoko
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

private stable var systemState: EmergencyState = #Normal;

// Emergency pause (Controller only)
public shared(msg) func emergencyPause(reason: Text) : async Result.Result<(), Text> {
    if (not Principal.isController(msg.caller)) {
        return #err("Only controller can trigger emergency pause");
    };
    
    systemState := #Paused({
        reason = reason;
        pausedAt = Nat64.fromNat(Int.abs(Time.now()));
        pausedBy = msg.caller;
    });
    
    // Notify all stakeholders
    await broadcastEmergencyNotification(#Paused(reason));
    
    #ok()
};

// Resume operations (Controller only)
public shared(msg) func resumeOperations() : async Result.Result<(), Text> {
    if (not Principal.isController(msg.caller)) {
        return #err("Only controller can resume operations");
    };
    
    systemState := #Normal;
    
    // Resume scheduled resolutions
    await resumeScheduledResolutions();
    
    #ok()
};
```

## 📚 Additional Resources

### Related Documentation
- [Markets Canister Integration Guide](link-to-markets-docs)
- [Oracle Provider API Documentation](link-to-oracle-docs)
- [Dispute Resolution Procedures](link-to-dispute-docs)
- [Security Audit Reports](link-to-audit-reports)

### Community Resources
- [Developer Discord](discord-link)
- [GitHub Discussions](github-discussions-link)
- [Oracle Provider Registry](registry-link)
- [Resolution Templates](templates-link)

---

## 🤝 Contributing

We welcome contributions to improve the Resolver Canister:

1. **Oracle Integrations**: Add support for new data sources
2. **Resolution Logic**: Implement new condition types and logic
3. **Security Improvements**: Enhance validation and fail-safes
4. **Documentation**: Improve guides and examples

### Development Setup

```bash
git clone <resolver-repo>
cd resolver-canister
npm install
dfx start --background
dfx deploy --argument '(record { 
    markets_canister = principal "your-markets-canister-id";
    initial_oracles = vec {};
})'
```

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

**Built with 🔮 for decentralized prediction markets on the Internet Computer**