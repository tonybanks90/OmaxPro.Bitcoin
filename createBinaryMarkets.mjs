import { Actor, HttpAgent } from "@dfinity/agent";
import fetch from "node-fetch";
import util from "util";

// Polyfill for global fetch
global.fetch = fetch;

// Override console.log to prevent large object dumps
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const sanitized = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      const str = util.inspect(arg, { depth: 2, maxArrayLength: 5 });
      if (str.length > 500) {
        return '[Large Object - truncated]';
      }
      return str;
    }
    return arg;
  });
  originalLog(...sanitized);
};

console.error = (...args) => {
  const sanitized = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      if (arg.message) return arg.message;
      const str = util.inspect(arg, { depth: 1, maxArrayLength: 0 });
      if (str.length > 500) {
        return '[Error Object - see message above]';
      }
      return str;
    }
    return arg;
  });
  originalError(...sanitized);
};

// === CONFIGURATION ===
const canisterId = "vg3po-ix777-77774-qaafa-cai";
const endpoint = "http://127.0.0.1:4943";

// Candid interface
const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const Result = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
  
  const Category = IDL.Variant({
    Runes: IDL.Null,
    Stocks: IDL.Null,
    Political: IDL.Null,
    Sports: IDL.Null,
    Entertainment: IDL.Null,
    Technology: IDL.Null,
    Crypto: IDL.Null,
    AI: IDL.Null,
  });

  const Tag = IDL.Variant({
    web2: IDL.Null,
    AI: IDL.Null,
    Sports: IDL.Null,
    Crypto: IDL.Null,
    Political: IDL.Null,
    Technology: IDL.Null,
    Entertainment: IDL.Null,
    Runes: IDL.Null,
  });

  const ImageData = IDL.Variant({
    ImageUrl: IDL.Text,
    ImageBlob: IDL.Vec(IDL.Nat8),
  });

  const MarketMetadata = IDL.Record({
    title: IDL.Text,
    description: IDL.Text,
    category: Category,
    creator: IDL.Principal,
    image: ImageData,
    tags: IDL.Vec(Tag),
    bettingCloseTime: IDL.Int,
    expirationTime: IDL.Int,
    resolutionLink: IDL.Text,
    resolutionDescription: IDL.Text,
    created_at: IDL.Int,
  });

  const BinaryTokens = IDL.Record({
    yesLedger: IDL.Principal,
    noLedger: IDL.Principal,
  });

  const MarketType = IDL.Variant({
    Binary: IDL.Null,
    MultipleChoice: IDL.Record({ outcomes: IDL.Vec(IDL.Text) }),
    Compound: IDL.Record({ subjects: IDL.Vec(IDL.Text) }),
  });

  const MarketTokens = IDL.Variant({
    Binary: BinaryTokens,
    MultipleChoice: IDL.Record({ outcomeLedgers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Principal)) }),
    Compound: IDL.Record({ subjectTokens: IDL.Vec(IDL.Tuple(IDL.Text, BinaryTokens)) }),
  });

  const MarketInfo = IDL.Record({
    id: IDL.Nat,
    metadata: MarketMetadata,
    marketType: MarketType,
    tokens: MarketTokens,
    registeredInMarkets: IDL.Bool,
  });

  const CreateBinaryMarketArgs = IDL.Record({
    title: IDL.Text,
    description: IDL.Text,
    category: Category,
    image: ImageData,
    tags: IDL.Vec(Tag),
    bettingCloseTime: IDL.Int,
    expirationTime: IDL.Int,
    resolutionLink: IDL.Text,
    resolutionDescription: IDL.Text,
    resolver: IDL.Principal,
    liquidityParameter: IDL.Float64,
    totalSupply: IDL.Nat64,
  });

  return IDL.Service({
    hasWasm: IDL.Func([], [IDL.Bool], ["query"]),
    createBinaryMarket: IDL.Func([CreateBinaryMarketArgs], [Result], []),
    getMarketInfo: IDL.Func([IDL.Nat], [IDL.Opt(MarketInfo)], ["query"]),
    getMarketCount: IDL.Func([], [IDL.Nat], ["query"]),
    getCycleBalance: IDL.Func([], [IDL.Nat], ["query"]),
    getMarketsCanister: IDL.Func([], [IDL.Opt(IDL.Principal)], ["query"]),
    getCreatedTokens: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    getAllMarkets: IDL.Func([], [IDL.Vec(MarketInfo)], ["query"]),
  });
};

// Market definitions
const markets = [
  {
    title: "Will Bitcoin reach $150k by end of 2025?",
    description: "This market resolves to YES if Bitcoin reaches $150,000 USD on any major exchange before December 31, 2025.",
    category: { Crypto: null },
    image: { ImageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
    tags: [{ Crypto: null }],
    resolutionLink: "https://coinmarketcap.com/currencies/bitcoin/",
    resolutionDescription: "Resolved based on CoinMarketCap data",
  },
  {
    title: "Will Ethereum reach $5k by end of 2025?",
    description: "This market resolves to YES if Ethereum reaches $5,000 USD on any major exchange before December 31, 2025.",
    category: { Crypto: null },
    image: { ImageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    tags: [{ Crypto: null }, { Technology: null }],
    resolutionLink: "https://coinmarketcap.com/currencies/ethereum/",
    resolutionDescription: "Resolved based on CoinMarketCap data",
  },
  {
    title: "Will AI surpass human-level reasoning by 2026?",
    description: "This market resolves to YES if a publicly recognized AI system demonstrates human-level reasoning capabilities.",
    category: { AI: null },
    image: { ImageUrl: "https://example.com/ai.png" },
    tags: [{ AI: null }, { Technology: null }],
    resolutionLink: "https://openai.com/",
    resolutionDescription: "Resolved based on expert consensus and published benchmarks",
  },
  {
    title: "Will Tesla stock reach $300 by end of 2025?",
    description: "This market resolves to YES if Tesla stock reaches $300 USD before December 31, 2025.",
    category: { Stocks: null },
    image: { ImageUrl: "https://example.com/tesla.png" },
    tags: [{ Technology: null }],
    resolutionLink: "https://finance.yahoo.com/quote/TSLA/",
    resolutionDescription: "Resolved based on Yahoo Finance closing price",
  },
  {
    title: "Will there be a major earthquake (magnitude 7.5+) in 2025?",
    description: "This market resolves to YES if the USGS reports a magnitude 7.5 or higher earthquake anywhere on Earth in 2025.",
    category: { Technology: null },
    image: { ImageUrl: "https://example.com/earthquake.png" },
    tags: [{ web2: null }],
    resolutionLink: "https://earthquake.usgs.gov/",
    resolutionDescription: "Resolved based on USGS Earthquake Hazards Program data",
  },
];

function hoursFromNow(hours) {
  return BigInt(Date.now() * 1000000) + BigInt(hours * 60 * 60 * 1000000000);
}

function formatCycles(cycles) {
  const trillion = 1_000_000_000_000;
  return (Number(cycles) / trillion).toFixed(2) + 'T';
}

async function createAgent() {
  const agent = new HttpAgent({ 
    host: endpoint,
    fetch: fetch,
  });

  try {
    await agent.fetchRootKey();
    return agent;
  } catch (err) {
    throw new Error(`Failed to connect: ${err.message}`);
  }
}

async function main() {
  const report = {
    timestamp: new Date().toISOString(),
    canisterId: canisterId,
    endpoint: endpoint,
    marketsCreated: [],
    errors: [],
    summary: {}
  };

  try {
    originalLog("\n" + "=".repeat(70));
    originalLog("Test Multiple Binary Markets Creation");
    originalLog("=".repeat(70));

    // Connect
    const agent = await createAgent();
    const callerPrincipal = await agent.getPrincipal();
    originalLog(`Connected to local replica`);
    originalLog(`Caller: ${callerPrincipal.toString()}\n`);
    report.caller = callerPrincipal.toString();

    // Create actor
    const tokenFactory = Actor.createActor(idlFactory, { agent, canisterId });

    // Check prerequisites
    const hasWasm = await tokenFactory.hasWasm();
    const marketsCanister = await tokenFactory.getMarketsCanister();
    const cycleBalance = await tokenFactory.getCycleBalance();
    const initialMarkets = await tokenFactory.getMarketCount();

    originalLog(`Prerequisites:`);
    originalLog(`  WASM: ${hasWasm ? "✓" : "✗"}`);
    originalLog(`  Markets canister: ${marketsCanister.length > 0 ? "✓" : "✗"}`);
    originalLog(`  Cycles: ${formatCycles(cycleBalance)}`);
    originalLog(`  Initial markets: ${initialMarkets}\n`);

    if (!hasWasm || marketsCanister.length === 0) {
      throw new Error("Missing prerequisites (WASM or Markets canister)");
    }

    // Create markets
    originalLog("Creating markets:");
    let cyclesUsedTotal = BigInt(0);
    let successCount = 0;

    for (let i = 0; i < markets.length; i++) {
      const marketData = markets[i];
      originalLog(`\n  [${i + 1}/${markets.length}] ${marketData.title}`);

      try {
        const balanceBefore = await tokenFactory.getCycleBalance();
        
        const marketArgs = {
          title: marketData.title,
          description: marketData.description,
          category: marketData.category,
          image: marketData.image,
          tags: marketData.tags,
          bettingCloseTime: hoursFromNow(720),
          expirationTime: hoursFromNow(2160),
          resolutionLink: marketData.resolutionLink,
          resolutionDescription: marketData.resolutionDescription,
          resolver: callerPrincipal,
          liquidityParameter: 100.0,
          totalSupply: BigInt(1_000_000_000_000),
        };

        const startTime = Date.now();
        const result = await tokenFactory.createBinaryMarket(marketArgs);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if ("ok" in result) {
          const marketId = result.ok;
          const balanceAfter = await tokenFactory.getCycleBalance();
          const cyclesUsed = balanceBefore - balanceAfter;
          cyclesUsedTotal += cyclesUsed;
          successCount++;

          originalLog(`    ✓ ID: ${marketId} (${elapsed}s, ${formatCycles(cyclesUsed)} cycles used)`);

          const info = await tokenFactory.getMarketInfo(marketId);
          if (info && info.length > 0) {
            const m = info[0];
            report.marketsCreated.push({
              id: Number(marketId),
              title: marketData.title,
              yesToken: m.tokens.Binary.yesLedger.toString(),
              noToken: m.tokens.Binary.noLedger.toString(),
              registered: m.registeredInMarkets,
              creationTime: elapsed + "s",
              cyclesUsed: Number(cyclesUsed),
            });
          }
        } else {
          originalLog(`    ✗ Error: ${result.err}`);
          report.errors.push({ market: marketData.title, error: result.err });
        }
      } catch (error) {
        originalLog(`    ✗ Exception: ${error.message}`);
        report.errors.push({ market: marketData.title, error: error.message });
      }
    }

    // Final stats
    const finalMarkets = await tokenFactory.getMarketCount();
    const finalBalance = await tokenFactory.getCycleBalance();
    const totalCyclesUsed = cycleBalance - finalBalance;

    originalLog("\n" + "=".repeat(70));
    originalLog("SUMMARY");
    originalLog("=".repeat(70));
    originalLog(`Markets created: ${successCount}/${markets.length}`);
    originalLog(`Total markets: ${finalMarkets}`);
    originalLog(`Cycles used: ${formatCycles(totalCyclesUsed)}`);
    originalLog(`Cycles remaining: ${formatCycles(finalBalance)}`);
    originalLog("=".repeat(70) + "\n");

    report.summary = {
      marketsCreated: successCount,
      totalMarkets: Number(finalMarkets),
      cyclesUsed: Number(totalCyclesUsed),
      cyclesRemaining: Number(finalBalance),
      errors: report.errors.length,
    };

  } catch (error) {
    originalError(`\nFatal error: ${error.message}`);
    report.errors.push({ fatal: true, error: error.message });
  }

  // Print report
  originalLog(JSON.stringify(report, null, 2));

  if (report.errors.length > 0 && report.marketsCreated.length === 0) {
    process.exit(1);
  }
}

main().catch(error => {
  originalError("Fatal:", error.message || String(error));
  process.exit(1);
});