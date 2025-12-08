// src/hooks/useLedgerActor.ts
import { createActorHook } from "ic-use-actor";
import { idlFactory } from '../../../declarations/ckbtc_ledger';
import type { _SERVICE } from '../../../declarations/ckbtc_ledger/ckbtc_ledger.did';

// Canister ID for ckBTC Ledger
// Using the ID confirmed by user verification: uxrrr-q7777-77774-qaaaq-cai
// Canister ID for ckBTC Ledger
// Using the ID confirmed by user verification: uxrrr-q7777-77774-qaaaq-cai
const CANISTER_ID = import.meta.env.VITE_CKBTC_LEDGER_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai';

const HOST = import.meta.env.PROD
    ? 'https://ic0.app'
    : 'http://localhost:4943';

// Create the actor hook
export const useLedgerActor = createActorHook<_SERVICE>({
    canisterId: CANISTER_ID,
    idlFactory,
    httpAgentOptions: {
        host: HOST,
        // Only fetch root key in development
        ...(import.meta.env.DEV && {
            fetchRootKey: true
        }),
    },
});

// Export non-React helpers for use outside components
export const LedgerActorService = {
    // Wait for actor to be ready
    ensureReady: () => useLedgerActor.ensureInitialized(),

    // Get actor instance
    getActor: () => useLedgerActor.getActor(),

    // Authenticate with identity
    authenticate: (identity: any) => useLedgerActor.authenticate(identity),
};
