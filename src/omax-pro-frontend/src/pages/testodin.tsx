import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, TrendingUp, TrendingDown, Users, DollarSign, Activity, Twitter, Globe, MessageCircle } from 'lucide-react';

// Types (same as in the hook)
interface TokenData {
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
  verified: boolean;
  liquidity_threshold: number;
  progress: number;
  volume_24: number;
  power_holder_count: number;
}

interface TokensResponse {
  data: TokenData[];
  count: number;
  page: number;
  limit: number;
}

interface TokensParams {
  page?: number;
  limit?: number;
  env?: 'development' | 'production';
  sort?: string;
  bonded?: boolean;
}

// API functions
const ODIN_API_BASE = 'https://api.odin.fun/v1';

async function fetchOdinTokens(params: TokensParams = {}): Promise<TokensResponse> {
  const searchParams = new URLSearchParams();
  
  const defaultParams = {
    page: 1,
    limit: 10,
    env: 'development' as const,
    sort: 'marketcap:desc',
    bonded: true,
    ...params
  };

  Object.entries(defaultParams).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`${ODIN_API_BASE}/tokens?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Odin tokens: ${response.statusText}`);
  }
  
  return response.json();
}

// Hook
function useOdinTokens(params: TokensParams = {}) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['odin', 'tokens', params],
    queryFn: () => fetchOdinTokens(params),
    refetchInterval: 30000, // 30 seconds for demo
  });

  return {
    tokens: data?.data || [],
    totalCount: data?.count || 0,
    currentPage: data?.page || 1,
    limit: data?.limit || 10,
    isLoading,
    error,
    refetch
  };
}

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatPrice(price: number): string {
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
}

function getPriceChange(current: number, previous: number): { percentage: number; isPositive: boolean } {
  if (previous === 0) return { percentage: 0, isPositive: true };
  const percentage = ((current - previous) / previous) * 100;
  return { percentage, isPositive: percentage >= 0 };
}

// Token Card Component
function TokenCard({ token }: { token: TokenData }) {
  const priceChange24h = getPriceChange(token.price, token.price_1d);
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={`${ODIN_API_BASE}/token/${token.id}/image`}
              alt={token.name}
              className="w-12 h-12 rounded-full object-cover bg-gray-100"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiI+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+CjwvY2lyY2xlPgo8L3N2Zz4KPC9zdmc+';
              }}
            />
            {token.verified && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{token.name}</h3>
            <p className="text-sm text-gray-500">${token.ticker}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          {token.bonded && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Bonded
            </span>
          )}
          {token.featured && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {token.description || 'No description available'}
      </p>

      {/* Price & Market Data */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-medium">Price</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">${formatPrice(token.price)}</p>
          <div className="flex items-center space-x-2 mt-1">
            <div className={`flex items-center space-x-1 ${priceChange24h.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange24h.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-xs font-medium">
                {Math.abs(priceChange24h.percentage).toFixed(1)}%
              </span>
            </div>
            <span className="text-gray-400 text-xs">24h</span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-medium">Market Cap</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">${formatNumber(token.marketcap)}</p>
          <div className="flex items-center mt-1">
            <span className="text-gray-500 text-xs">Vol: ${formatNumber(token.volume_24)}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <div className="flex items-center space-x-1 text-gray-600">
          <Users className="w-4 h-4" />
          <span>{formatNumber(token.holder_count)} holders</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-600">
          <MessageCircle className="w-4 h-4" />
          <span>{token.comment_count} comments</span>
        </div>
      </div>

      {/* Social Links */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          {token.twitter && (
            <a 
              href={token.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {token.website && (
            <a 
              href={token.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {token.telegram && (
            <a 
              href={token.telegram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(token.created_time).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function TestOdin() {
  const [params, setParams] = useState<TokensParams>({
    page: 1,
    limit: 12,
    env: 'development',
    sort: 'marketcap:desc',
    bonded: true
  });

  const { tokens, totalCount, isLoading, error, refetch } = useOdinTokens(params);

  const handleSortChange = (sort: string) => {
    setParams(prev => ({ ...prev, sort, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }));
  };

  const handleBondedFilter = (bonded: boolean | undefined) => {
    setParams(prev => ({ ...prev, bonded, page: 1 }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Tokens</div>
          <p className="text-gray-600 mb-4">Failed to fetch token data from Odin API</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Odin Token Explorer</h1>
          <p className="text-gray-600">Discover and track tokens on the Odin network</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
                <select 
                  value={params.sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="marketcap:desc">Market Cap (High to Low)</option>
                  <option value="marketcap:asc">Market Cap (Low to High)</option>
                  <option value="volume:desc">Volume (High to Low)</option>
                  <option value="created_time:desc">Recently Created</option>
                  <option value="holder_count:desc">Most Holders</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
                <select 
                  value={params.bonded?.toString() || 'all'}
                  onChange={(e) => handleBondedFilter(e.target.value === 'all' ? undefined : e.target.value === 'true')}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Tokens</option>
                  <option value="true">Bonded Only</option>
                  <option value="false">Unbonded Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {totalCount.toLocaleString()} tokens found
              </span>
              <button
                onClick={() => refetch()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && tokens.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Token Grid */}
        {tokens.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {tokens.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => handlePageChange((params.page || 1) - 1)}
                disabled={params.page === 1 || isLoading}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {params.page || 1} of {Math.ceil(totalCount / (params.limit || 10))}
              </span>
              <button
                onClick={() => handlePageChange((params.page || 1) + 1)}
                disabled={(params.page || 1) >= Math.ceil(totalCount / (params.limit || 10)) || isLoading}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && tokens.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🪙</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}