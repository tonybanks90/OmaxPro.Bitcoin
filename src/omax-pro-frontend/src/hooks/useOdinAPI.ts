import { useQuery } from '@tanstack/react-query';
import { TokenData, APIResponse } from '@/types';

async function fetchOdinTokens(): Promise<TokenData[]> {
  const response = await fetch('/api/odin/tokens');
  if (!response.ok) {
    throw new Error(`Failed to fetch Odin tokens: ${response.statusText}`);
  }
  const result: APIResponse<TokenData[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch Odin tokens');
  }
  return result.data;
}

export function useOdinAPI() {
  const {
    data: tokens = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['odin', 'tokens'],
    queryFn: fetchOdinTokens,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  return {
    tokens,
    isLoading,
    error,
    refetch
  };
}
