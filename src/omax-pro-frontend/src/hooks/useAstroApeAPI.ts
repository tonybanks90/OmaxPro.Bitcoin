import { useQuery } from '@tanstack/react-query';
import { TokenData, APIResponse } from '@/types';

async function fetchAstroApeTokens(): Promise<TokenData[]> {
  const response = await fetch('/api/astroape/tokens');
  if (!response.ok) {
    throw new Error(`Failed to fetch AstroApe tokens: ${response.statusText}`);
  }
  const result: APIResponse<TokenData[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch AstroApe tokens');
  }
  return result.data;
}

export function useAstroApeAPI() {
  const {
    data: tokens = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['astroape', 'tokens'],
    queryFn: fetchAstroApeTokens,
    refetchInterval: 5000,
  });

  return {
    tokens,
    isLoading,
    error,
    refetch
  };
}
