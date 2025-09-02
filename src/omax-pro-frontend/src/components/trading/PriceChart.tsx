import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Button } from '../ui/button';
import { TrendingUp, Download, Maximize2 } from 'lucide-react';

interface PriceChartProps {
  tokenSymbol?: string; // Made optional since we can get it from API
}

// Types for API responses
interface TradeData {
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
  decimals: Record<string, any>;
  divisibility: Record<string, any>;
}

interface HolderData {
  user: string;
  token: string;
  balance: number;
  user_username: string;
  user_image: string;
  tokenid: string;
  fiat_value: number;
}

interface ApiResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
}

// API functions
const ODIN_API_BASE = 'https://api.odin.fun/v1';

async function fetchTokenTrades(tokenId: string): Promise<ApiResponse<TradeData>> {
  const response = await fetch(`${ODIN_API_BASE}/token/${tokenId}/trades`);
  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`);
  }
  return response.json();
}

async function fetchTokenHolders(tokenId: string): Promise<ApiResponse<HolderData>> {
  const response = await fetch(`${ODIN_API_BASE}/token/${tokenId}/power_holders`);
  if (!response.ok) {
    throw new Error(`Failed to fetch holders: ${response.statusText}`);
  }
  return response.json();
}

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'Just now';
}

export function PriceChart({ tokenSymbol }: PriceChartProps) {
  const [activeTab, setActiveTab] = useState('trades');
  const [timeframe, setTimeframe] = useState('1d');
  
  // Get tokenId from URL params
  const params = useParams();
  const tokenId = params.id || params.tokenId; // Support both /token/:id and /token/:tokenId patterns

  // Fetch trades data
  const { 
    data: tradesData, 
    isLoading: tradesLoading, 
    error: tradesError 
  } = useQuery({
    queryKey: ['odin', 'trades', tokenId],
    queryFn: () => fetchTokenTrades(tokenId!),
    refetchInterval: 10000, // 10 seconds for trades
    enabled: !!tokenId
  });

  // Fetch holders data
  const { 
    data: holdersData, 
    isLoading: holdersLoading, 
    error: holdersError 
  } = useQuery({
    queryKey: ['odin', 'holders', tokenId],
    queryFn: () => fetchTokenHolders(tokenId!),
    refetchInterval: 30000, // 30 seconds for holders
    enabled: !!tokenId
  });

  const trades = tradesData?.data || [];
  const holders = holdersData?.data || [];

  const timeframes = ['3m', '1m', '5d', '1d'];
  const tabs = [
    { key: 'trades', label: 'Trades' },
    { key: 'holders', label: `Holders (${holders.length})` },
    { key: 'top-traders', label: 'Top Traders' },
    { key: 'dev-tokens', label: 'Dev Tokens' },
    { key: 'my-position', label: 'My Position' }
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      {/* --- Top Controls --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="default" data-testid="button-price-mc">
            Price/MC
          </Button>
          <Button size="sm" variant="ghost" data-testid="button-trades-filter">
            Trades Filter
          </Button>
          <Button size="sm" variant="ghost" data-testid="button-hide-buy-line">
            Hide Buy Avg Price Line
          </Button>
          <Button size="sm" variant="ghost" data-testid="button-hide-sell-line">
            Hide Sell Avg Price Line
          </Button>
        </div>
        <Button size="sm" variant="outline" data-testid="button-reset-chart">
          Reset
        </Button>
      </div>

      {/* --- Chart Placeholder --- */}
      <div className="h-80 sm:h-96 bg-background border border-border rounded-lg flex items-center justify-center relative">
        <div className="text-center px-2">
          <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-2 sm:mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Price Chart for {tokenSymbol || tokenId || 'Token'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Chart component integration pending</p>
        </div>

        {/* --- Timeframe Controls --- */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
            {/* Timeframes */}
            <div className="flex flex-wrap gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-1 rounded transition-colors ${
                    timeframe === tf ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`}
                  data-testid={`button-timeframe-${tf}`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Right-side indicators */}
            <div className="flex items-center space-x-2 justify-end">
              <span data-testid="text-current-time" className="whitespace-nowrap">
                14:38:09 (UTC+3)
              </span>
              <span>%</span>
              <span>log</span>
              <span className="text-warning">auto</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Tabs + Actions --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={activeTab === tab.key ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`button-tab-${tab.key}`}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Download / Expand */}
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid="button-download-chart">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid="button-expand-chart">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* --- Trades Table --- */}
      {activeTab === 'trades' && (
        <div className="mt-6 bg-background border border-border rounded-lg overflow-hidden">
          {tradesLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading trades...</p>
            </div>
          ) : tradesError ? (
            <div className="p-8 text-center">
              <p className="text-destructive text-sm">Failed to load trades data</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-6 sm:py-8 px-2">
              <p className="text-muted-foreground text-sm sm:text-base">No recent trades to display</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Trade data will appear here once transactions occur
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Age
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total BTC
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Trader
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      {/* Age */}
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {getTimeAgo(trade.time)}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            trade.buy
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.buy ? 'BUY' : 'SELL'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium">
                          {formatPrice(trade.price)}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm">
                          {formatNumber(trade.amount_token)}
                        </span>
                      </td>

                      {/* Total BTC */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium">
                          ₿{trade.amount_btc.toFixed(8)}
                        </span>
                      </td>

                      {/* Trader */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <img
                            src={trade.user_image || 'https://placehold.co/24x24/f3f4f6/9ca3af?text=U'}
                            alt={trade.user_username}
                            className="w-6 h-6 rounded-full bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/24x24/f3f4f6/9ca3af?text=U';
                            }}
                          />
                          <span className="text-sm text-foreground">
                            {trade.user_username || 'Anonymous'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Holders Table --- */}
      {activeTab === 'holders' && (
        <div className="mt-6 bg-background border border-border rounded-lg overflow-hidden">
          {holdersLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading holders...</p>
            </div>
          ) : holdersError ? (
            <div className="p-8 text-center">
              <p className="text-destructive text-sm">Failed to load holders data</p>
            </div>
          ) : holders.length === 0 ? (
            <div className="text-center py-6 sm:py-8 px-2">
              <p className="text-muted-foreground text-sm sm:text-base">No holders to display</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Holder data will appear here once tokens are distributed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Value
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Bought
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Sold
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      P&L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map((holder) => (
                    <tr
                      key={`${holder.user}-${holder.token}`}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <img
                            src={holder.user_image || 'https://placehold.co/24x24/f3f4f6/9ca3af?text=U'}
                            alt={holder.user_username}
                            className="w-6 h-6 rounded-full bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/24x24/f3f4f6/9ca3af?text=U';
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {holder.user_username || 'Anonymous'}
                          </span>
                        </div>
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium">
                          {formatNumber(holder.balance)}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium">
                          {formatPrice(holder.fiat_value)}
                        </span>
                      </td>

                      {/* Bought (placeholder) */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      </td>

                      {/* Sold (placeholder) */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      </td>

                      {/* P&L (placeholder) */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Other Tabs Placeholder --- */}
      {!['trades', 'holders'].includes(activeTab) && (
        <div className="mt-6 bg-background border border-border rounded-lg p-4">
          <div className="text-center py-6 sm:py-8 px-2">
            <p className="text-muted-foreground text-sm sm:text-base">
              {tabs.find(tab => tab.key === activeTab)?.label} - Coming Soon
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              This feature will be implemented later
            </p>
          </div>
        </div>
      )}
    </div>
  );
}