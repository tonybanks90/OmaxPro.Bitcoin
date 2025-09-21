import React, { useState } from 'react';
import { useOdinTokenTrades, type OdinTradeData } from '../../hooks/useOdinAPI';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TrendingUp, TrendingDown, ArrowUpDown, User, Clock, DollarSign } from 'lucide-react';

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
  return amount.toFixed(8);
}

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(4)}`;
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

  const { trades, totalCount, isLoading, error } = useOdinTokenTrades(tokenId, currentPage, 20);

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

  if (isLoading) {
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
          <div className="flex items-center gap-2">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Amount (BTC)</TableHead>
                    <TableHead className="text-right">Amount (Token)</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTrades.map((trade) => (
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
                      <TableCell className="text-right font-mono">
                        {formatAmount(trade.amount_btc)} BTC
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(trade.amount_token)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPrice(trade.price)}
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
                  ))}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}