#!/usr/bin/env node
/**
 * Check Booster Wallet Balance
 * Run with: npx tsx check_booster_balance.ts
 */

import { Ed25519KeyIdentity } from '@dfinity/identity';
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import * as crypto from 'crypto';

// ckTESTBTC Ledger canister
const CKTESTBTC_LEDGER = 'mc6ru-gyaaa-aaaar-qaaaq-cai';
const CKBOOST_BACKEND = '75egi-7qaaa-aaaao-qj6ma-cai';

// Read mnemonic from environment
const mnemonic = process.env.BOOSTER_MNEMONIC;
if (!mnemonic) {
    console.error('❌ BOOSTER_MNEMONIC not set');
    process.exit(1);
}

// Create identity from mnemonic
function createIdentity(mnemonics: string) {
    const words = mnemonics.trim().split(/\s+/);
    const hash = crypto.createHash('sha256');
    hash.update(words.join(' '));
    const seed = hash.digest();
    return Ed25519KeyIdentity.generate(seed);
}

// Minimal ICRC-1 IDL
const icrc1IdlFactory = ({ IDL }: any) => {
    const Account = IDL.Record({
        owner: IDL.Principal,
        subaccount: IDL.Opt(IDL.Vec(IDL.Nat8))
    });
    return IDL.Service({
        icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    });
};

// Minimal CKBoost Backend IDL
const backendIdlFactory = ({ IDL }: any) => {
    const BoostRequest = IDL.Record({
        id: IDL.Nat,
        status: IDL.Variant({
            'active': IDL.Null,
            'cancelled': IDL.Null,
            'pending': IDL.Null,
            'completed': IDL.Null
        }),
        amount: IDL.Nat,
        maxFeePercentage: IDL.Float64,
        owner: IDL.Principal,
        createdAt: IDL.Int,
    });
    return IDL.Service({
        getPendingBoostRequests: IDL.Func([], [IDL.Vec(BoostRequest)], ['query']),
    });
};

async function main() {
    console.log('🔍 Checking Booster Wallet Status...\n');

    const identity = createIdentity(mnemonic!);
    const principal = identity.getPrincipal();

    console.log(`📋 Booster Principal: ${principal.toString()}`);

    const agent = new HttpAgent({
        host: 'https://ic0.app',
        identity
    });

    // Create ledger actor
    const ledger = Actor.createActor(icrc1IdlFactory, {
        agent,
        canisterId: Principal.fromText(CKTESTBTC_LEDGER)
    });

    // Check balance
    const balance = await ledger.icrc1_balance_of({
        owner: principal,
        subaccount: []
    }) as bigint;

    const balanceBTC = Number(balance) / 1e8;
    console.log(`💰 ckTESTBTC Balance: ${balanceBTC.toFixed(8)} ckTESTBTC (${balance.toString()} satoshis)`);

    if (balance === 0n) {
        console.log('\n⚠️  Booster wallet has NO FUNDS!');
        console.log('   The booster cannot accept requests without ckTESTBTC.');
        console.log(`\n   To fund the booster, send ckTESTBTC to:`);
        console.log(`   ${principal.toString()}\n`);
    } else if (balance < 5000000n) {
        console.log('\n⚠️  Low balance - may not be able to accept larger requests');
    } else {
        console.log('\n✅ Booster has sufficient funds to accept requests');
    }

    // Also check pending requests
    console.log('\n📋 Checking Pending Requests...');

    try {
        const backend = Actor.createActor(backendIdlFactory, {
            agent,
            canisterId: Principal.fromText(CKBOOST_BACKEND)
        });

        const pending = await backend.getPendingBoostRequests() as any[];
        console.log(`   Found ${pending.length} pending requests`);

        if (pending.length > 0) {
            console.log('\n   Recent requests:');
            pending.slice(0, 5).forEach((req: any) => {
                const amount = Number(req.amount) / 1e8;
                console.log(`   - ID: ${req.id} | Amount: ${amount.toFixed(8)} | Fee: ${req.maxFeePercentage}% | Owner: ${req.owner.toString().slice(0, 20)}...`);
            });
        }
    } catch (e) {
        console.log('   Could not fetch pending requests');
    }

    console.log('\n✅ Check complete!');
}

main().catch(console.error);
