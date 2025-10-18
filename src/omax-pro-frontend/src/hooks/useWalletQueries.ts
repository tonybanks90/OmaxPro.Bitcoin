// src/hooks/useWalletQueries.ts - Corrected version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWalletActor } from './useWalletActor';
import { WalletService, type WalletEntry } from '../services/walletService';

// Query Keys
export const WALLET_QUERY_KEYS = {
  wallets: {
    all: (userPrincipal: string) => ['wallets', userPrincipal] as const,
    search: (userPrincipal: string, searchTerm: string) => ['wallets', userPrincipal, 'search', searchTerm] as const,
    byAddress: (userPrincipal: string, address: string) => ['wallets', userPrincipal, 'address', address] as const,
    count: (userPrincipal: string) => ['wallets', userPrincipal, 'count'] as const,
  },
} as const;

// Custom hooks for wallet data fetching
export function useUserWallets(userPrincipal: string, searchTerm?: string, options?: { enabled?: boolean }) {
  const { isSuccess } = useWalletActor();
  
  return useQuery({
    queryKey: searchTerm 
      ? WALLET_QUERY_KEYS.wallets.search(userPrincipal, searchTerm)
      : WALLET_QUERY_KEYS.wallets.all(userPrincipal),
    queryFn: async (): Promise<WalletEntry[]> => {
      if (searchTerm?.trim()) {
        return await WalletService.searchWallets(userPrincipal, searchTerm);
      }
      return await WalletService.getUserWallets(userPrincipal);
    },
    enabled: isSuccess && !!userPrincipal && (options?.enabled !== false),
    staleTime: 30000, // 30 seconds
    retry: 3,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useWalletEntry(userPrincipal: string, address: string) {
  const { isSuccess } = useWalletActor();
  
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.wallets.byAddress(userPrincipal, address),
    queryFn: () => WalletService.getWalletEntry(userPrincipal, address),
    enabled: isSuccess && !!userPrincipal && !!address,
    staleTime: 60000, // 1 minute
    retry: 3,
  });
}

export function useWalletCount(userPrincipal: string, options?: { enabled?: boolean }) {
  const { isSuccess } = useWalletActor();
  
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.wallets.count(userPrincipal),
    queryFn: () => WalletService.getUserWalletCount(userPrincipal),
    enabled: isSuccess && !!userPrincipal && (options?.enabled !== false),
    staleTime: 60000, // 1 minute
    retry: 3,
  });
}

// Mutation hooks for wallet operations
export function useAddWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userPrincipal, address, name }: { 
      userPrincipal: string; 
      address: string; 
      name: string; 
    }) => {
      // Validate inputs
      if (!WalletService.validateWalletAddress(address)) {
        throw new Error('Invalid wallet address format');
      }
      if (!WalletService.validateWalletName(name)) {
        throw new Error('Invalid wallet name (must be 1-50 characters)');
      }
      
      return WalletService.addWallet(userPrincipal, address, name);
    },
    onSuccess: (_, variables) => {
      // Invalidate all wallet queries for this user
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.all(variables.userPrincipal) 
      });
      queryClient.invalidateQueries({ 
        queryKey: WALLET_QUERY_KEYS.wallets.count(variables.userPrincipal) 
      });
      
      console.log(`Successfully added wallet: ${variables.name}`);
    },
    onError: (error) => {
      console.error('Failed to add wallet:', error);
    },
  });
}

export function useRemoveWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userPrincipal, address }: { 
      userPrincipal: string; 
      address: string; 
    }) => WalletService.removeWallet(userPrincipal, address),
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate all wallet queries for this user
        queryClient.invalidateQueries({ 
          queryKey: WALLET_QUERY_KEYS.wallets.all(variables.userPrincipal) 
        });
        queryClient.invalidateQueries({ 
          queryKey: WALLET_QUERY_KEYS.wallets.count(variables.userPrincipal) 
        });
        
        console.log(`Successfully removed wallet: ${variables.address}`);
      } else {
        throw new Error('Failed to remove wallet');
      }
    },
    onError: (error) => {
      console.error('Failed to remove wallet:', error);
    },
  });
}

export function useUpdateWalletName() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userPrincipal, address, newName }: { 
      userPrincipal: string; 
      address: string; 
      newName: string; 
    }) => {
      // Validate name
      if (!WalletService.validateWalletName(newName)) {
        throw new Error('Invalid wallet name (must be 1-50 characters)');
      }
      
      return WalletService.updateWalletName(userPrincipal, address, newName);
    },
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate all wallet queries for this user
        queryClient.invalidateQueries({ 
          queryKey: WALLET_QUERY_KEYS.wallets.all(variables.userPrincipal) 
        });
        queryClient.invalidateQueries({ 
          queryKey: WALLET_QUERY_KEYS.wallets.byAddress(variables.userPrincipal, variables.address) 
        });
        
        console.log(`Successfully updated wallet name: ${variables.address} -> ${variables.newName}`);
      } else {
        throw new Error('Failed to update wallet name');
      }
    },
    onError: (error) => {
      console.error('Failed to update wallet name:', error);
    },
  });
}

// Utility hooks
export function useRefreshWallets(userPrincipal: string) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ 
      queryKey: WALLET_QUERY_KEYS.wallets.all(userPrincipal) 
    });
    queryClient.invalidateQueries({ 
      queryKey: WALLET_QUERY_KEYS.wallets.count(userPrincipal) 
    });
  };
}

export function usePrefetchWallet(userPrincipal: string, address: string) {
  const queryClient = useQueryClient();
  const { isSuccess } = useWalletActor();
  
  return () => {
    if (isSuccess && userPrincipal && address) {
      queryClient.prefetchQuery({
        queryKey: WALLET_QUERY_KEYS.wallets.byAddress(userPrincipal, address),
        queryFn: () => WalletService.getWalletEntry(userPrincipal, address),
        staleTime: 60000,
      });
    }
  };
}