// Updated useWalletQueries.ts - FLOW FIXED
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useWalletActor } from './useWalletActor';
import { WalletService, setGlobalActor, type WalletEntry } from '../services/walletService';

// Query Keys
export const WALLET_QUERY_KEYS = {
  wallets: {
    all: (userPrincipal: string) => ['wallets', userPrincipal] as const,
    search: (userPrincipal: string, searchTerm: string) => ['wallets', userPrincipal, 'search', searchTerm] as const,
    byAddress: (userPrincipal: string, address: string) => ['wallets', userPrincipal, 'address', address] as const,
    count: (userPrincipal: string) => ['wallets', userPrincipal, 'count'] as const,
  },
} as const;

// Enhanced error retry logic
const createRetryConfig = () => ({
  retry: (failureCount: number, error: Error) => {
    if (error.message?.includes('signature') || 
        error.message?.includes('certificate') || 
        error.message?.includes('delegation')) {
      return failureCount < 3;
    }
    return failureCount < 1;
  },
  retryDelay: (attemptIndex: number) => {
    const baseDelay = Math.min(1000 * 2 ** attemptIndex, 10000);
    return baseDelay + Math.random() * 1000;
  },
});

// Custom hook to sync the global actor with the WalletService
export function useWalletActorSync() {
  const { actor, isAuthenticated } = useWalletActor();
  
  useEffect(() => {
    console.log('🔄 Syncing actor state:', { hasActor: !!actor, isAuthenticated });
    setGlobalActor(actor, isAuthenticated);
  }, [actor, isAuthenticated]);
}

// Query hooks
export function useUserWallets(userPrincipal: string, searchTerm?: string, options?: { enabled?: boolean }) {
  const { isReady, isAuthenticated } = useWalletActor();
  
  return useQuery({
    queryKey: searchTerm 
      ? WALLET_QUERY_KEYS.wallets.search(userPrincipal, searchTerm)
      : WALLET_QUERY_KEYS.wallets.all(userPrincipal),
    queryFn: async (): Promise<WalletEntry[]> => {
      if (!isReady || !isAuthenticated) {
        throw new Error('Wallet actor not ready or not authenticated');
      }

      try {
        if (searchTerm?.trim()) {
          return await WalletService.searchWallets(userPrincipal, searchTerm);
        }
        return await WalletService.getUserWallets(userPrincipal);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch wallets:', errorMessage);
        if (errorMessage?.includes('signature') || errorMessage?.includes('certificate')) {
          throw new Error('Authentication session expired. Please reconnect your wallet.');
        }
        throw new Error(errorMessage);
      }
    },
    enabled: isReady && !!userPrincipal && isAuthenticated && (options?.enabled !== false),
    staleTime: 30000,
    ...createRetryConfig(),
    refetchInterval: 60000,
  });
}

export function useWalletCount(userPrincipal: string, options?: { enabled?: boolean }) {
  const { isReady, isAuthenticated } = useWalletActor();
  
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.wallets.count(userPrincipal),
    queryFn: async (): Promise<number> => {
      if (!isReady || !isAuthenticated) {
        throw new Error('Wallet actor not ready or not authenticated');
      }

      try {
        return await WalletService.getUserWalletCount(userPrincipal);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch wallet count:', errorMessage);
        throw new Error(errorMessage);
      }
    },
    enabled: isReady && !!userPrincipal && isAuthenticated && (options?.enabled !== false),
    staleTime: 30000,
    ...createRetryConfig(),
  });
}

export function useWalletEntry(userPrincipal: string, address: string, options?: { enabled?: boolean }) {
  const { isReady, isAuthenticated } = useWalletActor();
  
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.wallets.byAddress(userPrincipal, address),
    queryFn: async (): Promise<string | null> => {
      if (!isReady || !isAuthenticated) {
        throw new Error('Wallet actor not ready or not authenticated');
      }

      try {
        return await WalletService.getWalletEntry(userPrincipal, address);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch wallet entry:', errorMessage);
        throw new Error(errorMessage);
      }
    },
    enabled: isReady && !!userPrincipal && !!address && isAuthenticated && (options?.enabled !== false),
    staleTime: 30000,
    ...createRetryConfig(),
  });
}

// Mutation hooks - FIXED: Don't check isReady at mutation definition time
export function useAddWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userPrincipal, address, name }: { 
      userPrincipal: string; 
      address: string; 
      name: string; 
    }) => {
      // Check happens here, inside the mutation function when it actually runs
      console.log('🚀 Executing addWallet mutation...');
      return await WalletService.addWallet(userPrincipal, address, name);
    },
    onSuccess: (_, variables) => {
      console.log('✅ Wallet added successfully');
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.all(variables.userPrincipal) 
      });
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.count(variables.userPrincipal) 
      });
    },
    onError: (error: Error) => {
      console.error('❌ Add wallet mutation failed:', error.message);
    },
  });
}

export function useRemoveWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userPrincipal, address }: { 
      userPrincipal: string; 
      address: string; 
    }) => {
      console.log('🚀 Executing removeWallet mutation...');
      return await WalletService.removeWallet(userPrincipal, address);
    },
    onSuccess: (_, variables) => {
      console.log('✅ Wallet removed successfully');
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.all(variables.userPrincipal) 
      });
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.count(variables.userPrincipal) 
      });
      queryClient.removeQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.byAddress(variables.userPrincipal, variables.address) 
      });
    },
    onError: (error: Error) => {
      console.error('❌ Remove wallet mutation failed:', error.message);
    },
  });
}

export function useUpdateWalletName() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userPrincipal, address, newName }: { 
      userPrincipal: string; 
      address: string; 
      newName: string; 
    }) => {
      console.log('🚀 Executing updateWalletName mutation...');
      return await WalletService.updateWalletName(userPrincipal, address, newName);
    },
    onSuccess: (_, variables) => {
      console.log('✅ Wallet name updated successfully');
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.all(variables.userPrincipal) 
      });
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.byAddress(variables.userPrincipal, variables.address) 
      });
    },
    onError: (error: Error) => {
      console.error('❌ Update wallet name mutation failed:', error.message);
    },
  });
}

// Batch operations
export function useBatchAddWallets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userPrincipal, 
      wallets, 
      onProgress 
    }: { 
      userPrincipal: string; 
      wallets: WalletEntry[];
      onProgress?: (current: number, total: number, wallet: WalletEntry) => void;
    }) => {
      console.log('🚀 Executing batchAddWallets mutation...');
      return await WalletService.batchAddWallets(userPrincipal, wallets, onProgress);
    },
    onSuccess: (_, variables) => {
      console.log('✅ Batch wallet addition completed');
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.all(variables.userPrincipal) 
      });
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.count(variables.userPrincipal) 
      });
    },
    onError: (error: Error) => {
      console.error('❌ Batch add wallets mutation failed:', error.message);
    },
  });
}

// Export service health check
export function useWalletHealthCheck(userPrincipal: string, options?: { enabled?: boolean }) {
  const { isReady, isAuthenticated } = useWalletActor();
  
  return useQuery({
    queryKey: ['wallet-health', userPrincipal],
    queryFn: async () => {
      if (!isReady || !isAuthenticated) {
        throw new Error('Wallet actor not ready or not authenticated');
      }
      return await WalletService.healthCheck(userPrincipal);
    },
    enabled: isReady && isAuthenticated && !!userPrincipal && (options?.enabled !== false),
    staleTime: 10000,
    refetchInterval: 30000,
    retry: false,
  });
}