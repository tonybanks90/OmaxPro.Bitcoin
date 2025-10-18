import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCanisterService } from '../../../declarations/WalletTracker/WalletTracker.did';

interface WalletEntry {
  address: string;
  name: string;
}

// Hook for managing user wallets
export function useWalletManager(userPrincipal: string) {
  const queryClient = useQueryClient();

  // Fetch all wallets for the user
  const walletsQuery = useQuery({
    queryKey: ['user-wallets', userPrincipal],
    queryFn: async () => {
      const canisterService = getCanisterService();
      return await canisterService.getUserWallets(userPrincipal);
    },
    enabled: !!userPrincipal,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Search wallets
  const searchWallets = async (searchTerm: string): Promise<WalletEntry[]> => {
    if (!searchTerm.trim()) {
      return walletsQuery.data || [];
    }
    
    const canisterService = getCanisterService();
    return await canisterService.searchWallets(userPrincipal, searchTerm);
  };

  // Add wallet mutation
  const addWalletMutation = useMutation({
    mutationFn: async ({ address, name }: { address: string; name: string }) => {
      const canisterService = getCanisterService();
      await canisterService.addWallet(userPrincipal, address, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', userPrincipal] });
    },
    onError: (error) => {
      console.error('Failed to add wallet:', error);
      throw error;
    },
  });

  // Remove wallet mutation
  const removeWalletMutation = useMutation({
    mutationFn: async (address: string) => {
      const canisterService = getCanisterService();
      return await canisterService.removeWallet(userPrincipal, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', userPrincipal] });
    },
    onError: (error) => {
      console.error('Failed to remove wallet:', error);
      throw error;
    },
  });

  // Update wallet name mutation
  const updateWalletNameMutation = useMutation({
    mutationFn: async ({ address, newName }: { address: string; newName: string }) => {
      const canisterService = getCanisterService();
      return await canisterService.updateWalletName(userPrincipal, address, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', userPrincipal] });
    },
    onError: (error) => {
      console.error('Failed to update wallet name:', error);
      throw error;
    },
  });

  // Get wallet count
  const walletCountQuery = useQuery({
    queryKey: ['user-wallet-count', userPrincipal],
    queryFn: async () => {
      const canisterService = getCanisterService();
      return await canisterService.getWalletCount(userPrincipal);
    },
    enabled: !!userPrincipal,
  });

  return {
    // Data
    wallets: walletsQuery.data || [],
    walletCount: walletCountQuery.data || 0,
    
    // Loading states
    isLoading: walletsQuery.isLoading || walletCountQuery.isLoading,
    isAddingWallet: addWalletMutation.isPending,
    isRemovingWallet: removeWalletMutation.isPending,
    isUpdatingWallet: updateWalletNameMutation.isPending,
    
    // Error states
    error: walletsQuery.error || walletCountQuery.error,
    addError: addWalletMutation.error,
    removeError: removeWalletMutation.error,
    updateError: updateWalletNameMutation.error,
    
    // Actions
    addWallet: addWalletMutation.mutate,
    removeWallet: removeWalletMutation.mutate,
    updateWalletName: updateWalletNameMutation.mutate,
    searchWallets,
    refetch: () => {
      walletsQuery.refetch();
      walletCountQuery.refetch();
    },
  };
}

// Hook for getting a specific wallet
export function useWallet(userPrincipal: string, address: string) {
  return useQuery({
    queryKey: ['wallet-entry', userPrincipal, address],
    queryFn: async () => {
      const canisterService = getCanisterService();
      const name = await canisterService.getWallet(userPrincipal, address);
      return name ? { address, name } : null;
    },
    enabled: !!userPrincipal && !!address,
  });
}

// Hook for wallet search with debouncing
export function useWalletSearch(userPrincipal: string, searchTerm: string, debounceMs: number = 300) {
  return useQuery({
    queryKey: ['wallet-search', userPrincipal, searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        const canisterService = getCanisterService();
        return await canisterService.getUserWallets(userPrincipal);
      }
      
      const canisterService = getCanisterService();
      return await canisterService.searchWallets(userPrincipal, searchTerm);
    },
    enabled: !!userPrincipal,
    // Debounce the search by adding a delay
    refetchOnWindowFocus: false,
    staleTime: debounceMs,
  });
}

// Hook for batch operations
export function useBatchWalletOperations(userPrincipal: string) {
  const queryClient = useQueryClient();

  // Add multiple wallets
  const addMultipleWalletsMutation = useMutation({
    mutationFn: async (wallets: Array<{ address: string; name: string }>) => {
      const canisterService = getCanisterService();
      const promises = wallets.map(({ address, name }) => 
        canisterService.addWallet(userPrincipal, address, name)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', userPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['user-wallet-count', userPrincipal] });
    },
  });

  // Remove multiple wallets
  const removeMultipleWalletsMutation = useMutation({
    mutationFn: async (addresses: string[]) => {
      const canisterService = getCanisterService();
      const promises = addresses.map(address => 
        canisterService.removeWallet(userPrincipal, address)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', userPrincipal] });
      queryClient.invalidateQueries({ queryKey: ['user-wallet-count', userPrincipal] });
    },
  });

  return {
    addMultipleWallets: addMultipleWalletsMutation.mutate,
    removeMultipleWallets: removeMultipleWalletsMutation.mutate,
    isAddingMultiple: addMultipleWalletsMutation.isPending,
    isRemovingMultiple: removeMultipleWalletsMutation.isPending,
    addMultipleError: addMultipleWalletsMutation.error,
    removeMultipleError: removeMultipleWalletsMutation.error,
  };
}

export type { WalletEntry };