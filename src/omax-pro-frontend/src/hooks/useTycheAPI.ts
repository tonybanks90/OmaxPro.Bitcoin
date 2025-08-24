import { useQuery } from '@tanstack/react-query';
import { TokenData, APIResponse } from '@/types';

async function fetchTycheTokens(): Promise<TokenData[]> {
  const response = await fetch('/api/tyche/tokens');
  if (!response.ok) {
    throw new Error(`Failed to fetch Tyche tokens: ${response.statusText}`);
  }
  const result: APIResponse<TokenData[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch Tyche tokens');
  }
  return result.data;
}

export function useTycheAPI() {
  const {
    data: tokens = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tyche', 'tokens'],
    queryFn: fetchTycheTokens,
    refetchInterval: 5000,
  });

  return {
    tokens,
    isLoading,
    error,
    refetch
  };
}
