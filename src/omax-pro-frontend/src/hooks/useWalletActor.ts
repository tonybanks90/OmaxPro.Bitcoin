// hooks/useWalletActor.ts
import { createActorHook } from "ic-use-actor";
import { idlFactory, canisterId } from "../../../declarations/WalletTracker";
import type { _SERVICE } from "../../../declarations/WalletTracker/WalletTracker.did";

// Use environment variable or fallback to generated canister ID
const CANISTER_ID = import.meta.env.VITE_WALLET_CANISTER_ID || canisterId || "uxrrr-q7777-77774-qaaaq-cai";

const getHost = () => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_IC_HOST === 'mainnet') {
    return 'https://ic0.app';
  }
  const replicaPort = process.env.REACT_APP_REPLICA_PORT || '5173';
  return `http://localhost:${replicaPort}`;
};

export const useWalletActor = createActorHook<_SERVICE>({
  canisterId: CANISTER_ID,
  idlFactory,
  httpAgentOptions: {
    host: getHost(),
    ...(process.env.NODE_ENV === 'development' && { fetchRootKey: true }),
  }
});

// Export non-React helpers for use outside components
export const WalletActorService = {
  ensureReady: () => useWalletActor.ensureInitialized(),
  getActor: () => useWalletActor.getActor(),
  isAuthenticated: () => useWalletActor.isAuthenticated(),
  authenticate: (identity: any) => useWalletActor.authenticate(identity),
  isReady: () => useWalletActor.isSuccess(),
  isInitializing: () => useWalletActor.isInitializing(),
  hasError: () => useWalletActor.isError(),
};