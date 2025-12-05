// src/hooks/useTFactoryActor.ts
import { createActorHook } from "ic-use-actor";
import { idlFactory, canisterId } from '../../../declarations/TFactory';
import type { _SERVICE } from '../../../declarations/TFactory/TFactory.did';

// Configure your canister ID and network
const CANISTER_ID = process.env.VITE_PREDICTION_MARKET_FACTORY_CANISTER_ID || canisterId || 'ulvla-h7777-77774-qaacq-cai';

const HOST = process.env.NODE_ENV === 'production'
  ? 'https://ic0.app'
  : 'http://localhost:4943';

// Create the actor hook
export const useTFactoryActor = createActorHook<_SERVICE>({
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
export const TFactoryActorService = {
  // Wait for actor to be ready
  ensureReady: () => useTFactoryActor.ensureInitialized(),

  // Get actor instance
  getActor: () => useTFactoryActor.getActor(),

  // Check if authenticated
  isAuthenticated: () => useTFactoryActor.isAuthenticated(),

  // Authenticate with identity
  authenticate: (identity: any) => useTFactoryActor.authenticate(identity),

  // Check initialization status
  isReady: () => useTFactoryActor.isSuccess(),
  isInitializing: () => useTFactoryActor.isInitializing(),
  hasError: () => useTFactoryActor.isError(),
};