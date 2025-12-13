import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

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

interface OdinUserActivityData {
  id: number | string;
  user: string;
  token: OdinTokenData | string; // Can be object in v1 or string id in dev
  time: string;
  action?: 'BUY' | 'SELL' | string; // v1 uses action
  buy?: boolean; // legacy
  amount_btc?: number;
  btc_amount?: number; // v1
  amount_token?: number;
  token_amount?: number; // v1
  price: number;
  bonded: boolean;
  user_username: string;
  user_image: string;
  // These might be nested in token object in v1
  token_name?: string;
  token_ticker?: string;
  token_image?: string;
  token_marketcap?: number;
  decimals?: number;
  divisibility?: number;
}

interface OdinUserActivityResponse {
  data: OdinUserActivityData[];
  count: number;
  page: number;
  limit: number;
}

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

// NEW: Historical trades types
interface OdinHistoricalTrade {
  trade_id: string;
  price: string;
  base_volume: string;
  target_volume: string;
  trade_timestamp: string;
  type: 'buy' | 'sell';
}

interface OdinHistoricalTradesResponse {
  buy: OdinHistoricalTrade[];
  sell: OdinHistoricalTrade[];
}

// Combined historical trade with buy flag
export interface CombinedHistoricalTrade extends OdinHistoricalTrade {
  buy: boolean;
}

// API Base URL
const ODIN_API_BASE = "https://api.odin.fun/v1";

// Main tokens fetch function
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

// NEW: Fetch historical trades with date range
async function fetchOdinHistoricalTrades(
  tickerId: string,
  startTime: Date,
  endTime: Date,
  limit: number = 2000
): Promise<OdinHistoricalTradesResponse> {
  const searchParams = new URLSearchParams({
    ticker_id: tickerId,
    limit: limit.toString(),
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
  });

  const response = await fetch(
    `${ODIN_API_BASE}/tokens/historical_trades?${searchParams}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch historical trades: ${response.statusText}`);
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

// User activity fetch function
export async function fetchOdinUserActivity(userPrincipal: string, page: number = 1, limit: number = 50): Promise<OdinUserActivityResponse> {
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

// User tokens fetch function
async function fetchOdinUserTokens(userPrincipal: string, page: number = 1, limit: number = 100): Promise<OdinUserTokensResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const url = `${ODIN_API_BASE}/user/${userPrincipal}/tokens?${searchParams}`;
  console.log('Fetching Odin tokens for:', url);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch user tokens: ${response.statusText}`);
  }

  return response.json();
}

// Bitcoin price fetching
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
      return 114000; // Fallback price
    }
  }
}

// HOOKS

// Main tokens list hook
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
    refetchInterval: 10000,
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

// Single token hook
export function useOdinToken(tokenId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "token", tokenId],
    queryFn: () => fetchOdinToken(tokenId),
    refetchInterval: 30000,
    enabled: !!tokenId,
  });

  return {
    token: data,
    isLoading,
    error,
    refetch,
  };
}

// Token trades hook (original - for backward compatibility)
export function useOdinTokenTrades(tokenId: string, page: number = 1, limit: number = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "trades", tokenId, page, limit],
    queryFn: () => fetchOdinTokenTrades(tokenId, page, limit),
    refetchInterval: 15000,
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

// NEW: Historical trades hook - Use this for charts!
export function useOdinHistoricalTrades(
  ticker: string,
  tokenId: string,
  timeframeHours: number = 168
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['odin', 'historical_trades', ticker, tokenId, timeframeHours],
    queryFn: async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeframeHours * 60 * 60 * 1000);

      const tickerId = `${ticker}_${tokenId}`;

      return fetchOdinHistoricalTrades(tickerId, startTime, endTime, 2000);
    },
    refetchInterval: 30000,
    enabled: !!ticker && !!tokenId,
    staleTime: 15000,
  });

  // Combine buy and sell trades with buy flag
  const allTrades: CombinedHistoricalTrade[] = [
    ...(data?.buy || []).map(t => ({ ...t, buy: true })),
    ...(data?.sell || []).map(t => ({ ...t, buy: false }))
  ].sort((a, b) => parseInt(a.trade_timestamp) - parseInt(b.trade_timestamp));

  return {
    trades: allTrades,
    buyTrades: data?.buy || [],
    sellTrades: data?.sell || [],
    totalCount: allTrades.length,
    isLoading,
    error,
    refetch,
  };
}

// Token power holders hook
export function useOdinTokenPowerHolders(tokenId: string, page: number = 1, limit: number = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "power_holders", tokenId, page, limit],
    queryFn: () => fetchOdinTokenPowerHolders(tokenId, page, limit),
    refetchInterval: 30000,
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

// User activity hook
export function useOdinUserActivity(userPrincipal: string, page: number = 1, limit: number = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "user_activity", userPrincipal, page, limit],
    queryFn: () => fetchOdinUserActivity(userPrincipal, page, limit),
    refetchInterval: 30000,
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

// User activity infinite hook for pagination
export function useInfiniteOdinUserActivity(userPrincipal: string, limit: number = 50) {
  return useInfiniteQuery({
    queryKey: ["odin", "user_activity_infinite", userPrincipal, limit],
    queryFn: ({ pageParam = 1 }) => fetchOdinUserActivity(userPrincipal, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than limit, we've reached the end
      if (!lastPage.data || lastPage.data.length < limit) return undefined;
      return allPages.length + 1;
    },
    enabled: !!userPrincipal,
    refetchInterval: 60000,
  });
}

// Hook to fetch activity for multiple wallets combined (Infinite)
export function useInfiniteAllWalletsActivity(wallets: { address: string; addedAt?: bigint }[], limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ["odin", "all_wallets_activity_infinite", wallets.map(w => w.address).sort().join(',')],
    queryFn: async ({ pageParam = 1 }) => {
      if (wallets.length === 0) return { data: [], page: pageParam, limit, count: 0 };

      const promises = wallets.map(async (wallet) => {
        try {
          const response = await fetchOdinUserActivity(wallet.address, pageParam as number, limit);
          const activities = response.data || [];

          // Filter by addedAt if available
          if (wallet.addedAt) {
            const addedAtMs = Number(wallet.addedAt) / 1_000_000;
            return activities.filter(activity => {
              const activityTime = new Date(activity.time).getTime();
              return activityTime >= addedAtMs;
            });
          }
          return activities;
        } catch (e) {
          console.error(`Failed to fetch activity for ${wallet.address}`, e);
          return [];
        }
      });

      const results = await Promise.all(promises);
      const allActivities = results.flat();

      // Sort by time descending
      allActivities.sort((a, b) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      // We wrap it in a structure similar to generic response for consistency
      return {
        data: allActivities,
        page: pageParam,
        limit: limit * wallets.length, // approximate limit
        count: allActivities.length // This page count
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Logic for all wallets is trickier because we filter. 
      // But generally if we got 0 items, stop.
      if (!lastPage.data || lastPage.data.length === 0) return undefined;
      return allPages.length + 1;
    },
    enabled: wallets.length > 0,
    refetchInterval: 60000,
  });
}

// Keeping the simple implementation for backward compatibility or small lists
// Hook to fetch activity for multiple wallets combined
export function useAllWalletsActivity(wallets: { address: string; addedAt?: bigint }[]) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "all_wallets_activity", wallets.map(w => w.address).sort().join(',')],
    queryFn: async () => {
      if (wallets.length === 0) return [];

      const promises = wallets.map(async (wallet) => {
        try {
          const response = await fetchOdinUserActivity(wallet.address, 1, 20); // Limit per wallet to avoid huge payload
          const activities = response.data || [];

          // Filter by addedAt if available
          if (wallet.addedAt) {
            const addedAtMs = Number(wallet.addedAt) / 1_000_000;
            return activities.filter(activity => {
              const activityTime = new Date(activity.time).getTime();
              return activityTime >= addedAtMs;
            });
          }
          return activities;
        } catch (e) {
          console.error(`Failed to fetch activity for ${wallet.address}`, e);
          return [];
        }
      });

      const results = await Promise.all(promises);
      const allActivities = results.flat();

      // Sort by time descending
      return allActivities.sort((a, b) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: wallets.length > 0,
  });

  return {
    activities: data || [],
    isLoading,
    error,
    refetch
  };
}

// User tokens hook
export function useOdinUserTokens(userPrincipal: string, page: number = 1, limit: number = 100, options: { enabled?: boolean } = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "user_tokens", userPrincipal, page, limit],
    queryFn: () => fetchOdinUserTokens(userPrincipal, page, limit),
    refetchInterval: 30000,
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

// Bitcoin price hook
export function useBTCPrice() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['btc-price-usd'],
    queryFn: fetchBTCPrice,
    staleTime: 60000,
    refetchInterval: 300000,
    retry: 2,
  });

  return {
    btcPriceUSD: data || 114000,
    isLoading,
    error
  };
}

// PRICE CONVERSION UTILITIES

const SATOSHI_TO_BTC = 0.00000001;
const API_SCALE = 1000; // Odin API values are in millisatoshis (divide by 1000 to get satoshis)

export interface PriceData {
  satoshis: number;
  btc: number;
  usd: number;
}

export interface EnhancedOdinTokenData extends OdinTokenData {
  priceData: PriceData;
  marketCapData: PriceData;
  volumeData: PriceData;
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

function satoshisToBTC(satoshis: number): number {
  return satoshis * SATOSHI_TO_BTC;
}

function satoshisToUSD(satoshis: number, btcPriceUSD: number): number {
  const btc = satoshisToBTC(satoshis);
  return btc * btcPriceUSD;
}

function parseOdinTokenPrice(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue / 1000;
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

function parseOdinMarketCap(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue / 1000;
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

function parseOdinVolume(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue / 1000;
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

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

// TRADE AMOUNT UTILITIES

// Format BTC amount for display (from API millisatoshi format)
export function formatTradeBTC(apiAmountBtc: number, btcPriceUSD?: number) {
  const satoshis = apiAmountBtc / API_SCALE;
  const btc = satoshis * SATOSHI_TO_BTC;
  return {
    satoshis,
    btc,
    usd: btcPriceUSD ? btc * btcPriceUSD : null,
    formatted: btc >= 0.001 ? `${btc.toFixed(6)} BTC` : `${satoshis.toFixed(2)} sats`
  };
}

// Format token amount for display (from API format)
export function formatTradeTokenAmount(apiAmountToken: number, decimals: number = 3) {
  // Token amounts use divisibility(8) + decimals(3) = 10^11 scale
  const divisibility = 8;
  const scale = Math.pow(10, divisibility + decimals);
  return apiAmountToken / scale;
}

// Parse raw API trade amount_btc to satoshis
export function parseApiAmountBtc(apiValue: number): number {
  return apiValue / API_SCALE;
}

function enhanceTokenData(token: OdinTokenData, btcPriceUSD: number): EnhancedOdinTokenData {
  const priceData = parseOdinTokenPrice(token.price, btcPriceUSD);
  const marketCapData = parseOdinMarketCap(token.marketcap, btcPriceUSD);
  // Use volume_24 for 24-hour volume instead of total volume
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

// HELPER FUNCTIONS

// Get image URLs
export function getOdinImageUrl(type: 'token' | 'user', id: string): string {
  return `${ODIN_API_BASE}/${type}/${id}/image`;
}

// Convert historical trade to standard trade format for backward compatibility
// Note: Historical trades from the API already have properly formatted values
export function convertHistoricalTradeToStandard(
  trade: CombinedHistoricalTrade
): OdinTradeData {
  return {
    id: trade.trade_id,
    user: '',
    token: '',
    time: new Date(parseInt(trade.trade_timestamp)).toISOString(),
    buy: trade.buy,
    // base_volume and target_volume from historical API are already in proper format
    amount_btc: parseFloat(trade.base_volume),
    amount_token: parseFloat(trade.target_volume),
    price: parseFloat(trade.price),
    bonded: false,
    user_username: '',
    user_image: '',
    decimals: null,
    divisibility: null,
  };
}

// Export types
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
  OdinHistoricalTrade,
  OdinHistoricalTradesResponse,
  WalletEntry
};