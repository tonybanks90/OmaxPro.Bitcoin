import { Actor, HttpAgent } from "@dfinity/agent";
import { readFileSync } from "fs";
import path from "path";
import fetch from "node-fetch";
import { createGzip } from "zlib";
import { promisify } from "util";

// Polyfill for global fetch
global.fetch = fetch;

// === CONFIGURATION ===
const canisterId = "uxrrr-q7777-77774-qaaaq-cai"; // your TokenFactory canister
const wasmFilePath = "/mnt/c/Users/user/OmaxPro.Bitcoin/icrc1_ledger.wasm.gz";

// Try multiple endpoints in order of preference
const endpoints = [
  "http://127.0.0.1:4943", // Local replica (if running)
  "https://ic0.app", // Primary IC boundary node
  "https://icp0.io",  // Alternative boundary node
  "http://127.0.0.1:4943", // Local replica (if running)
];

// Enhanced Candid interface for TokenFactory with proper metadata support
const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const Result = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
  
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  
  const LogoData = IDL.Variant({
    ImageUrl: IDL.Text,
    ImageBlob: IDL.Vec(IDL.Nat8),
  });
  
  const TokenMetadata = IDL.Record({
    name: IDL.Text,
    symbol: IDL.Text,
    decimals: IDL.Nat8,
    fee: IDL.Nat,
    logo: LogoData,
    description: IDL.Text,
    created_at: IDL.Int,
    total_supply: IDL.Nat,
    minting_account: Account,
  });

  // Enhanced market types
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

  const MarketType = IDL.Variant({
    Binary: IDL.Null,
    MultipleChoice: IDL.Record({ outcomes: IDL.Vec(IDL.Text) }),
    Compound: IDL.Record({ subjects: IDL.Vec(IDL.Text) }),
  });

  const BinaryTokens = IDL.Record({
    yesLedger: IDL.Principal,
    noLedger: IDL.Principal,
  });

  const MultipleChoiceTokens = IDL.Record({
    outcomeLedgers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Principal)),
  });

  const CompoundTokens = IDL.Record({
    subjectTokens: IDL.Vec(IDL.Tuple(IDL.Text, BinaryTokens)),
  });

  const MarketTokens = IDL.Variant({
    Binary: BinaryTokens,
    MultipleChoice: MultipleChoiceTokens,
    Compound: CompoundTokens,
  });

  const MarketInfo = IDL.Record({
    id: IDL.Nat,
    metadata: MarketMetadata,
    marketType: MarketType,
    tokens: MarketTokens,
  });

  // Market creation arguments
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
  });

  const CreateMultipleChoiceMarketArgs = IDL.Record({
    title: IDL.Text,
    description: IDL.Text,
    category: Category,
    image: ImageData,
    tags: IDL.Vec(Tag),
    outcomes: IDL.Vec(IDL.Text),
    bettingCloseTime: IDL.Int,
    expirationTime: IDL.Int,
    resolutionLink: IDL.Text,
    resolutionDescription: IDL.Text,
  });

  const CreateCompoundMarketArgs = IDL.Record({
    title: IDL.Text,
    description: IDL.Text,
    category: Category,
    image: ImageData,
    tags: IDL.Vec(Tag),
    subjects: IDL.Vec(IDL.Text),
    bettingCloseTime: IDL.Int,
    expirationTime: IDL.Int,
    resolutionLink: IDL.Text,
    resolutionDescription: IDL.Text,
  });

  // Legacy support
  const CreateMarketArgs = IDL.Record({
    question: IDL.Text,
  });

  return IDL.Service({
    // Admin functions
    uploadWasm: IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    hasWasm: IDL.Func([], [IDL.Bool], ["query"]),
    
    // Market creation functions
    createBinaryMarket: IDL.Func([CreateBinaryMarketArgs], [Result], []),
    createMultipleChoiceMarket: IDL.Func([CreateMultipleChoiceMarketArgs], [Result], []),
    createCompoundMarket: IDL.Func([CreateCompoundMarketArgs], [Result], []),
    createMarket: IDL.Func([CreateMarketArgs], [Result], []), // Legacy
    
    // Query functions
    getMarketInfo: IDL.Func([IDL.Nat], [IDL.Opt(MarketInfo)], ["query"]),
    getAllMarkets: IDL.Func([], [IDL.Vec(MarketInfo)], ["query"]),
    getMarketsByCategory: IDL.Func([Category], [IDL.Vec(MarketInfo)], ["query"]),
    getMarketsByCreator: IDL.Func([IDL.Principal], [IDL.Vec(MarketInfo)], ["query"]),
    getMarketsByTag: IDL.Func([Tag], [IDL.Vec(MarketInfo)], ["query"]),
    getActiveMarkets: IDL.Func([], [IDL.Vec(MarketInfo)], ["query"]),
    getExpiredMarkets: IDL.Func([], [IDL.Vec(MarketInfo)], ["query"]),
    getMarketsByType: IDL.Func([MarketType], [IDL.Vec(MarketInfo)], ["query"]),
    getMarketCount: IDL.Func([], [IDL.Nat], ["query"]),
    getMarketCountByType: IDL.Func([], [IDL.Record({
      binary: IDL.Nat,
      multipleChoice: IDL.Nat,
      compound: IDL.Nat,
    })], ["query"]),
    getMarketCountByCategory: IDL.Func([], [IDL.Vec(IDL.Tuple(Category, IDL.Nat))], ["query"]),
    
    // Token functions
    getAllTokenMetadata: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Principal, TokenMetadata))],
      ["query"]
    ),
    getTokenMetadata: IDL.Func([IDL.Principal], [IDL.Opt(TokenMetadata)], ["query"]),
    getCreatedTokens: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    getMarketTokens: IDL.Func([IDL.Nat], [IDL.Opt(IDL.Vec(IDL.Principal))], ["query"]),
    
    // Factory info
    getFactoryPrincipal: IDL.Func([], [IDL.Principal], ["query"]),
    getCreatedCanisters: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
  });
};

// WASM format detection and processing utilities
function isGzipped(buffer) {
  // Check for gzip magic numbers (1f 8b)
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

function isWasm(buffer) {
  // Check for WASM magic numbers (00 61 73 6d)
  return buffer.length >= 4 && 
         buffer[0] === 0x00 && 
         buffer[1] === 0x61 && 
         buffer[2] === 0x73 && 
         buffer[3] === 0x6d;
}

async function processWasmFile(filePath) {
  console.log(`Reading file: ${filePath}`);
  const fileBuffer = readFileSync(path.resolve(filePath));
  
  console.log(`File size: ${fileBuffer.length} bytes`);
  console.log(`Detecting file format...`);
  
  let wasmBuffer = fileBuffer;
  
  if (isGzipped(fileBuffer)) {
    console.log("File is gzipped - using as is");
  } else if (isWasm(fileBuffer)) {
    console.log("File is uncompressed WASM - compressing with gzip...");
    
    // Compress with gzip
    const gzip = createGzip({ level: 9 }); // Maximum compression
    const gzipAsync = promisify(gzip._transform.bind(gzip));
    
    const chunks = [];
    gzip.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      gzip.on('end', () => {
        const compressed = Buffer.concat(chunks);
        console.log(`Compressed from ${fileBuffer.length} to ${compressed.length} bytes`);
        resolve(new Uint8Array(compressed));
      });
      
      gzip.on('error', reject);
      gzip.write(fileBuffer);
      gzip.end();
    });
  } else {
    console.log("File format unknown - trying multiple approaches...");
    
    // Try treating as uncompressed WASM first
    console.log("Attempting to compress as WASM...");
    try {
      const gzip = createGzip({ level: 9 });
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        gzip.on('data', chunk => chunks.push(chunk));
        gzip.on('end', () => {
          const compressed = Buffer.concat(chunks);
          console.log(`Force-compressed from ${fileBuffer.length} to ${compressed.length} bytes`);
          resolve(new Uint8Array(compressed));
        });
        gzip.on('error', reject);
        
        gzip.write(fileBuffer);
        gzip.end();
      });
    } catch (error) {
      console.error("Compression failed:", error.message);
      throw new Error("Unable to process WASM file. Please ensure it's either a valid uncompressed WASM or properly gzipped file.");
    }
  }
  
  return new Uint8Array(wasmBuffer);
}

async function createAgent(hostUrl) {
  const agent = new HttpAgent({ 
    host: hostUrl,
    fetch: fetch,
  });

  // Only fetch root key for local development
  if (hostUrl.includes("127.0.0.1") || hostUrl.includes("localhost")) {
    try {
      await agent.fetchRootKey();
      console.log("Root key fetched for local development");
    } catch (err) {
      console.warn("Failed to fetch root key:", err.message);
    }
  }

  return agent;
}

async function testConnection(agent, canisterId) {
  try {
    const tokenFactory = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });

    // Test with a simple query call
    await tokenFactory.hasWasm();
    return tokenFactory;
  } catch (error) {
    throw new Error(`Connection test failed: ${error.message}`);
  }
}

// Helper function to get future timestamp
function hoursFromNow(hours) {
  return BigInt(Date.now() * 1000000) + BigInt(hours * 60 * 60 * 1000000000);
}

const uploadWasm = async () => {
  let tokenFactory = null;
  let workingEndpoint = null;

  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const agent = await createAgent(endpoint);
      tokenFactory = await testConnection(agent, canisterId);
      workingEndpoint = endpoint;
      console.log(`Connected successfully to: ${endpoint}`);
      break;
    } catch (error) {
      console.log(`Failed to connect to ${endpoint}: ${error.message}`);
      continue;
    }
  }

  if (!tokenFactory) {
    console.error("Could not connect to any IC endpoint. Check your network connection.");
    return;
  }

  try {
    // Check if WASM already exists
    console.log("Checking if WASM is already uploaded...");
    const hasWasm = await tokenFactory.hasWasm();
    if (hasWasm) {
      console.log("WASM already uploaded. Skipping upload.");
    } else {
      // Process the WASM file with format detection
      const wasmBlob = await processWasmFile(wasmFilePath);

      console.log(`Uploading processed WASM (${wasmBlob.length} bytes) to ${canisterId} via ${workingEndpoint}...`);
      console.log("This may take a while for large files...");

      const result = await tokenFactory.uploadWasm(wasmBlob);

      if ("ok" in result) {
        console.log("WASM Upload Success:", result.ok);
      } else if ("err" in result) {
        console.error("WASM Upload Error:", result.err);
        return;
      }
    }

    // Verify upload and show factory info
    console.log("\nFactory Status:");
    const factoryPrincipal = await tokenFactory.getFactoryPrincipal();
    const marketCount = await tokenFactory.getMarketCount();
    const tokens = await tokenFactory.getAllTokenMetadata();
    const marketStats = await tokenFactory.getMarketCountByType();
    const categoryStats = await tokenFactory.getMarketCountByCategory();
    
    console.log(`Factory Principal: ${factoryPrincipal}`);
    console.log(`Total Markets: ${marketCount}`);
    console.log(`Binary Markets: ${marketStats.binary}`);
    console.log(`Multiple Choice Markets: ${marketStats.multipleChoice}`);
    console.log(`Compound Markets: ${marketStats.compound}`);
    console.log(`Total Tokens: ${tokens.length}`);
    console.log(`WASM Status: ${await tokenFactory.hasWasm() ? "Uploaded" : "Missing"}`);

    if (categoryStats.length > 0) {
      console.log("\nMarkets by Category:");
      categoryStats.forEach(([category, count]) => {
        const categoryName = Object.keys(category)[0];
        console.log(`  ${categoryName}: ${count} markets`);
      });
    }

    if (tokens.length > 0) {
      console.log("\nExisting Tokens:");
      tokens.slice(0, 5).forEach(([principal, metadata], index) => {
        console.log(`  ${index + 1}. ${metadata.name} (${metadata.symbol})`);
        console.log(`     Principal: ${principal}`);
        console.log(`     Description: ${metadata.description}`);
      });
      if (tokens.length > 5) {
        console.log(`  ... and ${tokens.length - 5} more tokens`);
      }
    }

    // Test market creation if WASM is available
    if (await tokenFactory.hasWasm()) {
      await testEnhancedMarketCreation(tokenFactory);
    }

  } catch (error) {
    console.error("Operation failed:", error);
    
    // More specific error handling
    if (error.message?.includes("Canister trapped")) {
      console.log("The canister may have trapped. Check canister logs or try a smaller file.");
    } else if (error.message?.includes("out of cycles")) {
      console.log("The canister may be out of cycles. Top up the canister with cycles.");
    } else if (error.message?.includes("not enough memory")) {
      console.log("The canister may not have enough memory. Try upgrading with more memory.");
    } else if (error.message?.includes("Input must be either gzipped or uncompressed WASM")) {
      console.log("WASM format issue detected. Try the troubleshooting steps:");
      console.log("   1. Verify your WASM file is valid");
      console.log("   2. Try downloading the official ICRC-1 ledger WASM");
      console.log("   3. Check if the file was corrupted during transfer");
    }
  }
};

// Enhanced test market creation function
const testEnhancedMarketCreation = async (tokenFactory) => {
  try {
    console.log("\nTesting enhanced market creation...");
    
    // Test 1: Binary Market with full metadata
    console.log("1. Creating Binary Market...");
    const binaryResult = await tokenFactory.createBinaryMarket({
      title: "Will Bitcoin reach $100k by end of 2024?",
      description: "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange before January 1, 2025.",
      category: { Crypto: null },
      image: { ImageUrl: "https://example.com/bitcoin-chart.png" },
      tags: [{ Crypto: null }],
      bettingCloseTime: hoursFromNow(720), // 30 days
      expirationTime: hoursFromNow(2160), // 90 days  
      resolutionLink: "https://coinmarketcap.com/currencies/bitcoin/",
      resolutionDescription: "Market resolves based on CoinMarketCap price data"
    });

    if ("ok" in binaryResult) {
      const marketId = binaryResult.ok;
      console.log(`   Binary market created! ID: ${marketId}`);
      
      // Get market info
      const marketInfo = await tokenFactory.getMarketInfo(marketId);
      if (marketInfo && marketInfo.length > 0) {
        const info = marketInfo[0];
        console.log(`   Title: ${info.metadata.title}`);
        console.log(`   Creator: ${info.metadata.creator}`);
        if ("Binary" in info.tokens) {
          console.log(`   YES Token: ${info.tokens.Binary.yesLedger}`);
          console.log(`   NO Token: ${info.tokens.Binary.noLedger}`);
        }
      }
    } else {
      console.error("   Binary market creation failed:", binaryResult.err);
    }

    // Test 2: Multiple Choice Market
    console.log("\n2. Creating Multiple Choice Market...");
    const multipleChoiceResult = await tokenFactory.createMultipleChoiceMarket({
      title: "Who will win the 2024 US Presidential Election?",
      description: "This market will resolve to the candidate who wins the 2024 United States Presidential Election.",
      category: { Political: null },
      image: { ImageUrl: "https://example.com/election-2024.png" },
      tags: [{ Political: null }],
      outcomes: ["Donald Trump", "Joe Biden", "Other"],
      bettingCloseTime: hoursFromNow(1440), // 60 days
      expirationTime: hoursFromNow(2880), // 120 days
      resolutionLink: "https://www.fec.gov/",
      resolutionDescription: "Market resolves based on official FEC results"
    });

    if ("ok" in multipleChoiceResult) {
      const marketId = multipleChoiceResult.ok;
      console.log(`   Multiple choice market created! ID: ${marketId}`);
    } else {
      console.error("   Multiple choice market creation failed:", multipleChoiceResult.err);
    }

    // Test 3: Legacy market creation (backward compatibility)
    console.log("\n3. Testing legacy market creation...");
    const legacyResult = await tokenFactory.createMarket({
      question: "Will AI achieve AGI by 2030?"
    });

    if ("ok" in legacyResult) {
      const marketId = legacyResult.ok;
      console.log(`   Legacy market created! ID: ${marketId}`);
    } else {
      console.error("   Legacy market creation failed:", legacyResult.err);
    }

    // Show updated statistics
    console.log("\n4. Updated Factory Statistics:");
    const newMarketCount = await tokenFactory.getMarketCount();
    const newMarketStats = await tokenFactory.getMarketCountByType();
    
    console.log(`   Total Markets: ${newMarketCount}`);
    console.log(`   Binary Markets: ${newMarketStats.binary}`);
    console.log(`   Multiple Choice Markets: ${newMarketStats.multipleChoice}`);
    console.log(`   Compound Markets: ${newMarketStats.compound}`);

    // Test query functions
    console.log("\n5. Testing query functions...");
    const activeMarkets = await tokenFactory.getActiveMarkets();
    console.log(`   Active Markets: ${activeMarkets.length}`);
    
    const cryptoMarkets = await tokenFactory.getMarketsByCategory({ Crypto: null });
    console.log(`   Crypto Category Markets: ${cryptoMarkets.length}`);

  } catch (error) {
    console.error("Enhanced market creation test failed:", error.message);
  }
};

const main = async () => {
  console.log("Starting TokenFactory WASM Upload Process");
  console.log("=".repeat(50));
  
  await uploadWasm();
  
  console.log("\n" + "=".repeat(50));
  console.log("Upload process completed!");
};

// Add error handling for the main process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main().catch(console.error);