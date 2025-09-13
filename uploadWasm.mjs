import { Actor, HttpAgent } from "@dfinity/agent";
import { readFileSync } from "fs";
import path from "path";
import fetch from "node-fetch";
import { createGzip } from "zlib";
import { promisify } from "util";

// Polyfill for global fetch
global.fetch = fetch;

// === CONFIGURATION ===
const canisterId = "6xhyy-ryaaa-aaaab-qacqa-cai"; // your TokenFactory canister
const wasmFilePath = "/mnt/c/Users/user/OmaxPro.Bitcoin/icrc1_ledger.wasm.gz";

// Try multiple endpoints in order of preference
const endpoints = [
  "https://ic0.app", // Primary IC boundary node
  "https://icp0.io",  // Alternative boundary node
  "http://127.0.0.1:4943", // Local replica (if running)
];

// Enhanced Candid interface for TokenFactory
const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
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
  const MarketInfo = IDL.Record({
    id: IDL.Nat,
    question: IDL.Text,
    created_at: IDL.Int,
    yesLedger: IDL.Principal,
    noLedger: IDL.Principal,
  });
  const CreateMarketArgs = IDL.Record({
    question: IDL.Text,
  });
  const Result = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });

  return IDL.Service({
    uploadWasm: IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    hasWasm: IDL.Func([], [IDL.Bool], ["query"]),
    createMarket: IDL.Func([CreateMarketArgs], [Result], []),
    getMarketInfo: IDL.Func([IDL.Nat], [IDL.Opt(MarketInfo)], ["query"]),
    getAllMarkets: IDL.Func([], [IDL.Vec(MarketInfo)], ["query"]),
    getMarketCount: IDL.Func([], [IDL.Nat], ["query"]),
    getAllTokenMetadata: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Principal, TokenMetadata))],
      ["query"]
    ),
    getFactoryPrincipal: IDL.Func([], [IDL.Principal], ["query"]),
    getCreatedTokens: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
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
  console.log(`📂 Reading file: ${filePath}`);
  const fileBuffer = readFileSync(path.resolve(filePath));
  
  console.log(`📊 File size: ${fileBuffer.length} bytes`);
  console.log(`🔍 Detecting file format...`);
  
  let wasmBuffer = fileBuffer;
  
  if (isGzipped(fileBuffer)) {
    console.log("✅ File is gzipped - using as is");
  } else if (isWasm(fileBuffer)) {
    console.log("✅ File is uncompressed WASM - compressing with gzip...");
    
    // Compress with gzip
    const gzip = createGzip({ level: 9 }); // Maximum compression
    const gzipAsync = promisify(gzip._transform.bind(gzip));
    
    const chunks = [];
    gzip.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      gzip.on('end', () => {
        const compressed = Buffer.concat(chunks);
        console.log(`🗜️ Compressed from ${fileBuffer.length} to ${compressed.length} bytes`);
        resolve(new Uint8Array(compressed));
      });
      
      gzip.on('error', reject);
      gzip.write(fileBuffer);
      gzip.end();
    });
  } else {
    console.log("⚠️ File format unknown - trying multiple approaches...");
    
    // Try treating as uncompressed WASM first
    console.log("🔄 Attempting to compress as WASM...");
    try {
      const gzip = createGzip({ level: 9 });
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        gzip.on('data', chunk => chunks.push(chunk));
        gzip.on('end', () => {
          const compressed = Buffer.concat(chunks);
          console.log(`🗜️ Force-compressed from ${fileBuffer.length} to ${compressed.length} bytes`);
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

  // Only fetch root key for local development
  if (hostUrl.includes("127.0.0.1") || hostUrl.includes("localhost")) {
    try {
      await agent.fetchRootKey();
      console.log("✅ Root key fetched for local development");
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

    // Test with a simple query call
    await tokenFactory.hasWasm();
    return tokenFactory;
  } catch (error) {
    throw new Error(`Connection test failed: ${error.message}`);
  }
}

const uploadWasm = async () => {
  let tokenFactory = null;
  let workingEndpoint = null;

  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Trying endpoint: ${endpoint}`);
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
    console.error("❌ Could not connect to any IC endpoint. Check your network connection.");
    return;
  }

  try {
    // Check if WASM already exists
    console.log("🔍 Checking if WASM is already uploaded...");
    const hasWasm = await tokenFactory.hasWasm();
    if (hasWasm) {
      console.log("ℹ️ WASM already uploaded. Skipping upload.");
    } else {
      // Process the WASM file with format detection
      const wasmBlob = await processWasmFile(wasmFilePath);

      console.log(`🚀 Uploading processed WASM (${wasmBlob.length} bytes) to ${canisterId} via ${workingEndpoint}...`);
      console.log("⏳ This may take a while for large files...");

      const result = await tokenFactory.uploadWasm(wasmBlob);

      if ("ok" in result) {
        console.log("✅ WASM Upload Success:", result.ok);
      } else if ("err" in result) {
        console.error("❌ WASM Upload Error:", result.err);
        return;
      }
    }

    // Verify upload and show factory info
    console.log("\n📊 Factory Status:");
    const factoryPrincipal = await tokenFactory.getFactoryPrincipal();
    const marketCount = await tokenFactory.getMarketCount();
    const tokens = await tokenFactory.getAllTokenMetadata();
    
    console.log(`Factory Principal: ${factoryPrincipal}`);
    console.log(`Markets Created: ${marketCount}`);
    console.log(`Total Tokens: ${tokens.length}`);
    console.log(`WASM Uploaded: ${await tokenFactory.hasWasm() ? "✅ Yes" : "❌ No"}`);

    if (tokens.length > 0) {
      console.log("\n🪙 Existing Tokens:");
      tokens.forEach(([principal, metadata], index) => {
        console.log(`  ${index + 1}. ${metadata.name} (${metadata.symbol})`);
        console.log(`     Principal: ${principal}`);
        console.log(`     Description: ${metadata.description}`);
      });
    }

    // Test market creation if WASM is available
    if (await tokenFactory.hasWasm()) {
      await testCreateMarket(tokenFactory);
    }

  } catch (error) {
    console.error("❌ Operation failed:", error);
    
    // More specific error handling
    if (error.message?.includes("Canister trapped")) {
      console.log("💡 The canister may have trapped. Check canister logs or try a smaller file.");
    } else if (error.message?.includes("out of cycles")) {
      console.log("💡 The canister may be out of cycles. Top up the canister with cycles.");
    } else if (error.message?.includes("not enough memory")) {
      console.log("💡 The canister may not have enough memory. Try upgrading with more memory.");
    } else if (error.message?.includes("Input must be either gzipped or uncompressed WASM")) {
      console.log("💡 WASM format issue detected. Try the troubleshooting steps below:");
      console.log("   1. Verify your WASM file is valid");
      console.log("   2. Try downloading the official ICRC-1 ledger WASM");
      console.log("   3. Check if the file was corrupted during transfer");
    }
  }
};

// Test market creation function
const testCreateMarket = async (tokenFactory) => {
  try {
    console.log("\n🧪 Testing market creation...");
    const result = await tokenFactory.createMarket({
      question: "Will Bitcoin reach $100k by end of 2024?"
    });

    if ("ok" in result) {
      const marketId = result.ok;
      console.log(`✅ Market created successfully! ID: ${marketId}`);
      
      // Get market info
      const marketInfo = await tokenFactory.getMarketInfo(marketId);
      if (marketInfo.length > 0) {
        const info = marketInfo[0];
        console.log(`📊 Market Info:`);
        console.log(`   Question: ${info.question}`);
        console.log(`   YES Token: ${info.yesLedger}`);
        console.log(`   NO Token: ${info.noLedger}`);
      }
    } else {
      console.error("❌ Market creation failed:", result.err);
    }
  } catch (error) {
    console.error("❌ Market creation error:", error.message);
  }
};

const main = async () => {
  console.log("🚀 Starting TokenFactory WASM Upload Process");
  console.log("=".repeat(50));
  
  await uploadWasm();
  
  console.log("\n" + "=".repeat(50));
  console.log("✨ Upload process completed!");
};

// Add error handling for the main process
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

main().catch(console.error);