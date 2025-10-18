import { Actor, HttpAgent } from "@dfinity/agent";
import { readFileSync } from "fs";
import path from "path";
import fetch from "node-fetch";
import { createGzip } from "zlib";
import { promisify } from "util";

// Polyfill for global fetch
global.fetch = fetch;

// === CONFIGURATION ===
const marketFactoryId = "3f6pv-baaaa-aaaab-qacoq-cai"; // your MarketFactory canister
const multiTokenWasmPath = "/mnt/c/Users/user/OmaxPro.Bitcoin/multi_token_ledger.wasm.gz";

// Try multiple endpoints in order of preference
const endpoints = [
  "https://ic0.app", // Primary IC boundary node
  "https://icp0.io",  // Alternative boundary node
  "http://127.0.0.1:4943", // Local replica (if running)
];

// Token IDs for YES and NO tokens
const YES_TOKEN_ID = 0;
const NO_TOKEN_ID = 1;

// Enhanced Candid interface for MarketFactory
const marketFactoryIdl = ({ IDL }) => {
  const Result_1 = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const CreateMarketArgs = IDL.Record({
    question: IDL.Text,
  });
  const Result = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
  const MarketInfo = IDL.Record({
    id: IDL.Nat,
    question: IDL.Text,
    created_at: IDL.Int,
    ledger_canister: IDL.Principal,
    yes_token_id: IDL.Nat,
    no_token_id: IDL.Nat,
  });
  const MarketTokens = IDL.Record({
    yesTokenId: IDL.Nat,
    noTokenId: IDL.Nat,
  });

  return IDL.Service({
    uploadMultiTokenWasm: IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    hasMultiTokenWasm: IDL.Func([], [IDL.Bool], ["query"]),
    createMarket: IDL.Func([CreateMarketArgs], [Result], []),
    getMarketInfo: IDL.Func([IDL.Nat], [IDL.Opt(MarketInfo)], ["query"]),
    getAllMarkets: IDL.Func([], [IDL.Vec(MarketInfo)], ["query"]),
    getMarketCount: IDL.Func([], [IDL.Nat], ["query"]),
    getCreatedLedgers: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    getMarketTokens: IDL.Func([IDL.Nat], [IDL.Opt(MarketTokens)], ["query"]),
    getFactoryPrincipal: IDL.Func([], [IDL.Principal], ["query"]),
    getMarketLedgerActor: IDL.Func([IDL.Nat], [IDL.Opt(IDL.Principal)], []),
  });
};

// Multi-Token Ledger Candid interface
const multiTokenLedgerIdl = ({ IDL }) => {
  const TokenId = IDL.Nat;
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Metadata = IDL.Record({
    name: IDL.Text,
    symbol: IDL.Text,
    decimals: IDL.Nat8,
  });
  const TransferArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });
  const TransferError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    TemporarilyUnavailable: IDL.Null,
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });
  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: TransferError,
  });
  const ApproveArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    spender: Account,
    amount: IDL.Nat,
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64),
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });
  const ApproveResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Variant({
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
      InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
      AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
      Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
      TooOld: IDL.Null,
      CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
      Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
      TemporarilyUnavailable: IDL.Null,
      GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
    }),
  });
  const MintBurnResult = IDL.Variant({
    ok: IDL.Nat,
    err: IDL.Text,
  });

  return IDL.Service({
    // ICRC-1 functions
    icrc1_name: IDL.Func([TokenId], [IDL.Opt(IDL.Text)], ["query"]),
    icrc1_symbol: IDL.Func([TokenId], [IDL.Opt(IDL.Text)], ["query"]),
    icrc1_decimals: IDL.Func([TokenId], [IDL.Opt(IDL.Nat8)], ["query"]),
    icrc1_total_supply: IDL.Func([TokenId], [IDL.Nat], ["query"]),
    icrc1_balance_of: IDL.Func([TokenId, Account], [IDL.Nat], ["query"]),
    icrc1_fee: IDL.Func([TokenId], [IDL.Nat], ["query"]),
    icrc1_transfer: IDL.Func([TokenId, TransferArgs], [TransferResult], []),
    icrc1_supported_standards: IDL.Func([], [IDL.Vec(IDL.Record({ name: IDL.Text, url: IDL.Text }))], ["query"]),

    // ICRC-2 functions
    icrc2_approve: IDL.Func([TokenId, ApproveArgs], [ApproveResult], []),
    icrc2_allowance: IDL.Func([TokenId, IDL.Principal, IDL.Principal], [IDL.Nat], ["query"]),
    icrc2_transfer_from: IDL.Func([TokenId, IDL.Principal, IDL.Principal, IDL.Nat, IDL.Opt(IDL.Nat)], [TransferResult], []),

    // Multi-token specific functions
    supported_tokens: IDL.Func([], [IDL.Vec(TokenId)], ["query"]),
    get_market_info: IDL.Func([], [IDL.Record({
      market_id: IDL.Nat,
      question: IDL.Text,
      owner: IDL.Principal,
      yes_token_id: TokenId,
      no_token_id: TokenId,
    })], ["query"]),
    get_token_metadata: IDL.Func([TokenId], [IDL.Opt(Metadata)], ["query"]),
    get_all_token_metadata: IDL.Func([], [IDL.Vec(IDL.Tuple(TokenId, Metadata))], ["query"]),

    // Owner functions
    mint: IDL.Func([TokenId, IDL.Principal, IDL.Nat], [MintBurnResult], []),
    burn: IDL.Func([TokenId, IDL.Principal, IDL.Nat], [MintBurnResult], []),
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
  console.log(`📂 Reading file: ${filePath}`);
  const fileBuffer = readFileSync(path.resolve(filePath));
  
  console.log(`📊 File size: ${fileBuffer.length} bytes`);
  console.log(`🔍 Detecting file format...`);
  
  let wasmBuffer = fileBuffer;
  
  if (isGzipped(fileBuffer)) {
    console.log("✅ File is gzipped - using as is");
  } else if (isWasm(fileBuffer)) {
    console.log("✅ File is uncompressed WASM - compressing with gzip...");
    
    const gzip = createGzip({ level: 9 });
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      gzip.on('data', chunk => chunks.push(chunk));
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
    console.log("⚠️ File format unknown - attempting compression...");
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

async function testConnection(agent, canisterId, idlFactory) {
  try {
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });

    // Test with a simple query call
    if (idlFactory === marketFactoryIdl) {
      await actor.hasMultiTokenWasm();
    } else {
      await actor.supported_tokens();
    }
    return actor;
  } catch (error) {
    throw new Error(`Connection test failed: ${error.message}`);
  }
}

const uploadWasm = async () => {
  let marketFactory = null;
  let workingEndpoint = null;

  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Trying endpoint: ${endpoint}`);
      const agent = await createAgent(endpoint);
      marketFactory = await testConnection(agent, marketFactoryId, marketFactoryIdl);
      workingEndpoint = endpoint;
      console.log(`✅ Connected successfully to: ${endpoint}`);
      break;
    } catch (error) {
      console.log(`❌ Failed to connect to ${endpoint}: ${error.message}`);
      continue;
    }
  }

  if (!marketFactory) {
    console.error("❌ Could not connect to any IC endpoint. Check your network connection.");
    return;
  }

  try {
    // Check if multi-token WASM already exists
    console.log("🔍 Checking if multi-token WASM is already uploaded...");
    const hasWasm = await marketFactory.hasMultiTokenWasm();
    if (hasWasm) {
      console.log("ℹ️ Multi-token WASM already uploaded. Skipping upload.");
    } else {
      // Process the WASM file with format detection
      const wasmBlob = await processWasmFile(multiTokenWasmPath);

      console.log(`🚀 Uploading multi-token WASM (${wasmBlob.length} bytes) to ${marketFactoryId} via ${workingEndpoint}...`);
      console.log("⏳ This may take a while for large files...");

      const result = await marketFactory.uploadMultiTokenWasm(wasmBlob);

      if ("ok" in result) {
        console.log("✅ Multi-token WASM Upload Success:", result.ok);
      } else if ("err" in result) {
        console.error("❌ Multi-token WASM Upload Error:", result.err);
        return;
      }
    }

    // Verify upload and show factory info
    console.log("\n📊 Market Factory Status:");
    const factoryPrincipal = await marketFactory.getFactoryPrincipal();
    const marketCount = await marketFactory.getMarketCount();
    const ledgers = await marketFactory.getCreatedLedgers();
    
    console.log(`Factory Principal: ${factoryPrincipal}`);
    console.log(`Markets Created: ${marketCount}`);
    console.log(`Multi-Token Ledgers: ${ledgers.length}`);
    console.log(`Multi-Token WASM Uploaded: ${await marketFactory.hasMultiTokenWasm() ? "✅ Yes" : "❌ No"}`);

    if (marketCount > 0) {
      console.log("\n📈 Existing Markets:");
      const markets = await marketFactory.getAllMarkets();
      for (const market of markets) {
        console.log(`  Market ${market.id}: ${market.question}`);
        console.log(`    Ledger: ${market.ledger_canister}`);
        console.log(`    YES Token ID: ${market.yes_token_id}`);
        console.log(`    NO Token ID: ${market.no_token_id}`);
      }
    }

    // Test market creation if WASM is available
    if (await marketFactory.hasMultiTokenWasm()) {
      await testCreateMarket(marketFactory);
    }

  } catch (error) {
    console.error("❌ Operation failed:", error);
    
    if (error.message?.includes("Canister trapped")) {
      console.log("💡 The canister may have trapped. Check canister logs or try a smaller file.");
    } else if (error.message?.includes("out of cycles")) {
      console.log("💡 The canister may be out of cycles. Top up the canister with cycles.");
    } else if (error.message?.includes("not enough memory")) {
      console.log("💡 The canister may not have enough memory. Try upgrading with more memory.");
    } else if (error.message?.includes("Input must be either gzipped or uncompressed WASM")) {
      console.log("💡 WASM format issue detected. Try the troubleshooting steps below:");
      console.log("   1. Verify your multi-token WASM file is valid");
      console.log("   2. Try downloading the official multi-token ledger WASM");
      console.log("   3. Check if the file was corrupted during transfer");
    }
  }
};

// Test market creation function
const testCreateMarket = async (marketFactory) => {
  try {
    console.log("\n🧪 Testing market creation...");
    const result = await marketFactory.createMarket({
      question: "Will Bitcoin reach $100k by end of 2024?"
    });

    if ("ok" in result) {
      const marketId = result.ok;
      console.log(`✅ Market created successfully! ID: ${marketId}`);
      
      // Get market info
      const marketInfo = await marketFactory.getMarketInfo(marketId);
      if (marketInfo.length > 0) {
        const info = marketInfo[0];
        console.log(`📊 Market Info:`);
        console.log(`   Question: ${info.question}`);
        console.log(`   Ledger Canister: ${info.ledger_canister}`);
        console.log(`   YES Token ID: ${info.yes_token_id}`);
        console.log(`   NO Token ID: ${info.no_token_id}`);

        // Test interaction with the multi-token ledger
        await testMultiTokenLedger(info.ledger_canister, marketId);
      }
    } else {
      console.error("❌ Market creation failed:", result.err);
    }
  } catch (error) {
    console.error("❌ Market creation error:", error.message);
  }
};

// Test multi-token ledger functions
const testMultiTokenLedger = async (ledgerPrincipal, marketId) => {
  try {
    console.log(`\n🪙 Testing multi-token ledger: ${ledgerPrincipal}`);
    
    // Connect to the multi-token ledger
    const agent = await createAgent(endpoints[0]); // Use first working endpoint
    const ledger = Actor.createActor(multiTokenLedgerIdl, {
      agent,
      canisterId: ledgerPrincipal,
    });

    // Get market info from ledger
    const marketInfo = await ledger.get_market_info();
    console.log(`📈 Market Info from Ledger:`);
    console.log(`   Market ID: ${marketInfo.market_id}`);
    console.log(`   Question: ${marketInfo.question}`);
    console.log(`   Owner: ${marketInfo.owner}`);

    // Get supported tokens
    const supportedTokens = await ledger.supported_tokens();
    console.log(`🎯 Supported Token IDs: [${supportedTokens.join(', ')}]`);

    // Get token metadata
    const allMetadata = await ledger.get_all_token_metadata();
    console.log(`🏷️ Token Metadata:`);
    for (const [tokenId, metadata] of allMetadata) {
      console.log(`   Token ${tokenId}: ${metadata.name} (${metadata.symbol}) - ${metadata.decimals} decimals`);
      
      // Get token details
      const totalSupply = await ledger.icrc1_total_supply(tokenId);
      const fee = await ledger.icrc1_fee(tokenId);
      console.log(`     Total Supply: ${totalSupply}`);
      console.log(`     Fee: ${fee}`);
    }

    // Check balances (factory should own all tokens initially)
    const factoryPrincipal = marketInfo.owner;
    const yesBalance = await ledger.icrc1_balance_of(YES_TOKEN_ID, { owner: factoryPrincipal, subaccount: null });
    const noBalance = await ledger.icrc1_balance_of(NO_TOKEN_ID, { owner: factoryPrincipal, subaccount: null });
    
    console.log(`💰 Factory Balances:`);
    console.log(`   YES tokens: ${yesBalance}`);
    console.log(`   NO tokens: ${noBalance}`);

  } catch (error) {
    console.error("❌ Multi-token ledger test failed:", error.message);
  }
};

const main = async () => {
  console.log("🚀 Starting Multi-Token Market Factory Process");
  console.log("=".repeat(50));
  
  await uploadWasm();
  
  console.log("\n" + "=".repeat(50));
  console.log("✨ Multi-token market factory process completed!");
  console.log("\n📝 Next steps:");
  console.log("1. Markets are now created with single multi-token ledgers");
  console.log("2. Each market has YES (TokenId=0) and NO (TokenId=1) tokens");
  console.log("3. Use icrc1_transfer(tokenId, args) to transfer tokens");
  console.log("4. Use icrc2_approve(tokenId, args) for allowances");
  console.log("5. Factory owner can mint/burn tokens as needed");
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