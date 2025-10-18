import { createActorHook } from "ic-use-actor";
import { idlFactory } from '../../../declarations/WalletTracker'; // Adjust path as needed
import type { _SERVICE } from '../../../declarations/WalletTracker/WalletTracker.did';

// --- START CHANGES ---

// 1. Get the canister ID from environment variables provided by dfx.
//    The variable name is CANISTER_ID_{CANISTER_NAME_IN_UPPERCASE}.
//    Your canister name seems to be 'WalletTracker' based on your import path.
const canisterId = "uxrrr-q7777-77774-qaaaq-cai";


if (!canisterId) {
  throw new Error("CANISTER_ID_WALLETTRACKER environment variable not set.");
}

const host = process.env.NODE_ENV === 'production' 
  ? 'https://icp-api.io' // Use a reliable mainnet boundary node
  : 'http://localhost:4943';

// 2. Use the dynamically loaded canisterId and host.
export const useWalletActor = createActorHook<_SERVICE>({
  canisterId,
  idlFactory,
  httpAgentOptions: {
    host: host,
    // This part is correct and essential for local development!
    ...(process.env.NODE_ENV !== 'production' && { fetchRootKey: true }),
  },
});

// --- END CHANGES ---

// This part remains the same.
export const WalletActorService = {
  ensureReady: () => useWalletActor.ensureInitialized(),
  getActor: () => useWalletActor.getActor(),
  isAuthenticated: () => useWalletActor.isAuthenticated(),
  authenticate: (identity: any) => useWalletActor.authenticate(identity),
  isReady: () => useWalletActor.isSuccess(),
  isInitializing: () => useWalletActor.isInitializing(),
  hasError: () => useWalletActor.isError(),
};
