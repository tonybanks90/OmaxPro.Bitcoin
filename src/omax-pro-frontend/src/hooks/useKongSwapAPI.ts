
import { useQuery } from '@tanstack/react-query';
import type { TokenData, APIResponse } from '../types';

async function fetchKongSwapTokens(): Promise<TokenData[]> {
  const response = await fetch('/api/kongswap/tokens');
  if (!response.ok) {
    throw new Error(`Failed to fetch KongSwap tokens: ${response.statusText}`);
  }
  const result: APIResponse<TokenData[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch KongSwap tokens');
  }
  return result.data;
}

export function useKongSwapAPI() {
  const {
    data: tokens = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['kongswap', 'tokens'],
    queryFn: fetchKongSwapTokens,
    refetchInterval: 5000,
  });

  return {
    tokens,
    isLoading,
    error,
    refetch
  };
}
