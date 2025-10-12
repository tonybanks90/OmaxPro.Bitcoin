import { Actor, HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { readFileSync, existsSync } from "fs";
import path from "path";
import fetch from "node-fetch";
import { createGzip } from "zlib";

// Polyfill for global fetch
global.fetch = fetch;

// === CONFIGURATION ===
const canisterId = "vg3po-ix777-77774-qaafa-cai";
const wasmFilePath = "/mnt/c/Users/user/OmaxPro.Bitcoin/icrc1_ledger.wasm.gz";
const identityFilePath = "./omax_identity.pem"; // Local identity file

const endpoints = [
  "http://127.0.0.1:4943",
  "https://ic0.app",
  "https://icp0.io",
];

// Load identity from local file
function loadIdentity() {
  if (!existsSync(identityFilePath)) {
    console.error(`Identity file not found: ${identityFilePath}`);
    console.log('\nTo create the identity file, run:');
    console.log('  dfx identity export omax > omax_identity.pem');
    throw new Error('Identity file not found');
  }
  
  let identityPem = readFileSync(identityFilePath, 'utf8');
  
  // Debug: show first few characters
  console.log('Identity file first 50 chars:', identityPem.substring(0, 50));
  console.log('Identity file length:', identityPem.length);
  
  // Ensure proper line endings (replace \r\n with \n)
  identityPem = identityPem.replace(/\r\n/g, '\n');
  
  // Try different methods to parse the identity
  let identity;
  const errors = [];
  
  // Method 1: fromPem (newer API)
  try {
    identity = Ed25519KeyIdentity.fromPem(identityPem);
    console.log('✓ Loaded identity using fromPem');
    console.log(`Identity principal: ${identity.getPrincipal().toText()}`);
    return identity;
  } catch (e) {
    errors.push('fromPem: ' + e.message);
  }
  
  // Method 2: fromPEM (older API)
  try {
    identity = Ed25519KeyIdentity.fromPEM(identityPem);
    console.log('✓ Loaded identity using fromPEM');
    console.log(`Identity principal: ${identity.getPrincipal().toText()}`);
    return identity;
  } catch (e) {
    errors.push('fromPEM: ' + e.message);
  }
  
  // Method 3: Try parsing as JSON (in case it's in JSON format)
  try {
    const parsed = JSON.parse(identityPem);
    if (parsed.privateKey) {
      const key = Uint8Array.from(Buffer.from(parsed.privateKey, 'hex'));
      identity = Ed25519KeyIdentity.fromSecretKey(key);
      console.log('✓ Loaded identity from JSON format');
      console.log(`Identity principal: ${identity.getPrincipal().toText()}`);
      return identity;
    }
  } catch (e) {
    errors.push('JSON: ' + e.message);
  }
  
  console.error('\nFailed to parse identity file. Errors:');
  errors.forEach(err => console.error('  -', err));
  console.log('\nPlease try re-exporting the identity:');
  console.log('  dfx identity export omax > omax_identity.pem');
  
  throw new Error('Could not parse identity file');
}

// Candid interface
const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  
  return IDL.Service({
    uploadWasm: IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    hasWasm: IDL.Func([], [IDL.Bool], ["query"]),
    getFactoryPrincipal: IDL.Func([], [IDL.Principal], ["query"]),
  });
};

function isGzipped(buffer) {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

async function processWasmFile(filePath) {
  console.log(`Reading file: ${filePath}`);
  const fileBuffer = readFileSync(path.resolve(filePath));
  console.log(`File size: ${fileBuffer.length} bytes`);
  
  if (isGzipped(fileBuffer)) {
    console.log("File is gzipped - using as is");
    return new Uint8Array(fileBuffer);
  } else {
    console.log("File is not gzipped - compressing...");
    const gzip = createGzip({ level: 9 });
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      gzip.on('data', chunk => chunks.push(chunk));
      gzip.on('end', () => {
        const compressed = Buffer.concat(chunks);
        console.log(`Compressed to ${compressed.length} bytes`);
        resolve(new Uint8Array(compressed));
      });
      gzip.on('error', reject);
      gzip.write(fileBuffer);
      gzip.end();
    });
  }
}

async function createAgent(hostUrl, identity) {
  const agent = new HttpAgent({ 
    host: hostUrl,
    fetch: fetch,
    identity: identity,
  });

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

const uploadWasm = async () => {
  console.log('\n=== Loading Identity ===');
  const identity = loadIdentity();
  console.log('='.repeat(50) + '\n');
  
  let tokenFactory = null;
  let workingEndpoint = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const agent = await createAgent(endpoint, identity);
      tokenFactory = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      });
      
      await tokenFactory.hasWasm(); // Test connection
      workingEndpoint = endpoint;
      console.log(`Connected successfully to: ${endpoint}\n`);
      break;
    } catch (error) {
      console.log(`Failed to connect to ${endpoint}: ${error.message}`);
      continue;
    }
  }

  if (!tokenFactory) {
    console.error("Could not connect to any IC endpoint.");
    return;
  }

  try {
    console.log("Checking if WASM is already uploaded...");
    const hasWasm = await tokenFactory.hasWasm();
    
    if (hasWasm) {
      console.log("✓ WASM already uploaded!");
    } else {
      console.log("WASM not found, starting upload...\n");
      const wasmBlob = await processWasmFile(wasmFilePath);

      console.log(`\nUploading ${wasmBlob.length} bytes to ${canisterId}...`);
      console.log("This may take a minute...\n");

      const result = await tokenFactory.uploadWasm(wasmBlob);

      if ("ok" in result) {
        console.log("✓ WASM Upload Success!");
        console.log("  Message:", result.ok);
      } else if ("err" in result) {
        console.error("✗ WASM Upload Error:", result.err);
        return;
      }
    }

    console.log("\n=== Factory Status ===");
    const factoryPrincipal = await tokenFactory.getFactoryPrincipal();
    console.log(`Factory Principal: ${factoryPrincipal}`);
    console.log(`WASM Status: ${await tokenFactory.hasWasm() ? "✓ Uploaded" : "✗ Missing"}`);

  } catch (error) {
    console.error("\n✗ Operation failed:", error.message);
    
    if (error.message?.includes("Only controller")) {
      console.log("\nThe identity being used is not a controller of the canister.");
      console.log("Current identity principal:", identity.getPrincipal().toText());
      console.log("\nTo fix this, run:");
      console.log(`  dfx canister update-settings TFactory --add-controller ${identity.getPrincipal().toText()}`);
    }
  }
};

const main = async () => {
  console.log("TokenFactory WASM Upload");
  console.log("=".repeat(50));
  
  await uploadWasm();
  
  console.log("\n" + "=".repeat(50));
  console.log("Upload process completed!");
};

main().catch(console.error);