import { useQuery } from '@tanstack/react-query';
import type { TokenData, APIResponse } from '../types';

async function fetchToken(id: string): Promise<TokenData | null> {
  try {
    const response = await fetch(`/api/token/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Token not found
      }
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    const result: APIResponse<TokenData> = await response.json();
    if (!result.success || !result.data) {
      return null;
    }
    return result.data;
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
}

export function useTokenAPI(id: string) {
  const {
    data: token,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['token', id],
    queryFn: () => fetchToken(id),
    enabled: !!id, // Only run query if id exists
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  return {
    token,
    isLoading,
    error,
    refetch
  };
}