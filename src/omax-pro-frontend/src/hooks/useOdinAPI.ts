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

// New: User Activity Types
interface OdinUserActivityData {
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
  token_name: string;
  token_ticker: string;
  token_image: string;
  token_marketcap: number;
  decimals: number;
  divisibility: number;
}

interface OdinUserActivityResponse {
  data: OdinUserActivityData[];
  count: number;
  page: number;
  limit: number;
}

// Wallet Entry Type for canister integration
interface WalletEntry {
  address: string;
  name: string;
}

interface OdinUserTokenHolding {
  token: OdinTokenData;
  balance: number;
}

interface OdinUserTokensResponse {
  data: OdinUserTokenHolding[];
  count: number;
  page: number;
  limit: number;
}

// API Base URL
const ODIN_API_BASE = "https://api.odin.fun/v1";

// Main tokens fetch function - Updated to support market cap filters
async function fetchOdinTokens(filters: {
  page?: number;
  limit?: number;
  sort?: string;
  bonded?: boolean;
  marketcap_min?: number;
  marketcap_max?: number;
} = {}): Promise<OdinTokensResponse> {
  const searchParams = new URLSearchParams({
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 100).toString(),
    env: "development",
    sort: filters.sort || "marketcap:desc",
  });

  // Add optional filters
  if (filters.bonded !== undefined) {
    searchParams.append('bonded', filters.bonded.toString());
  }
  if (filters.marketcap_min !== undefined) {
    searchParams.append('marketcap_min', filters.marketcap_min.toString());
  }
  if (filters.marketcap_max !== undefined) {
    searchParams.append('marketcap_max', filters.marketcap_max.toString());
  }

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

// NEW: User activity fetch function
async function fetchOdinUserActivity(userPrincipal: string, page: number = 1, limit: number = 50): Promise<OdinUserActivityResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${ODIN_API_BASE}/user/${userPrincipal}/activity?${searchParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user activity: ${response.statusText}`);
  }

  return response.json();
}

async function fetchOdinUserTokens(userPrincipal: string, page: number = 1, limit: number = 100): Promise<OdinUserTokensResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`${ODIN_API_BASE}/user/${userPrincipal}/tokens?${searchParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user tokens: ${response.statusText}`);
  }

  return response.json();
}

// Updated main hook for tokens list with market cap filters support
export function useOdinAPI(filters: {
  page?: number;
  limit?: number;
  sort?: string;
  bonded?: boolean;
  marketcap_min?: number;
  marketcap_max?: number;
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

// NEW: Hook for user activity
export function useOdinUserActivity(userPrincipal: string, page: number = 1, limit: number = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "user_activity", userPrincipal, page, limit],
    queryFn: () => fetchOdinUserActivity(userPrincipal, page, limit),
    refetchInterval: 30000, // 30 seconds
    enabled: !!userPrincipal,
  });

  return {
    activities: data?.data || [],
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

export function useOdinUserTokens(userPrincipal: string, page: number = 1, limit: number = 100, options: { enabled?: boolean } = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "user_tokens", userPrincipal, page, limit],
    queryFn: () => fetchOdinUserTokens(userPrincipal, page, limit),
    refetchInterval: 30000, // 30 seconds
    enabled: !!userPrincipal && (options.enabled !== false),
  });

  return {
    userTokens: data?.data || [],
    totalCount: data?.count || 0,
    page: data?.page || 1,
    limit: data?.limit || 100,
    isLoading,
    error,
    refetch,
  };
}

// Price conversion utilities
const SATOSHI_TO_BTC = 0.00000001;

export interface PriceData {
  satoshis: number;
  btc: number;
  usd: number;
}

export interface EnhancedOdinTokenData extends OdinTokenData {
  // Enhanced price fields with conversions
  priceData: PriceData;
  marketCapData: PriceData;
  volumeData: PriceData;
  // Formatted strings for display
  priceFormatted: {
    sats: string;
    btc: string;
    usd: string;
  };
  marketCapFormatted: {
    sats: string;
    btc: string;
    usd: string;
  };
  volumeFormatted: {
    sats: string;
    btc: string;
    usd: string;
  };
}

// Conversion functions based on confirmed Odin API format
function satoshisToBTC(satoshis: number): number {
  return satoshis * SATOSHI_TO_BTC;
}

function satoshisToUSD(satoshis: number, btcPriceUSD: number): number {
  const btc = satoshisToBTC(satoshis);
  return btc * btcPriceUSD;
}

function parseOdinTokenPrice(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue / 1000; // Token price: API Value ÷ 1000 = sats
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

function parseOdinMarketCap(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue / 1000; // Market cap: API Value ÷ 1000 = sats
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

function parseOdinVolume(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue; // Volume: API Value = sats (no division)
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

// Formatting functions
function formatSatoshis(satoshis: number): string {
  if (satoshis >= 1e9) return `${(satoshis / 1e9).toFixed(2)}B sats`;
  if (satoshis >= 1e6) return `${(satoshis / 1e6).toFixed(2)}M sats`;
  if (satoshis >= 1e3) return `${(satoshis / 1e3).toFixed(2)}K sats`;
  return `${satoshis.toLocaleString()} sats`;
}

function formatBTC(btc: number): string {
  if (btc >= 1) return `${btc.toFixed(4)} BTC`;
  if (btc >= 0.001) return `${btc.toFixed(6)} BTC`;
  return `${btc.toFixed(8)} BTC`;
}

function formatUSD(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(2)}K`;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(6)}`;
}

function formatPriceData(priceData: PriceData) {
  return {
    sats: formatSatoshis(priceData.satoshis),
    btc: formatBTC(priceData.btc),
    usd: formatUSD(priceData.usd)
  };
}

// Bitcoin price fetching (simplified)
async function fetchBTCPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
    if (!response.ok) throw new Error('Coinbase API failed');
    const data = await response.json();
    return parseFloat(data.data.rates.USD);
  } catch {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (!response.ok) throw new Error('CoinGecko API failed');
      const data = await response.json();
      return data.bitcoin.usd;
    } catch {
      return 110000; // Fallback price
    }
  }
}

// Enhanced token data processor
function enhanceTokenData(token: OdinTokenData, btcPriceUSD: number): EnhancedOdinTokenData {
  const priceData = parseOdinTokenPrice(token.price, btcPriceUSD);
  const marketCapData = parseOdinMarketCap(token.marketcap, btcPriceUSD);
  const volumeData = parseOdinVolume(token.volume_24, btcPriceUSD);

  return {
    ...token,
    priceData,
    marketCapData,
    volumeData,
    priceFormatted: formatPriceData(priceData),
    marketCapFormatted: formatPriceData(marketCapData),
    volumeFormatted: formatPriceData(volumeData)
  };
}

// Hook for Bitcoin price
export function useBTCPrice() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['btc-price-usd'],
    queryFn: fetchBTCPrice,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    retry: 2,
  });

  return {
    btcPriceUSD: data || 110000,
    isLoading,
    error
  };
}

// Enhanced main hook with price conversions
export function useEnhancedOdinAPI(filters: {
  page?: number;
  limit?: number;
  sort?: string;
  bonded?: boolean;
  marketcap_min?: number;
  marketcap_max?: number;
} = {}) {
  const { btcPriceUSD } = useBTCPrice();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['odin', 'enhanced-tokens', filters],
    queryFn: () => fetchOdinTokens(filters),
    refetchInterval: 10000,
  });

  const enhancedTokens = data?.data.map(token => enhanceTokenData(token, btcPriceUSD)) || [];

  return {
    tokens: enhancedTokens,
    totalCount: data?.count || 0,
    page: data?.page || 1,
    limit: data?.limit || 100,
    isLoading,
    error,
    refetch,
    btcPriceUSD
  };
}

// You'll need to include your existing types and fetchOdinTokens function here
// Or import them from your existing useOdinAPI file

// Export types for use in other components
export type { 
  OdinTokenData, 
  OdinTradeData, 
  OdinPowerHolderData, 
  OdinUserActivityData,
  OdinUserTokenHolding,
  OdinTokensResponse, 
  OdinTradesResponse, 
  OdinPowerHoldersResponse,
  OdinUserActivityResponse,
  OdinUserTokensResponse,
  WalletEntry
};