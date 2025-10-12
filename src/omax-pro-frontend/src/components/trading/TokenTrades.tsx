import React, { useState } from 'react';
import { useOdinTokenTrades, useBTCPrice, type OdinTradeData } from '../../hooks/useOdinAPI';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TrendingUp, TrendingDown, ArrowUpDown, User, Clock, DollarSign, Bitcoin } from 'lucide-react';

interface TokenTradesProps {
  tokenId: string;
}

function formatTime(timeString: string): string {
  const date = new Date(timeString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return "Just now";
}

function formatAmount(amount: number): string {
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(2)}K`;
  return amount.toLocaleString();
}

// Enhanced price conversion functions matching your API format
const SATOSHI_TO_BTC = 0.00000001;

function parseTradePrice(apiValue: number, btcPriceUSD: number) {
  // Token price: API Value ÷ 1000 = sats (matching your API format)
  const satoshis = apiValue / 1000;
  const btc = satoshis * SATOSHI_TO_BTC;
  const usd = btc * btcPriceUSD;
  return {
    satoshis,
    btc,
    usd,
    formatted: {
      sats: `${satoshis.toLocaleString()} sats`,
      btc: `${btc.toFixed(8)} BTC`,
      usd: usd < 0.01 ? `$${usd.toFixed(8)}` : usd < 1 ? `$${usd.toFixed(6)}` : `$${usd.toFixed(4)}`
    }
  };
}

function parseTradeBTCAmount(btcAmount: number, btcPriceUSD: number) {
  const usd = btcAmount * btcPriceUSD;
  const satoshis = btcAmount / SATOSHI_TO_BTC;
  return {
    btc: btcAmount,
    usd,
    satoshis,
    formatted: {
      btc: `${btcAmount.toFixed(8)} BTC`,
      usd: usd < 0.01 ? `$${usd.toFixed(8)}` : usd < 1 ? `$${usd.toFixed(6)}` : `$${usd.toFixed(2)}`,
      sats: `${satoshis.toLocaleString()} sats`
    }
  };
}

function parseTokenAmount(tokenAmount: number, tokenPrice: number, btcPriceUSD: number) {
  // Get the proper price per token
  const priceData = parseTradePrice(tokenPrice, btcPriceUSD);
  
  // Calculate total value of token amount
  const totalValueSats = tokenAmount * priceData.satoshis;
  const totalValueBTC = totalValueSats * SATOSHI_TO_BTC;
  const totalValueUSD = totalValueBTC * btcPriceUSD;
  
  return {
    tokens: tokenAmount,
    valueSats: totalValueSats,
    valueBTC: totalValueBTC,
    valueUSD: totalValueUSD,
    formatted: {
      tokens: formatAmount(tokenAmount),
      valueSats: `${totalValueSats.toLocaleString()} sats`,
      valueBTC: `${totalValueBTC.toFixed(8)} BTC`,
      valueUSD: totalValueUSD < 0.01 ? `$${totalValueUSD.toFixed(8)}` : totalValueUSD < 1 ? `$${totalValueUSD.toFixed(6)}` : `$${totalValueUSD.toFixed(4)}`
    }
  };
}

// Helper function to get Odin image URLs
function getOdinImageUrl(type: 'user' | 'token', id: string | undefined): string {
  if (!id) return `https://placehold.co/24x24/f3f4f6/9ca3af?text=U`;
  return `https://api.odin.fun/v1/${type}/${id}/image`;
}

export function TokenTrades({ tokenId }: TokenTradesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'time' | 'amount_btc' | 'price'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [displayCurrency, setDisplayCurrency] = useState<'usd' | 'btc' | 'sats'>('usd');

  const { trades, totalCount, isLoading, error } = useOdinTokenTrades(tokenId, currentPage, 20);
  const { btcPriceUSD, isLoading: btcLoading } = useBTCPrice();

  const handleSort = (field: 'time' | 'amount_btc' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case 'time':
        aValue = new Date(a.time).getTime();
        bValue = new Date(b.time).getTime();
        break;
      case 'amount_btc':
        aValue = a.amount_btc;
        bValue = b.amount_btc;
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (isLoading || btcLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Token Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <span className="ml-2 text-muted-foreground">Loading trades...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Token Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-destructive">Failed to load trades data</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try again later
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Token Trades
            <Badge variant="secondary" className="ml-2">
              {totalCount.toLocaleString()}
            </Badge>
          </div>
          
          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            {/* Currency Display Toggle */}
            <div className="flex bg-surface rounded-lg p-1">
              <Button
                size="sm"
                variant={displayCurrency === 'usd' ? 'default' : 'ghost'}
                onClick={() => setDisplayCurrency('usd')}
              >
                USD
              </Button>
              <Button
                size="sm"
                variant={displayCurrency === 'btc' ? 'default' : 'ghost'}
                onClick={() => setDisplayCurrency('btc')}
              >
                BTC
              </Button>
              <Button
                size="sm"
                variant={displayCurrency === 'sats' ? 'default' : 'ghost'}
                onClick={() => setDisplayCurrency('sats')}
              >
                Sats
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleSort('time')}
              className="flex items-center gap-1"
            >
              <Clock className="w-4 h-4" />
              Time
              {sortField === 'time' && (
                <span className="text-xs">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleSort('amount_btc')}
              className="flex items-center gap-1"
            >
              <DollarSign className="w-4 h-4" />
              Amount
              {sortField === 'amount_btc' && (
                <span className="text-xs">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleSort('price')}
              className="flex items-center gap-1"
            >
              Price
              {sortField === 'price' && (
                <span className="text-xs">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
          </div>
        </CardTitle>
        
        {/* Mobile Controls - Inside Card Header */}
        <div className="md:hidden mt-4 space-y-3">
          {/* Top Row: Currency Dropdown */}
          <div className="flex items-center justify-between gap-2">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as 'usd' | 'btc' | 'sats')}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="usd">💲 USD</option>
              <option value="btc">₿ BTC</option>
              <option value="sats">⚡ Sats</option>
            </select>

            {/* BTC Price - Mobile Compact */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-surface border border-border rounded-lg px-2 py-1">
              <Bitcoin className="w-3 h-3" />
              <span className="whitespace-nowrap">
                ${(btcPriceUSD / 1000).toFixed(0)}K
              </span>
            </div>
          </div>

          {/* Bottom Row: Sort Controls */}
          <div className="flex items-center justify-between gap-1">
            <Button 
              variant={sortField === 'time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('time')}
              className="flex items-center gap-1 text-xs flex-1"
            >
              <Clock className="w-3 h-3" />
              Time
              {sortField === 'time' && (
                <span className="text-xs">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
            <Button 
              variant={sortField === 'amount_btc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('amount_btc')}
              className="flex items-center gap-1 text-xs flex-1"
            >
              <DollarSign className="w-3 h-3" />
              Amount
              {sortField === 'amount_btc' && (
                <span className="text-xs">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
            <Button 
              variant={sortField === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('price')}
              className="flex items-center gap-1 text-xs flex-1"
            >
              Price
              {sortField === 'price' && (
                <span className="text-xs">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <ArrowUpDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Trades Found</h3>
              <p className="text-muted-foreground">
                No trading activity has been recorded for this token yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* BTC Price Display */}
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <Bitcoin className="w-4 h-4" />
                <span>BTC Price: ${btcPriceUSD.toLocaleString()}</span>
              </div>
              <span>Real-time conversions powered by Odin API</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Trade Amount</TableHead>
                    <TableHead className="text-right">Token Amount</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTrades.map((trade) => {
                    const priceData = parseTradePrice(trade.price, btcPriceUSD);
                    const amountData = parseTradeBTCAmount(trade.amount_btc, btcPriceUSD);
                    const tokenData = parseTokenAmount(trade.amount_token, trade.price, btcPriceUSD);

                    return (
                      <TableRow key={trade.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge 
                            variant={trade.buy ? "default" : "destructive"}
                            className="flex items-center gap-1 w-fit"
                          >
                            {trade.buy ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {trade.buy ? 'Buy' : 'Sell'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {trade.user_image ? (
                              <img
                                src={getOdinImageUrl('user', trade.user)}
                                alt={trade.user_username || 'User'}
                                className="w-6 h-6 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.src = `https://placehold.co/24x24/f3f4f6/9ca3af?text=${trade.user_username?.charAt(0) || 'U'}`;
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm">
                                {trade.user_username || `${trade.user?.slice(0, 8) || 'Unknown'}...`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {trade.user ? `${trade.user.slice(0, 6)}...${trade.user.slice(-4)}` : 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Enhanced Trade Amount Column */}
                        <TableCell className="text-right font-mono">
                          <div>
                            <div className="font-medium">
                              {displayCurrency === 'usd' && amountData.formatted.usd}
                              {displayCurrency === 'btc' && amountData.formatted.btc}
                              {displayCurrency === 'sats' && amountData.formatted.sats}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {displayCurrency === 'usd' && amountData.formatted.btc}
                              {displayCurrency === 'btc' && amountData.formatted.usd}
                              {displayCurrency === 'sats' && amountData.formatted.usd}
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Enhanced Token Amount Column */}
                        <TableCell className="text-right font-mono">
                          <div>
                            <div className="font-medium">
                              {tokenData.formatted.tokens} tokens
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {displayCurrency === 'usd' && tokenData.formatted.valueUSD}
                              {displayCurrency === 'btc' && tokenData.formatted.valueBTC}
                              {displayCurrency === 'sats' && tokenData.formatted.valueSats}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right font-mono">
                          <div>
                            <div className="font-medium">
                              {displayCurrency === 'usd' && priceData.formatted.usd}
                              {displayCurrency === 'btc' && priceData.formatted.btc}
                              {displayCurrency === 'sats' && priceData.formatted.sats}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              per token
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatTime(trade.time)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={trade.bonded ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {trade.bonded ? 'Bonded' : 'Unbonded'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalCount > 20 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} trades
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} of {Math.ceil(totalCount / 20)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(Math.ceil(totalCount / 20), currentPage + 1))}
                    disabled={currentPage >= Math.ceil(totalCount / 20)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Enhanced Trading Summary with proper conversions - Mobile Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">Buy Volume</div>
                <div className="text-sm sm:text-lg font-bold text-success">
                  {displayCurrency === 'usd' && `$${(trades.filter(t => t.buy).reduce((sum, t) => sum + t.amount_btc, 0) * btcPriceUSD).toLocaleString()}`}
                  {displayCurrency === 'btc' && `${trades.filter(t => t.buy).reduce((sum, t) => sum + t.amount_btc, 0).toFixed(6)} BTC`}
                  {displayCurrency === 'sats' && `${(trades.filter(t => t.buy).reduce((sum, t) => sum + t.amount_btc, 0) / SATOSHI_TO_BTC).toLocaleString()} sats`}
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">Sell Volume</div>
                <div className="text-sm sm:text-lg font-bold text-destructive">
                  {displayCurrency === 'usd' && `$${(trades.filter(t => !t.buy).reduce((sum, t) => sum + t.amount_btc, 0) * btcPriceUSD).toLocaleString()}`}
                  {displayCurrency === 'btc' && `${trades.filter(t => !t.buy).reduce((sum, t) => sum + t.amount_btc, 0).toFixed(6)} BTC`}
                  {displayCurrency === 'sats' && `${(trades.filter(t => !t.buy).reduce((sum, t) => sum + t.amount_btc, 0) / SATOSHI_TO_BTC).toLocaleString()} sats`}
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Trades</div>
                <div className="text-sm sm:text-lg font-bold">
                  {trades.length}
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Volume</div>
                <div className="text-sm sm:text-lg font-bold">
                  {displayCurrency === 'usd' && `$${(trades.reduce((sum, t) => sum + t.amount_btc, 0) * btcPriceUSD).toLocaleString()}`}
                  {displayCurrency === 'btc' && `${trades.reduce((sum, t) => sum + t.amount_btc, 0).toFixed(6)} BTC`}
                  {displayCurrency === 'sats' && `${(trades.reduce((sum, t) => sum + t.amount_btc, 0) / SATOSHI_TO_BTC).toLocaleString()} sats`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}