
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Activity, Users2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { MarketsService } from '../../services/markets-service';

interface MarketActivityProps {
  marketId: string;
}

interface UiTransaction {
  id: string;
  user: string;
  opinion: string;
  action: 'buy' | 'sell';
  amount: string;
  price: string;
  time: string;
  rawTime: number;
}

interface UiHolder {
  id: string;
  username: string;
  volume: string;
}

export function MarketActivity({ marketId }: MarketActivityProps) {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [holders, setHolders] = useState<UiHolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!marketId) return;

      try {
        const mId = BigInt(marketId);
        const [txs, hlds] = await Promise.all([
          MarketsService.getMarketActivity(mId),
          MarketsService.getMarketHolders(mId)
        ]);

        // Map Transactions
        const mappedTxs: UiTransaction[] = txs.map((tx: any) => {
          const isBuy = 'Buy' in tx.operation;

          // Extract side
          let side = "Unknown";
          if (tx.tokenIdentifier && 'Binary' in tx.tokenIdentifier) {
            if ('YES' in tx.tokenIdentifier.Binary) side = "Yes";
            else if ('NO' in tx.tokenIdentifier.Binary) side = "No";
          }

          const timestampMs = Number(tx.timestamp) / 1000000;
          const date = new Date(timestampMs);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: tx.txId.toString(),
            user: tx.user.toString(),
            opinion: side,
            action: isBuy ? 'buy' : 'sell',
            amount: tx.amount.toFixed(2),
            price: tx.price.toFixed(3),
            time: timeStr,
            rawTime: timestampMs
          };
        });
        setTransactions(mappedTxs);

        // Map Holders
        const mappedHolders: UiHolder[] = hlds
          .sort((a: any, b: any) => b.balance - a.balance)
          .slice(0, 10)
          .map((h: any, i: number) => ({
            id: i.toString(),
            username: h.user.toString(),
            volume: h.balance.toFixed(2)
          }));
        setHolders(mappedHolders);

      } catch (e) {
        console.error("Failed to fetch market data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [marketId]);

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getActionColor = (action: 'buy' | 'sell') => {
    return action === 'buy' ? 'text-success' : 'text-destructive';
  };

  const getActionIcon = (action: 'buy' | 'sell') => {
    return action === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  return (
    <Card className="border-2 border-border/50 shadow-lg bg-gradient-to-br from-surface to-surface/80">
      <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-t-xl border-b border-border/30">
        <CardTitle className="flex items-center space-x-3 text-xl">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Activity className="w-5 h-5" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Market Activity
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="holders" className="flex items-center space-x-2">
              <Users2 className="w-4 h-4" />
              <span>Top Holders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Recent Transactions</h3>
                <Badge variant="secondary" className="text-xs">
                  {transactions.length} transactions
                </Badge>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">User</TableHead>
                      <TableHead className="w-[80px]">Opinion</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                      <TableHead className="w-[100px]">Amount</TableHead>
                      <TableHead className="w-[80px]">Price</TableHead>
                      <TableHead className="w-[100px]">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center">No transactions yet</TableCell></TableRow>
                    ) : transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(transaction.user)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate max-w-[100px]" title={transaction.user}>
                              {transaction.user.substring(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${transaction.opinion === 'Yes' ? 'border-success text-success' : 'border-destructive text-destructive'}`}
                          >
                            {transaction.opinion}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center space-x-1 ${getActionColor(transaction.action)}`}>
                            {getActionIcon(transaction.action)}
                            <span className="text-xs font-medium capitalize">
                              {transaction.action}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.amount}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaction.price}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{transaction.time}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="holders" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Top Holders</h3>
                <Badge variant="secondary" className="text-xs">
                  Top {holders.length} positions
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Username</TableHead>
                    <TableHead className="w-[100px]">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && holders.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center">Loading...</TableCell></TableRow>
                  ) : holders.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center">No holders found</TableCell></TableRow>
                  ) : holders.map((holder, index) => (
                    <TableRow key={holder.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(holder.username)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-sm font-medium truncate max-w-[150px]" title={holder.username}>
                            {holder.username.substring(0, 15)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">
                        {holder.volume}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
