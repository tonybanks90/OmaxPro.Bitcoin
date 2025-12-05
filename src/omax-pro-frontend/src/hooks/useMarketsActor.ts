// src/hooks/useMarketsActor.ts
import { createActorHook } from "ic-use-actor";
import { idlFactory, canisterId } from '../../../declarations/Markets';
import type { _SERVICE } from '../../../declarations/Markets/Markets.did';

// Configure your canister ID and network
const CANISTER_ID = process.env.VITE_MARKET_CANISTER_ID || canisterId || 'uzt4z-lp777-77774-qaabq-cai';

const HOST = process.env.NODE_ENV === 'production'
    ? 'https://ic0.app'
    : 'http://localhost:4943';

// Create the actor hook
export const useMarketsActor = createActorHook<_SERVICE>({
    canisterId: CANISTER_ID,
    idlFactory,
    httpAgentOptions: {
        host: HOST,
        // Only fetch root key in development
        ...(process.env.NODE_ENV === 'development' && {
            fetchRootKey: true
        }),
    },
});

// Export non-React helpers for use outside components
export const MarketsActorService = {
    // Wait for actor to be ready
    ensureReady: () => useMarketsActor.ensureInitialized(),

    // Get actor instance
    getActor: () => useMarketsActor.getActor(),

    // Check if authenticated
    isAuthenticated: () => useMarketsActor.isAuthenticated(),

    // Authenticate with identity
    authenticate: (identity: any) => useMarketsActor.authenticate(identity),

    // Check initialization status
    isReady: () => useMarketsActor.isSuccess(),
    isInitializing: () => useMarketsActor.isInitializing(),
    hasError: () => useMarketsActor.isError(),
};
