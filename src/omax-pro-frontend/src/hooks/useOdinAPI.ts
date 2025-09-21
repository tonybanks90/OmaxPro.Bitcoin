import { useQuery } from '@tanstack/react-query';

// Odin API Types based on real API response
interface OdinTokenData {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  created_time: string;
  volume: number;
  bonded: boolean;
  bonded_time: string;
  icrc_ledger: string;
  price: number;
  marketcap: number;
  rune: string;
  featured: boolean;
  holder_count: number;
  comment_count: number;
  sold: number;
  twitter: string;
  website: string;
  telegram: string;
  last_comment_time: string;
  rel_ledgers: Array<{
    user: string;
    token: string;
    balance: number;
    user_username: string;
    user_image: string;
    tokenid: string;
  }>;
  buy_count: number;
  sell_count: number;
  ticker: string;
  btc_liquidity: number;
  user_btc_liquidity: number;
  user_token_liquidity: number;
  user_lp_tokens: number;
  token_liquidity: number;
  total_supply: number;
  swap_fees: number;
  swap_volume: number;
  swap_fees_24: number;
  threshold: number;
  swap_volume_24: number;
  holder_dev: number;
  holder_top: number;
  txn_count: number;
  decimals: number;
  deposits: boolean;
  divisibility: number;
  external: boolean;
  trading: boolean;
  withdrawals: boolean;
  last_action_time: string;
  price_5m: number;
  price_1h: number;
  price_6h: number;
  price_1d: number;
  rune_id: string;
  twitter_verified: boolean;
  rel_tags: Array<{
    id: number;
    name: string;
    description: string;
    created_time: string;
  }>;
  tags: any;
  verified: boolean;
  liquidity_threshold: number;
  progress: number;
  volume_24: number;
  power_holder_count: number;
}

interface OdinTokensResponse {
  data: OdinTokenData[];
  count: number;
  page: number;
  limit: number;
}

interface OdinTradeData {
  id: string;
  user: string;
  token: string;
  time: string;
  buy: boolean;
  amount_btc: number;
  amount_token: number;
  price: number;
  bonded: boolean;
  user_username: string;
  user_image: string;
  decimals: any;
  divisibility: any;
}

interface OdinTradesResponse {
  data: OdinTradeData[];
  count: number;
  page: number;
  limit: number;
}

interface OdinPowerHolderData {
  user: string;
  token: string;
  balance: number;
  user_username: string;
  user_image: string;
  tokenid: string;
  fiat_value: number;
}

interface OdinPowerHoldersResponse {
  data: OdinPowerHolderData[];
  count: number;
  page: number;
  limit: number;
}

// API Base URL
const ODIN_API_BASE = "https://api.odin.fun/v1";

// Main tokens fetch function
async function fetchOdinTokens(filters: {
  page?: number;
  limit?: number;
  sort?: string;
  bonded?: boolean;
} = {}): Promise<OdinTokensResponse> {
  const searchParams = new URLSearchParams({
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 100).toString(),
    env: "development",
    sort: filters.sort || "marketcap:desc",
    ...(filters.bonded !== undefined && { bonded: filters.bonded.toString() }),
  });

  const response = await fetch(`${ODIN_API_BASE}/tokens?${searchParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Odin tokens: ${response.statusText}`);
  }

  return response.json();
}

// Single token fetch function
async function fetchOdinToken(tokenId: string): Promise<OdinTokenData> {
  const response = await fetch(
    `${ODIN_API_BASE}/token/${tokenId}?env=development`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }

  return response.json();
}

// Token trades fetch function
async function fetchOdinTokenTrades(tokenId: string, page: number = 1, limit: number = 50): Promise<OdinTradesResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${ODIN_API_BASE}/token/${tokenId}/trades?${searchParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch token trades: ${response.statusText}`);
  }

  return response.json();
}

// Token power holders fetch function
async function fetchOdinTokenPowerHolders(tokenId: string, page: number = 1, limit: number = 50): Promise<OdinPowerHoldersResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${ODIN_API_BASE}/token/${tokenId}/power_holders?${searchParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch power holders: ${response.statusText}`);
  }

  return response.json();
}

// Main hook for tokens list
export function useOdinAPI(filters: {
  page?: number;
  limit?: number;
  sort?: string;
  bonded?: boolean;
} = {}) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['odin', 'tokens', filters],
    queryFn: () => fetchOdinTokens(filters),
    refetchInterval: 10000, // Real-time updates every 10 seconds
  });

  return {
    tokens: data?.data || [],
    totalCount: data?.count || 0,
    page: data?.page || 1,
    limit: data?.limit || 100,
    isLoading,
    error,
    refetch
  };
}

// Hook for single token
export function useOdinToken(tokenId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "token", tokenId],
    queryFn: () => fetchOdinToken(tokenId),
    refetchInterval: 30000, // 30 seconds
    enabled: !!tokenId,
  });

  return {
    token: data,
    isLoading,
    error,
    refetch,
  };
}

// Hook for token trades
export function useOdinTokenTrades(tokenId: string, page: number = 1, limit: number = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "trades", tokenId, page, limit],
    queryFn: () => fetchOdinTokenTrades(tokenId, page, limit),
    refetchInterval: 15000, // 15 seconds
    enabled: !!tokenId,
  });

  return {
    trades: data?.data || [],
    totalCount: data?.count || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    isLoading,
    error,
    refetch,
  };
}

// Hook for token power holders
export function useOdinTokenPowerHolders(tokenId: string, page: number = 1, limit: number = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "power_holders", tokenId, page, limit],
    queryFn: () => fetchOdinTokenPowerHolders(tokenId, page, limit),
    refetchInterval: 30000, // 30 seconds
    enabled: !!tokenId,
  });

  return {
    powerHolders: data?.data || [],
    totalCount: data?.count || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    isLoading,
    error,
    refetch,
  };
}

// Helper function to get image URLs
export function getOdinImageUrl(type: 'token' | 'user', id: string): string {
  return `${ODIN_API_BASE}/${type}/${id}/image`;
}

// Export types for use in other components
export type { OdinTokenData, OdinTradeData, OdinPowerHolderData, OdinTokensResponse, OdinTradesResponse, OdinPowerHoldersResponse };
