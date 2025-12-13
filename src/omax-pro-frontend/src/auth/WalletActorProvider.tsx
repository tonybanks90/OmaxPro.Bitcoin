// src/omax-pro-frontend/src/auth/WalletActorProvider.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Actor } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { useWalletActor } from '../hooks/useWalletActor';
import type { _SERVICE } from '../../../declarations/WalletTracker/WalletTracker.did';

// Define context type based on ic-use-actor return type plus helper methods
interface WalletActorContextType {
  actor: _SERVICE | undefined;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  error: Error | undefined;
  authenticate: (identity: any) => Promise<void>;
  // clearAuth is not directly exposed by createActorHook instance, but we can reset
  // or we can just rely on the hook reacting to identity changes if we passed identity to it (which we don't in the provider)
  // Actually, ic-use-actor handles authentication via authenticate()
}

// We'll just export the hook's return type + isReady alias
// But to keep it simple and compatible, we'll map it to a cleaner interface

// Create a deterministic local identity for development (consistent across reloads)
const DEV_SEED = new Uint8Array(32).fill(1); // Simple deterministic seed for dev
const getDevIdentity = () => Ed25519KeyIdentity.generate(DEV_SEED);

const WalletActorContext = createContext<any>(undefined);

export const WalletActorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const walletActor = useWalletActor();
  const hasAutoAuthenticated = useRef(false);

  // Auto-authenticate with local identity in development mode
  useEffect(() => {
    const isLocal = import.meta.env.DEV || import.meta.env.VITE_DFX_NETWORK === 'local';

    if (isLocal && !hasAutoAuthenticated.current && walletActor.authenticate) {
      hasAutoAuthenticated.current = true;
      const devIdentity = getDevIdentity();
      console.log('🔧 [DEV] Auto-authenticating WalletTracker with local Ed25519 identity...');
      console.log('🔧 [DEV] Local principal:', devIdentity.getPrincipal().toText());

      walletActor.authenticate(devIdentity).then(() => {
        console.log('✅ [DEV] WalletTracker authenticated with local identity');
      }).catch((err: any) => {
        console.error('❌ [DEV] Failed to authenticate with local identity:', err);
      });
    }
  }, [walletActor.authenticate]);

  // Fetch root key for local development
  useEffect(() => {
    const isLocal = import.meta.env.DEV || import.meta.env.VITE_DFX_NETWORK === 'local';

    if (isLocal && walletActor.actor) {
      try {
        const agent = Actor.agentOf(walletActor.actor);
        if (agent && typeof agent.fetchRootKey === 'function') {
          console.log('🔑 Fetching root key for local development...');
          (agent as any).fetchRootKey().catch((err: any) => {
            console.warn('⚠️ Failed to fetch root key:', err);
          });
        }
      } catch (e) {
        console.error('Error getting agent from actor:', e);
      }
    }
  }, [walletActor.actor]);

  // Create a compatible context value
  const contextValue = {
    ...walletActor,
    // Map isSuccess to isReady for compatibility if needed, or just use isSuccess
    isReady: walletActor.isSuccess,
    // Map undefined actor to null if components expect null (though undefined is better in TS)
    actor: walletActor.actor || null,
    // Add clearAuth shim if needed, ic-use-actor has specific auth flow
    clearAuth: () => {
      // ic-use-actor doesn't have explicit clearAuth on the hook instance usually, 
      // but it tracks identity. If we want to "logout", we usually invalidate the identity in AuthProvider.
      // However, we can expose a no-op or a method if the hook provides one (like reset)
    }
  };

  return (
    <WalletActorContext.Provider value={contextValue}>
      {children}
    </WalletActorContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletActorContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletActorProvider');
  }
  return context;
};
