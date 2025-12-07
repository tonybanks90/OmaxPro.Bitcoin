// hooks/useWalletActor.ts
import { HttpAgent, Actor, type Identity, AnonymousIdentity } from "@dfinity/agent";
import { useState, useCallback, useRef } from "react";
import { Principal } from "@dfinity/principal";
import { idlFactory, canisterId } from "../../../declarations/WalletTracker";
import type { _SERVICE } from "../../../declarations/WalletTracker/WalletTracker.did";

// Use environment variable or fallback to generated canister ID
const CANISTER_ID = import.meta.env.VITE_WALLET_CANISTER_ID || canisterId || "2v4zk-a7777-77774-qabaq-cai";

if (!CANISTER_ID) {
  console.error("⚠️ Canister ID not configured!");
}

const getHost = () => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_IC_HOST === 'mainnet') {
    return 'https://ic0.app';
  }
  const replicaPort = process.env.REACT_APP_REPLICA_PORT || '5173';
  return `http://localhost:${replicaPort}`;
};

const createAgent = async (identity?: Identity): Promise<HttpAgent> => {
  const host = getHost();
  const isLocalDevelopment = process.env.NODE_ENV !== 'production' && !process.env.REACT_APP_IC_HOST;

  // Use AnonymousIdentity for local development to avoid delegation verification issues
  // but only if an identity (from II) is provided.
  // If no identity is provided (e.g., initial load), still use the anonymous agent.
  const agentIdentity = (identity && isLocalDevelopment)
    ? new AnonymousIdentity() // Use anonymous identity for local dev to bypass delegation
    : identity; // Otherwise, use the provided identity (for production or if no identity is given)

  const agent = new HttpAgent({
    host,
    identity: agentIdentity, // Use the determined identity
  });

  // IMPORTANT: Fetch root key in local development
  if (isLocalDevelopment) { // Simplified condition
    try {
      console.log('🔑 Fetching root key for local development...');
      await agent.fetchRootKey();
      console.log('✅ Root key fetched successfully');
    } catch (error) {
      console.error("❌ Failed to fetch root key:", error);
      throw new Error("Failed to fetch root key. Is your local replica running?");
    }
  }

  return agent;
};

export function useWalletActor() {
  const [actor, setActor] = useState<_SERVICE | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track what we've already initialized
  const initializationState = useRef<{
    lastIdentity: Identity | null;
    hasInitialized: boolean;
  }>({ lastIdentity: null, hasInitialized: false });

  const initializeActor = useCallback(async (userIdentity?: Identity) => {
    // Prevent reinitializing if we're already initializing
    if (isInitializing) {
      console.log('⏳ Already initializing, skipping...');
      return;
    }

    // Prevent redundant initialization with the same identity
    if (
      initializationState.current.hasInitialized &&
      initializationState.current.lastIdentity === userIdentity
    ) {
      console.log('✅ Already initialized with this identity, skipping...');
      return;
    }

    console.log('🚀 Initializing actor...', { hasIdentity: !!userIdentity });
    setIsInitializing(true);
    setError(null);

    try {
      const newAgent = await createAgent(userIdentity);

      const newActor = Actor.createActor<_SERVICE>(idlFactory, {
        agent: newAgent,
        canisterId: CANISTER_ID,
      });

      console.log('✅ Actor created successfully');

      // CRITICAL FIX: Set the actor BEFORE testing it
      // This way even if the test fails, the actor is available
      setActor(newActor);
      setIsAuthenticated(!!userIdentity);

      // Update ref to track successful initialization
      initializationState.current = {
        lastIdentity: userIdentity || null,
        hasInitialized: true,
      };

      // Test the connection (but don't fail if this doesn't work)
      if (userIdentity) {
        try {
          const principal = userIdentity.getPrincipal();
          console.log('🔍 Testing connection with principal:', principal.toText());
          const count = await newActor.getUserWalletCount(principal);
          console.log(`✅ Connection test successful! Wallet count: ${count}`);
        } catch (testError: unknown) {
          const errorMsg = testError instanceof Error ? testError.message : String(testError);
          console.warn("⚠️ Actor connection test failed:", errorMsg);

          // DON'T throw here - the actor might still work for updates
          // Query calls might fail in local dev but update calls work
          if (errorMsg.includes("Canister not found")) {
            console.error(`❌ Canister ${CANISTER_ID} not found. Please deploy your canister.`);
            setError(`Canister ${CANISTER_ID} not found or not deployed`);
          } else {
            console.log('ℹ️ Query test failed, but actor may still work for updates');
          }
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("❌ Failed to initialize actor:", errorMessage);
      setError(errorMessage);
      setActor(null);
      setIsAuthenticated(false);

      // Reset initialization state on error to allow retry
      initializationState.current = {
        lastIdentity: null,
        hasInitialized: false,
      };
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  const authenticate = useCallback(async (userIdentity: Identity) => {
    console.log('🔐 Authenticating with identity...');
    await initializeActor(userIdentity);
  }, [initializeActor]);

  const clearAuth = useCallback(() => {
    console.log('🔓 Clearing authentication...');
    setActor(null);
    setIsAuthenticated(false);
    setError(null);
    initializationState.current = {
      lastIdentity: null,
      hasInitialized: false,
    };
  }, []);

  return {
    actor,
    isInitializing,
    isAuthenticated,
    isReady: !!actor,
    error,
    authenticate,
    clearAuth,
    canisterId: CANISTER_ID,
  };
}