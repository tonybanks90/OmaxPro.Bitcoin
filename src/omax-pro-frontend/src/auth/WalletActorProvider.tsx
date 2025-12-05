// src/omax-pro-frontend/src/auth/WalletActorProvider.tsx
import React, { createContext, useContext } from 'react';
import { useWalletActor, type _SERVICE } from '../hooks/useWalletActor';

interface WalletActorContextType {
  actor: _SERVICE | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  error: string | null;
  authenticate: (identity: any) => Promise<void>;
  clearAuth: () => void;
  canisterId: string;
}

const WalletActorContext = createContext<WalletActorContextType | undefined>(undefined);

export const WalletActorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const walletActor = useWalletActor();

  return (
    <WalletActorContext.Provider value={walletActor}>
      {children}
    </WalletActorContext.Provider>
  );
};

export const useWallet = (): WalletActorContextType => {
  const context = useContext(WalletActorContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletActorProvider');
  }
  return context;
};
