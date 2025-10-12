import { HttpAgent, Actor, type Identity } from "@dfinity/agent";
import { useState, useEffect, useCallback } from "react";
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

// Service interface matching your canister
export interface _SERVICE {
  'addWalletEntry' : (userPrincipal: Principal, address: string, name: string) => Promise<void>,
  'getUserWalletCount' : (userPrincipal: Principal) => Promise<bigint>,
  'getUserWallets' : (userPrincipal: Principal) => Promise<Array<[string, string]>>,
  'getWalletEntry' : (userPrincipal: Principal, address: string) => Promise<[] | [string]>,
  'removeWalletEntry' : (userPrincipal: Principal, address: string) => Promise<boolean>,
  'searchUserWallets' : (userPrincipal: Principal, searchTerm: string) => Promise<Array<[string, string]>>,
  'updateWalletName' : (userPrincipal: Principal, address: string, newName: string) => Promise<boolean>,
}

// Enhanced configuration
const canisterId = "umunu-kh777-77774-qaaca-cai";

if (!canisterId) {
  throw new Error("Canister ID not found. Please check your configuration.");
}

// Get host configuration
const getHost = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://ic0.app';
  }
  return 'http://localhost:4943';
};

// Create agent with proper configuration
const createAgent = async (identity?: Identity): Promise<HttpAgent> => {
  const agent = new HttpAgent({
    host: getHost(),
    identity,
  });

  // Fetch root key for local development
  if (process.env.NODE_ENV !== 'production') {
    try {
      await agent.fetchRootKey();
      console.log('Root key fetched successfully');
    } catch (error) {
      console.warn('Failed to fetch root key:', error);
      // Continue anyway for local development
    }
  }

  return agent;
};

// Custom hook for wallet actor
export function useWalletActor() {
  const [actor, setActor] = useState<_SERVICE | null>(null);
  const [agent, setAgent] = useState<HttpAgent | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize agent and actor
  const initializeActor = useCallback(async (userIdentity?: Identity) => {
    if (isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      console.log('Creating agent with identity:', !!userIdentity);
      const newAgent = await createAgent(userIdentity);
      
      console.log('Creating actor...');
      const newActor = Actor.createActor<_SERVICE>(idlFactory, {
        agent: newAgent,
        canisterId,
      });

      setAgent(newAgent);
      setActor(newActor);
      setIdentity(userIdentity || null);
      setIsAuthenticated(!!userIdentity);
      
      console.log('Actor initialized successfully');
      
      // Test the connection with a simple call if authenticated
      if (userIdentity) {
        try {
          // Try to get the principal to verify the connection works
          const principal = userIdentity.getPrincipal();
          console.log('Identity principal:', principal.toText());
          
          // Test with a simple query - just try to get wallet count
          await newActor.getUserWalletCount(principal);
          console.log('Actor connection test successful');
        } catch (testError) {
          console.warn('Actor connection test failed:', testError);
          // Don't throw here as the actor might still work for other operations
        }
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize actor:', errorMessage);
      setError(errorMessage);
      setActor(null);
      setAgent(null);
      setIdentity(null);
      setIsAuthenticated(false);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  // Authenticate with identity
  const authenticate = useCallback(async (userIdentity: Identity) => {
    console.log('Authenticating with identity...');
    await initializeActor(userIdentity);
  }, [initializeActor]);

  // Initialize without identity (anonymous)
  const initializeAnonymous = useCallback(async () => {
    console.log('Initializing anonymous actor...');
    await initializeActor();
  }, [initializeActor]);

  // Clear authentication
  const clearAuth = useCallback(() => {
    setActor(null);
    setAgent(null);
    setIdentity(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Auto-initialize anonymous actor on mount
  useEffect(() => {
    if (!actor && !isInitializing && !identity) {
      initializeAnonymous();
    }
  }, [actor, isInitializing, identity, initializeAnonymous]);

  return {
    actor,
    agent,
    identity,
    isInitializing,
    isAuthenticated,
    isReady: !!actor,
    error,
    authenticate,
    initializeAnonymous,
    clearAuth,
  };
}