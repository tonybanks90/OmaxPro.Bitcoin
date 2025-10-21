// hooks/useWalletActor.ts - FIXED CONNECTION HANDLING
import { HttpAgent, Actor, type Identity } from "@dfinity/agent";
import { useState, useEffect, useCallback, useRef } from "react";
import { Principal } from "@dfinity/principal";

// IDL Factory matching your canister interface
export const idlFactory = ({ IDL }: { IDL: any }) => {
  return IDL.Service({
    'addWalletEntry' : IDL.Func([IDL.Principal, IDL.Text, IDL.Text], [], []),
    'getUserWalletCount' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'getUserWallets' : IDL.Func([IDL.Principal], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], ['query']),
    'getWalletEntry' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'removeWalletEntry' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Bool], []),
    'searchUserWallets' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], ['query']),
    'updateWalletName' : IDL.Func([IDL.Principal, IDL.Text, IDL.Text], [IDL.Bool], []),
  });
};

export interface _SERVICE {
  'addWalletEntry' : (userPrincipal: Principal, address: string, name: string) => Promise<void>,
  'getUserWalletCount' : (userPrincipal: Principal) => Promise<bigint>,
  'getUserWallets' : (userPrincipal: Principal) => Promise<Array<[string, string]>>,
  'getWalletEntry' : (userPrincipal: Principal, address: string) => Promise<[] | [string]>,
  'removeWalletEntry' : (userPrincipal: Principal, address: string) => Promise<boolean>,
  'searchUserWallets' : (userPrincipal: Principal, searchTerm: string) => Promise<Array<[string, string]>>,
  'updateWalletName' : (userPrincipal: Principal, address: string, newName: string) => Promise<boolean>,
}

const CANISTER_ID = process.env.REACT_APP_WALLET_CANISTER_ID || "di5fv-gqaaa-aaaai-atlja-cai";

if (!CANISTER_ID) {
  console.error("⚠️ Canister ID not configured!");
  throw new Error("Canister ID not found. Please set REACT_APP_WALLET_CANISTER_ID environment variable.");
}

const getHost = () => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_IC_HOST === 'mainnet') {
    return 'https://ic0.app';
  }
  const replicaPort = process.env.REACT_APP_REPLICA_PORT || '4943';
  return `http://localhost:${replicaPort}`;
};

const createAgent = async (identity?: Identity): Promise<HttpAgent> => {
  const host = getHost();
  
  const agent = new HttpAgent({
    host,
    identity,
  });

  // IMPORTANT: Fetch root key in local development
  if (process.env.NODE_ENV !== 'production' && !process.env.REACT_APP_IC_HOST) {
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