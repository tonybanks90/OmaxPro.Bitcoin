
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Activity, Users2, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  user: string;
  opinion: string;
  action: 'buy' | 'sell';
  amount: string;
  time: string;
}

interface Holder {
  id: string;
  username: string;
  options: string;
  volume: string;
  percentage: number;
}

interface MarketActivityProps {
  marketId: string;
}

// Sample data - in real app this would come from API
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    user: 'CryptoTrader123',
    opinion: 'Yes',
    action: 'buy',
    amount: '$250',
    time: '2 min ago'
  },
  {
    id: '2',
    user: 'BitcoinBull',
    opinion: 'No',
    action: 'sell',
    amount: '$180',
    time: '5 min ago'
  },
  {
    id: '3',
    user: 'PredictionKing',
    opinion: 'Yes',
    action: 'buy',
    amount: '$420',
    time: '8 min ago'
  },
  {
    id: '4',
    user: 'MarketMover',
    opinion: 'No',
    action: 'buy',
    amount: '$300',
    time: '12 min ago'
  },
  {
    id: '5',
    user: 'SmartMoney',
    opinion: 'Yes',
    action: 'sell',
    amount: '$150',
    time: '15 min ago'
  }
];

const sampleHolders: Holder[] = [
  {
    id: '1',
    username: 'WhaleTrader',
    options: 'Yes',
    volume: '$2,450',
    percentage: 12.5
  },
  {
    id: '2',
    username: 'BigBettor',
    options: 'No',
    volume: '$1,890',
    percentage: 9.8
  },
  {
    id: '3',
    username: 'CryptoVet',
    options: 'Yes',
    volume: '$1,650',
    percentage: 8.2
  },
  {
    id: '4',
    username: 'MarketMaster',
    options: 'No',
    volume: '$1,200',
    percentage: 6.1
  },
  {
    id: '5',
    username: 'ProfitSeeker',
    options: 'Yes',
    volume: '$980',
    percentage: 4.9
  }
];

export function MarketActivity({ marketId }: MarketActivityProps) {
  const [activeTab, setActiveTab] = useState('transactions');

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
                  {sampleTransactions.length} transactions
                </Badge>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">User</TableHead>
                    <TableHead className="w-[80px]">Opinion</TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                    <TableHead className="w-[100px]">Amount</TableHead>
                    <TableHead className="w-[100px]">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(transaction.user)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate max-w-[100px]">
                            {transaction.user}
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
          </TabsContent>

          <TabsContent value="holders" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Top Holders</h3>
                <Badge variant="secondary" className="text-xs">
                  Top {sampleHolders.length} positions
                </Badge>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Username</TableHead>
                    <TableHead className="w-[80px]">Options</TableHead>
                    <TableHead className="w-[100px]">Volume</TableHead>
                    <TableHead className="w-[100px]">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleHolders.map((holder, index) => (
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
                          <span className="text-sm font-medium truncate max-w-[100px]">
                            {holder.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${holder.options === 'Yes' ? 'border-success text-success' : 'border-destructive text-destructive'}`}
                        >
                          {holder.options}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">
                        {holder.volume}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {holder.percentage}%
                          </span>
                          <div className="w-12 bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-accent h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(holder.percentage * 8, 100)}%` }}
                            />
                          </div>
                        </div>
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
