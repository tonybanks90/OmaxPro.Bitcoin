import { Actor, HttpAgent } from "@dfinity/agent";
import { readFileSync } from "fs";
import path from "path";
import fetch from "node-fetch";
import { createGzip } from "zlib";
import { promisify } from "util";

// Polyfill for global fetch
global.fetch = fetch;

// ===== CONFIGURATION =====
const canisterId = "uxrrr-q7777-77774-qaaaq-cai"; // your TokenFactory canister
const wasmFilePath = "/mnt/c/Users/user/OmaxPro.Bitcoin/icrc1_ledger.wasm.gz";
const marketsCanisterId = "z7chj-7qaaa-aaaab-qacbq-cai"; // Your Markets canister ID

// Function to validate canister ID format
function isValidCanisterId(canisterId) {
  // Basic canister ID validation - should be 27 characters with specific pattern
  const canisterIdPattern = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/;
  return canisterIdPattern.test(canisterId);
}

// Try multiple endpoints in order of preference
const endpoints = [
  "http://127.0.0.1:4943", // Local replica (if running)
  "https://ic0.app", // Primary IC boundary node
  "https://icp0.io",  // Alternative boundary node
];

// Enhanced Candid interface for TokenFactory with all new features
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
    creationFeeBlockIndex: IDL.Opt(IDL.Nat),
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

  // Fee system types
  const FeeInfo = IDL.Record({
    feeSats: IDL.Nat,
    transferFeeSats: IDL.Nat,
    totalRequired: IDL.Nat,
    ledgerCanister: IDL.Text,
  });

  const FeeStats = IDL.Record({
    totalCollected: IDL.Nat,
    availableForWithdrawal: IDL.Nat,
    totalMarketsCreated: IDL.Nat,
    averageFeePerMarket: IDL.Nat,
  });

  const SystemStatus = IDL.Record({
    marketsCanisterSet: IDL.Bool,
    marketCreationEnabled: IDL.Bool,
    network: IDL.Text,
    ledgerCanister: IDL.Text,
    hasWasm: IDL.Bool,
    adminSet: IDL.Bool,
  });

  // Legacy support
  const CreateMarketArgs = IDL.Record({
    question: IDL.Text,
  });

  return IDL.Service({
    // Admin functions
    uploadWasm: IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    hasWasm: IDL.Func([], [IDL.Bool], ["query"]),
    setAdmin: IDL.Func([IDL.Principal], [Result_1], []),
    setMarketsCanister: IDL.Func([IDL.Principal], [Result_1], []),
    getMarketsCanister: IDL.Func([], [IDL.Opt(IDL.Principal)], ["query"]),
    setNetwork: IDL.Func([IDL.Bool], [Result_1], []),
    setMarketCreationEnabled: IDL.Func([IDL.Bool], [Result_1], []),
    getSystemStatus: IDL.Func([], [SystemStatus], ["query"]),
    
    // Cycle management
    getCycleBalance: IDL.Func([], [IDL.Nat], ["query"]),
    acceptCycles: IDL.Func([], [IDL.Nat], []),
    canCreateMarket: IDL.Func([IDL.Nat], [IDL.Record({
      canCreate: IDL.Bool,
      currentBalance: IDL.Nat,
      requiredCycles: IDL.Nat,
    })], ["query"]),
    
    // Fee system
    getMarketCreationFee: IDL.Func([], [FeeInfo], ["query"]),
    checkUserAllowance: IDL.Func([IDL.Principal], [IDL.Nat], []),
    getCollectedFees: IDL.Func([], [FeeStats], ["query"]),
    getFeeCollectionAccount: IDL.Func([], [Account], ["query"]),
    withdrawCollectedFees: IDL.Func([Account, IDL.Opt(IDL.Nat)], [Result], []),
    getUserFeePayments: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    getMarketFeeBlockIndex: IDL.Func([IDL.Nat], [IDL.Opt(IDL.Nat)], ["query"]),
    
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
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

function isWasm(buffer) {
  return buffer.length >= 4 && 
         buffer[0] === 0x00 && 
         buffer[1] === 0x61 && 
         buffer[2] === 0x73 && 
         buffer[3] === 0x6d;
}

async function processWasmFile(filePath) {
  console.log(`📁 Reading file: ${filePath}`);
  const fileBuffer = readFileSync(path.resolve(filePath));
  
  console.log(`📊 File size: ${fileBuffer.length.toLocaleString()} bytes`);
  console.log(`🔍 Detecting file format...`);
  
  let wasmBuffer = fileBuffer;
  
  if (isGzipped(fileBuffer)) {
    console.log("✅ File is gzipped - using as is");
  } else if (isWasm(fileBuffer)) {
    console.log("🔄 File is uncompressed WASM - compressing with gzip...");
    
    const gzip = createGzip({ level: 9 });
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      gzip.on('data', chunk => chunks.push(chunk));
      gzip.on('end', () => {
        const compressed = Buffer.concat(chunks);
        console.log(`✅ Compressed from ${fileBuffer.length.toLocaleString()} to ${compressed.length.toLocaleString()} bytes`);
        resolve(new Uint8Array(compressed));
      });
      gzip.on('error', reject);
      gzip.write(fileBuffer);
      gzip.end();
    });
  } else {
    console.log("❓ File format unknown - attempting compression...");
    try {
      const gzip = createGzip({ level: 9 });
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        gzip.on('data', chunk => chunks.push(chunk));
        gzip.on('end', () => {
          const compressed = Buffer.concat(chunks);
          console.log(`🔧 Force-compressed from ${fileBuffer.length.toLocaleString()} to ${compressed.length.toLocaleString()} bytes`);
          resolve(new Uint8Array(compressed));
        });
        gzip.on('error', reject);
        
        gzip.write(fileBuffer);
        gzip.end();
      });
    } catch (error) {
      console.error("❌ Compression failed:", error.message);
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

  if (hostUrl.includes("127.0.0.1") || hostUrl.includes("localhost")) {
    try {
      await agent.fetchRootKey();
      console.log("🔐 Root key fetched for local development");
    } catch (err) {
      console.warn("⚠️ Failed to fetch root key:", err.message);
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

    await tokenFactory.hasWasm();
    return tokenFactory;
  } catch (error) {
    throw new Error(`Connection test failed: ${error.message}`);
  }
}

function hoursFromNow(hours) {
  return BigInt(Date.now() * 1000000) + BigInt(hours * 60 * 60 * 1000000000);
}

function formatPrincipal(principal) {
  const str = principal.toString();
  return str.length > 20 ? `${str.slice(0, 8)}...${str.slice(-8)}` : str;
}

async function setupFactory(tokenFactory) {
  console.log("\n🔧 FACTORY SETUP & CONFIGURATION");
  console.log("=" .repeat(50));

  try {
    // Validate canister IDs first
    console.log("🔍 Validating configuration...");
    if (!isValidCanisterId(marketsCanisterId)) {
      console.log(`❌ Invalid Markets canister ID format: ${marketsCanisterId}`);
      console.log("💡 Expected format: xxxxx-xxxxx-xxxxx-xxxxx-xxx (27 characters)");
      console.log("🔄 Please check your canister ID and update marketsCanisterId in the script");
      return false;
    }
    console.log(`✅ Markets canister ID format valid: ${marketsCanisterId}`);

    // Get system status
    const systemStatus = await tokenFactory.getSystemStatus();
    console.log("\n📊 System Status:");
    console.log(`   Markets Canister Set: ${systemStatus.marketsCanisterSet ? '✅' : '❌'}`);
    console.log(`   Market Creation Enabled: ${systemStatus.marketCreationEnabled ? '✅' : '❌'}`);
    console.log(`   Network: ${systemStatus.network} 🌐`);
    console.log(`   Ledger: ${systemStatus.ledgerCanister}`);
    console.log(`   WASM Available: ${systemStatus.hasWasm ? '✅' : '❌'}`);
    console.log(`   Admin Set: ${systemStatus.adminSet ? '✅' : '❌'}`);

    // Set admin first if not set
    if (!systemStatus.adminSet) {
      console.log("\n👑 Setting up admin permissions...");
      try {
        // Get the factory principal to use as admin (or you can use your own principal)
        const factoryPrincipal = await tokenFactory.getFactoryPrincipal();
        const adminResult = await tokenFactory.setAdmin(factoryPrincipal);
        
        if ("ok" in adminResult) {
          console.log("✅ Admin permissions configured successfully!");
        } else {
          console.log("❌ Failed to set admin:", adminResult.err);
          return false;
        }
      } catch (error) {
        console.log("❌ Error setting admin:", error.message);
        return false;
      }
    }

    // Set markets canister if not set
    if (!systemStatus.marketsCanisterSet) {
      console.log(`\n🔗 Attempting to set Markets canister: ${marketsCanisterId}`);
      try {
        const result = await tokenFactory.setMarketsCanister(marketsCanisterId);
        if ("ok" in result) {
          console.log("✅ Markets canister configured successfully!");
          console.log("🔄 Verifying configuration...");
          
          // Verify the canister was set correctly
          const updatedStatus = await tokenFactory.getSystemStatus();
          if (updatedStatus.marketsCanisterSet) {
            console.log("✅ Markets canister verification successful!");
          } else {
            console.log("⚠️ Markets canister set but verification failed");
          }
        } else {
          console.log("❌ Failed to set markets canister:", result.err);
          console.log("💡 Possible issues:");
          console.log("   - Canister doesn't exist");
          console.log("   - Invalid canister ID");
          console.log("   - Insufficient permissions");
          console.log("   - Admin not properly set");
          return false;
        }
      } catch (error) {
        console.log("❌ Error setting markets canister:", error.message);
        if (error.message.includes("Invalid principal")) {
          console.log("🔍 This usually means:");
          console.log("   - The canister ID format is incorrect");
          console.log("   - The canister hasn't been deployed yet");
          console.log("   - There's a typo in the canister ID");
        }
        return false;
      }
    } else {
      const marketsCanister = await tokenFactory.getMarketsCanister();
      console.log(`✅ Markets canister already set: ${formatPrincipal(marketsCanister[0])}`);
    }

    // Check fee system
    const feeInfo = await tokenFactory.getMarketCreationFee();
    console.log("\n💰 Fee System Configuration:");
    console.log(`   Market Creation Fee: ${feeInfo.feeSats.toLocaleString()} satoshis`);
    console.log(`   Transfer Fee: ${feeInfo.transferFeeSats} satoshis`);
    console.log(`   Ledger: ${feeInfo.ledgerCanister}`);

    // Check cycle balance
    const cycleBalance = await tokenFactory.getCycleBalance();
    console.log(`\n🔋 Cycle Balance: ${cycleBalance.toLocaleString()} cycles`);

    // Check if we can create markets
    const canCreate = await tokenFactory.canCreateMarket(2);
    console.log(`   Can Create Binary Market: ${canCreate.canCreate ? '✅' : '❌'}`);
    if (!canCreate.canCreate) {
      console.log(`   Required: ${canCreate.requiredCycles.toLocaleString()} cycles`);
      console.log(`   Available: ${canCreate.currentBalance.toLocaleString()} cycles`);
    }

    return true;
  } catch (error) {
    console.error("❌ Factory setup failed:", error.message);
    return false;
  }
}

async function uploadWasmAndSetup() {
  let tokenFactory = null;
  let workingEndpoint = null;

  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      console.log(`🌐 Trying endpoint: ${endpoint}`);
      const agent = await createAgent(endpoint);
      tokenFactory = await testConnection(agent, canisterId);
      workingEndpoint = endpoint;
      console.log(`✅ Connected successfully to: ${endpoint}`);
      break;
    } catch (error) {
      console.log(`❌ Failed to connect to ${endpoint}: ${error.message}`);
      continue;
    }
  }

  if (!tokenFactory) {
    console.error("💥 Could not connect to any IC endpoint. Check your network connection.");
    return;
  }

  try {
    // Setup factory configuration
    const setupSuccess = await setupFactory(tokenFactory);
    if (!setupSuccess) {
      console.log("⚠️ Factory setup had issues, but continuing with WASM upload...");
    }

    // Check if WASM already exists
    console.log("\n📦 WASM MODULE MANAGEMENT");
    console.log("=" .repeat(50));
    console.log("🔍 Checking if WASM is already uploaded...");
    
    const hasWasm = await tokenFactory.hasWasm();
    if (hasWasm) {
      console.log("✅ WASM already uploaded. Skipping upload.");
    } else {
      const wasmBlob = await processWasmFile(wasmFilePath);

      console.log(`\n📤 Uploading processed WASM (${wasmBlob.length.toLocaleString()} bytes)`);
      console.log(`   Canister: ${canisterId}`);
      console.log(`   Endpoint: ${workingEndpoint}`);
      console.log("⏳ This may take a while for large files...");

      const result = await tokenFactory.uploadWasm(wasmBlob);

      if ("ok" in result) {
        console.log("✅ WASM Upload Success:", result.ok);
      } else if ("err" in result) {
        console.error("❌ WASM Upload Error:", result.err);
        return;
      }
    }

    // Show factory status
    await showFactoryStatus(tokenFactory);

    // Run comprehensive tests
    if (await tokenFactory.hasWasm()) {
      await runComprehensiveTests(tokenFactory);
    } else {
      console.log("⚠️ WASM not available - skipping market creation tests");
    }

  } catch (error) {
    console.error("💥 Operation failed:", error);
    
    if (error.message?.includes("Canister trapped")) {
      console.log("🔧 Troubleshooting: The canister may have trapped. Check canister logs or try a smaller file.");
    } else if (error.message?.includes("out of cycles")) {
      console.log("🔋 Troubleshooting: The canister may be out of cycles. Top up the canister with cycles.");
    } else if (error.message?.includes("not enough memory")) {
      console.log("💾 Troubleshooting: The canister may not have enough memory. Try upgrading with more memory.");
    }
  }
}

async function showFactoryStatus(tokenFactory) {
  console.log("\n📊 FACTORY STATUS OVERVIEW");
  console.log("=" .repeat(50));

  try {
    const factoryPrincipal = await tokenFactory.getFactoryPrincipal();
    const marketCount = await tokenFactory.getMarketCount();
    const tokens = await tokenFactory.getAllTokenMetadata();
    const marketStats = await tokenFactory.getMarketCountByType();
    const categoryStats = await tokenFactory.getMarketCountByCategory();
    const feeStats = await tokenFactory.getCollectedFees();
    
    console.log(`🏭 Factory Principal: ${formatPrincipal(factoryPrincipal)}`);
    console.log(`📈 Total Markets: ${marketCount}`);
    console.log(`   📊 Binary: ${marketStats.binary}`);
    console.log(`   🎯 Multiple Choice: ${marketStats.multipleChoice}`);
    console.log(`   🧩 Compound: ${marketStats.compound}`);
    console.log(`🪙 Total Tokens: ${tokens.length}`);
    console.log(`💰 Collected Fees: ${feeStats.totalCollected.toLocaleString()} sats`);
    console.log(`📊 Markets Created: ${feeStats.totalMarketsCreated}`);
    console.log(`✅ WASM Status: ${await tokenFactory.hasWasm() ? "Available" : "Missing"}`);

    if (categoryStats.length > 0) {
      console.log("\n🏷️ Markets by Category:");
      const categoryEmojis = {
        'Crypto': '₿',
        'AI': '🤖',
        'Sports': '⚽',
        'Political': '🗳️',
        'Technology': '💻',
        'Entertainment': '🎬',
        'Stocks': '📈',
        'Runes': '🗿'
      };
      
      categoryStats.forEach(([category, count]) => {
        const categoryName = Object.keys(category)[0];
        const emoji = categoryEmojis[categoryName] || '📂';
        console.log(`   ${emoji} ${categoryName}: ${count} markets`);
      });
    }

    if (tokens.length > 0) {
      console.log("\n🪙 Recent Tokens:");
      tokens.slice(0, 5).forEach(([principal, metadata], index) => {
        console.log(`   ${index + 1}. ${metadata.name} (${metadata.symbol})`);
        console.log(`      Principal: ${formatPrincipal(principal)}`);
        console.log(`      Description: ${metadata.description.slice(0, 60)}${metadata.description.length > 60 ? '...' : ''}`);
      });
      if (tokens.length > 5) {
        console.log(`      ... and ${tokens.length - 5} more tokens`);
      }
    }
  } catch (error) {
    console.error("❌ Failed to get factory status:", error.message);
  }
}

async function runComprehensiveTests(tokenFactory) {
  console.log("\n🧪 COMPREHENSIVE MARKET TESTING");
  console.log("=" .repeat(50));
  
  let testsPassed = 0;
  let totalTests = 0;

  // Test 1: Binary Market Creation
  totalTests++;
  console.log("\n1️⃣ Testing Binary Market Creation");
  console.log("-" .repeat(30));
  
  try {
    const binaryResult = await tokenFactory.createBinaryMarket({
      title: "Will Bitcoin reach $100k by end of 2024? 🚀",
      description: "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange before January 1, 2025. Resolution will be based on CoinMarketCap data.",
      category: { Crypto: null },
      image: { ImageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
      tags: [{ Crypto: null }],
      bettingCloseTime: hoursFromNow(720), // 30 days
      expirationTime: hoursFromNow(2160), // 90 days  
      resolutionLink: "https://coinmarketcap.com/currencies/bitcoin/",
      resolutionDescription: "Market resolves based on CoinMarketCap price data"
    });

    if ("ok" in binaryResult) {
      const marketId = binaryResult.ok;
      console.log(`✅ Binary market created! ID: ${marketId}`);
      
      const marketInfo = await tokenFactory.getMarketInfo(marketId);
      if (marketInfo && marketInfo.length > 0) {
        const info = marketInfo[0];
        console.log(`   📊 Title: ${info.metadata.title}`);
        console.log(`   👤 Creator: ${formatPrincipal(info.metadata.creator)}`);
        console.log(`   💰 Fee Block: ${info.metadata.creationFeeBlockIndex || 'N/A'}`);
        
        if ("Binary" in info.tokens) {
          console.log(`   ✅ YES Token: ${formatPrincipal(info.tokens.Binary.yesLedger)}`);
          console.log(`   ❌ NO Token: ${formatPrincipal(info.tokens.Binary.noLedger)}`);
        }
      }
      testsPassed++;
    } else {
      console.error("❌ Binary market creation failed:", binaryResult.err);
    }
  } catch (error) {
    console.error("❌ Binary market test error:", error.message);
  }

  // Test 2: Multiple Choice Market Creation
  totalTests++;
  console.log("\n2️⃣ Testing Multiple Choice Market Creation");
  console.log("-" .repeat(30));
  
  try {
    const multipleChoiceResult = await tokenFactory.createMultipleChoiceMarket({
      title: "Which team will win the 2024 World Series? ⚾",
      description: "This market will resolve to the team that wins the 2024 Major League Baseball World Series championship.",
      category: { Sports: null },
      image: { ImageUrl: "https://example.com/worldseries-2024.png" },
      tags: [{ Sports: null }],
      outcomes: ["New York Yankees", "Los Angeles Dodgers", "Atlanta Braves", "Houston Astros", "Other Team"],
      bettingCloseTime: hoursFromNow(1440), // 60 days
      expirationTime: hoursFromNow(2880), // 120 days
      resolutionLink: "https://www.mlb.com/",
      resolutionDescription: "Market resolves based on official MLB World Series results"
    });

    if ("ok" in multipleChoiceResult) {
      const marketId = multipleChoiceResult.ok;
      console.log(`✅ Multiple choice market created! ID: ${marketId}`);
      
      const marketInfo = await tokenFactory.getMarketInfo(marketId);
      if (marketInfo && marketInfo.length > 0) {
        const info = marketInfo[0];
        console.log(`   📊 Title: ${info.metadata.title}`);
        console.log(`   👤 Creator: ${formatPrincipal(info.metadata.creator)}`);
        
        if ("MultipleChoice" in info.tokens) {
          console.log(`   🎯 Outcome Tokens:`);
          info.tokens.MultipleChoice.outcomeLedgers.forEach(([outcome, ledger]) => {
            console.log(`      ${outcome}: ${formatPrincipal(ledger)}`);
          });
        }
      }
      testsPassed++;
    } else {
      console.error("❌ Multiple choice market creation failed:", multipleChoiceResult.err);
    }
  } catch (error) {
    console.error("❌ Multiple choice market test error:", error.message);
  }

  // Test 3: Compound Market Creation
  totalTests++;
  console.log("\n3️⃣ Testing Compound Market Creation");
  console.log("-" .repeat(30));
  
  try {
    const compoundResult = await tokenFactory.createCompoundMarket({
      title: "2024 AI Breakthrough Predictions 🤖",
      description: "This compound market tracks multiple AI-related predictions for 2024. Each subject can resolve independently based on whether the predicted breakthrough occurs.",
      category: { AI: null },
      image: { ImageUrl: "https://example.com/ai-2024.png" },
      tags: [{ AI: null }, { Technology: null }],
      subjects: [
        "GPT-5 or equivalent released",
        "First AGI system announced",
        "AI passes advanced math olympiad",
        "Autonomous AI agents in production"
      ],
      bettingCloseTime: hoursFromNow(2160), // 90 days
      expirationTime: hoursFromNow(8760), // 365 days
      resolutionLink: "https://openai.com/research",
      resolutionDescription: "Each subject resolves independently based on public announcements and verified achievements"
    });

    if ("ok" in compoundResult) {
      const marketId = compoundResult.ok;
      console.log(`✅ Compound market created! ID: ${marketId}`);
      
      const marketInfo = await tokenFactory.getMarketInfo(marketId);
      if (marketInfo && marketInfo.length > 0) {
        const info = marketInfo[0];
        console.log(`   📊 Title: ${info.metadata.title}`);
        console.log(`   👤 Creator: ${formatPrincipal(info.metadata.creator)}`);
        
        if ("Compound" in info.tokens) {
          console.log(`   🧩 Subject Tokens:`);
          info.tokens.Compound.subjectTokens.forEach(([subject, tokens]) => {
            console.log(`      ${subject}:`);
            console.log(`         YES: ${formatPrincipal(tokens.yesLedger)}`);
            console.log(`         NO: ${formatPrincipal(tokens.noLedger)}`);
          });
        }
      }
      testsPassed++;
    } else {
      console.error("❌ Compound market creation failed:", compoundResult.err);
    }
  } catch (error) {
    console.error("❌ Compound market test error:", error.message);
  }

  // Test 4: Legacy Market Creation (Backward Compatibility)
  totalTests++;
  console.log("\n4️⃣ Testing Legacy Market Creation");
  console.log("-" .repeat(30));
  
  try {
    const legacyResult = await tokenFactory.createMarket({
      question: "Will AI achieve AGI by 2030?"
    });

    if ("ok" in legacyResult) {
      const marketId = legacyResult.ok;
      console.log(`✅ Legacy market created! ID: ${marketId}`);
      
      const marketInfo = await tokenFactory.getMarketInfo(marketId);
      if (marketInfo && marketInfo.length > 0) {
        const info = marketInfo[0];
        console.log(`   📊 Title: ${info.metadata.title}`);
        console.log(`   📝 Description: ${info.metadata.description}`);
        console.log(`   🏷️ Category: ${Object.keys(info.metadata.category)[0]}`);
      }
      testsPassed++;
    } else {
      console.error("❌ Legacy market creation failed:", legacyResult.err);
    }
  } catch (error) {
    console.error("❌ Legacy market test error:", error.message);
  }

  // Test 5: Query Functions
  totalTests++;
  console.log("\n5️⃣ Testing Query Functions");
  console.log("-" .repeat(30));
  
  try {
    const activeMarkets = await tokenFactory.getActiveMarkets();
    const cryptoMarkets = await tokenFactory.getMarketsByCategory({ Crypto: null });
    const aiMarkets = await tokenFactory.getMarketsByTag({ AI: null });
    const binaryMarkets = await tokenFactory.getMarketsByType({ Binary: null });
    
    console.log(`✅ Query functions working:`);
    console.log(`   📈 Active Markets: ${activeMarkets.length}`);
    console.log(`   ₿ Crypto Markets: ${cryptoMarkets.length}`);
    console.log(`   🤖 AI Markets: ${aiMarkets.length}`);
    console.log(`   📊 Binary Markets: ${binaryMarkets.length}`);
    testsPassed++;
  } catch (error) {
    console.error("❌ Query functions test error:", error.message);
  }

  // Test 6: Fee System Verification
  totalTests++;
  console.log("\n6️⃣ Testing Fee System");
  console.log("-" .repeat(30));
  
  try {
    const feeStats = await tokenFactory.getCollectedFees();
    const feeInfo = await tokenFactory.getMarketCreationFee();
    const feeAccount = await tokenFactory.getFeeCollectionAccount();
    
    console.log(`✅ Fee system operational:`);
    console.log(`   💰 Total Collected: ${feeStats.totalCollected.toLocaleString()} sats`);
    console.log(`   📊 Markets Created: ${feeStats.totalMarketsCreated}`);
    console.log(`   💵 Fee Per Market: ${feeInfo.feeSats.toLocaleString()} sats`);
    console.log(`   🏦 Collection Account: ${formatPrincipal(feeAccount.owner)}`);
    testsPassed++;
  } catch (error) {
    console.error("❌ Fee system test error:", error.message);
  }

  // Show final test results
  console.log("\n📋 TEST SUMMARY");
  console.log("=" .repeat(50));
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (testsPassed === totalTests) {
    console.log("🎉 All tests passed! TokenFactory is fully operational!");
  } else {
    console.log(`⚠️ ${totalTests - testsPassed} test(s) failed. Check configuration and try again.`);
  }

  // Show updated statistics
  await showUpdatedStatistics(tokenFactory);
}

async function showUpdatedStatistics(tokenFactory) {
  console.log("\n📊 UPDATED FACTORY STATISTICS");
  console.log("=" .repeat(50));
  
  try {
    const marketCount = await tokenFactory.getMarketCount();
    const marketStats = await tokenFactory.getMarketCountByType();
    const categoryStats = await tokenFactory.getMarketCountByCategory();
    const feeStats = await tokenFactory.getCollectedFees();
    const cycleBalance = await tokenFactory.getCycleBalance();
    
    console.log(`📈 Total Markets: ${marketCount}`);
    console.log(`📊 Market Breakdown:`);
    console.log(`   Binary: ${marketStats.binary}`);
    console.log(`   Multiple Choice: ${marketStats.multipleChoice}`);
    console.log(`   Compound: ${marketStats.compound}`);
    
    console.log(`\n💰 Financial Summary:`);
    console.log(`   Total Fees Collected: ${feeStats.totalCollected.toLocaleString()} sats`);
    console.log(`   Average Fee/Market: ${feeStats.averageFeePerMarket.toLocaleString()} sats`);
    console.log(`   Available for Withdrawal: ${feeStats.availableForWithdrawal.toLocaleString()} sats`);
    
    console.log(`\n🔋 Resource Status:`);
    console.log(`   Cycle Balance: ${cycleBalance.toLocaleString()} cycles`);
    
    if (categoryStats.length > 0) {
      console.log(`\n🏷️ Category Distribution:`);
      const categoryEmojis = {
        'Crypto': '₿',
        'AI': '🤖',
        'Sports': '⚽',
        'Political': '🗳️',
        'Technology': '💻',
        'Entertainment': '🎬',
        'Stocks': '📈',
        'Runes': '🗿'
      };
      
      categoryStats
        .filter(([_, count]) => count > 0)
        .forEach(([category, count]) => {
          const categoryName = Object.keys(category)[0];
          const emoji = categoryEmojis[categoryName] || '📂';
          const percentage = ((count / marketCount) * 100).toFixed(1);
          console.log(`   ${emoji} ${categoryName}: ${count} (${percentage}%)`);
        });
    }
  } catch (error) {
    console.error("❌ Failed to get updated statistics:", error.message);
  }
}

async function verifyCanisterExists(canisterId) {
  // Simple canister existence check by trying to get its status
  try {
    const agent = await createAgent("https://ic0.app");
    const response = await agent.query(canisterId, { methodName: "time", arg: new ArrayBuffer(0) });
    return true;
  } catch (error) {
    return false;
  }
}

async function deployMarketsCanister() {
  console.log("\n🚀 MARKETS CANISTER DEPLOYMENT VERIFICATION");
  console.log("=" .repeat(50));
  
  console.log(`🔍 Checking Markets canister: ${marketsCanisterId}`);
  
  // Validate canister ID format
  if (!isValidCanisterId(marketsCanisterId)) {
    console.log("❌ Invalid canister ID format!");
    console.log("💡 Expected format: xxxxx-xxxxx-xxxxx-xxxxx-xxx");
    console.log("🔧 Please update marketsCanisterId in the script with correct format");
    return false;
  }
  
  console.log("✅ Canister ID format is valid");
  
  // Try to verify canister exists
  console.log("🔍 Verifying canister existence...");
  const exists = await verifyCanisterExists(marketsCanisterId);
  if (exists) {
    console.log("✅ Markets canister appears to be deployed and accessible");
  } else {
    console.log("❌ Markets canister not found or not accessible");
    console.log("💡 This could mean:");
    console.log("   1. Canister hasn't been deployed yet");
    console.log("   2. Canister ID is incorrect");
    console.log("   3. Network connectivity issues");
    console.log("   4. Canister is private/protected");
  }
  
  console.log("\n📋 Deployment Checklist:");
  console.log("   □ Markets canister WASM file ready");
  console.log("   □ Canister creation cycles available");
  console.log("   □ Controller permissions configured");
  console.log("   □ TokenFactory integration parameters");
  
  console.log("\n🔗 Post-deployment steps:");
  console.log("   1. Update TokenFactory with Markets canister ID");
  console.log("   2. Configure Markets canister with TokenFactory ID");
  console.log("   3. Test market creation end-to-end");
  console.log("   4. Verify fee collection integration");
  
  console.log(`\n💡 Current Markets Canister ID: ${marketsCanisterId}`);
  
  return exists;
}

const main = async () => {
  console.log("🚀 ENHANCED TOKENFACTORY MANAGEMENT SYSTEM");
  console.log("=" .repeat(60));
  console.log("📅 " + new Date().toLocaleString());
  
  // Show configuration
  console.log("\n⚙️ CONFIGURATION");
  console.log("-" .repeat(30));
  console.log(`TokenFactory Canister: ${canisterId}`);
  console.log(`Markets Canister: ${marketsCanisterId}`);
  console.log(`WASM File Path: ${wasmFilePath}`);
  console.log(`Available Endpoints: ${endpoints.length}`);
  
  // Validate Markets canister
  const marketsCanisterValid = await deployMarketsCanister();
  
  // Main upload and test process
  await uploadWasmAndSetup();
  
  console.log("\n🎯 PROCESS COMPLETED!");
  console.log("=" .repeat(60));
  console.log("✅ TokenFactory setup and testing finished");
  console.log("📊 Check logs above for detailed results");
  
  if (marketsCanisterValid) {
    console.log("🔗 Markets integration ready for testing");
  } else {
    console.log("⚠️ Markets canister needs to be deployed/configured");
  }
  
  console.log("\n💡 Next steps:");
  if (!marketsCanisterValid) {
    console.log("   1. Deploy Markets canister or verify canister ID");
    console.log("   2. Update marketsCanisterId in this script");
    console.log("   3. Re-run this script to configure integration");
  } else {
    console.log("   1. Test market creation from frontend");
    console.log("   2. Verify fee collection system");
    console.log("   3. Test token minting and trading");
  }
  console.log("   4. Monitor cycle consumption");
};

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Gracefully shutting down...');
  process.exit(0);
});

main().catch(console.error);