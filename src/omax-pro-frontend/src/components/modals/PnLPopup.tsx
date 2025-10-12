import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface PnLData {
  totalPnL: number;
  totalPnLPercentage: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalInvested: number;
  currentValue: number;
  bestTrade: {
    token: string;
    amount: number;
    percentage: number;
  };
  worstTrade: {
    token: string;
    amount: number;
    percentage: number;
  };
}

interface PnLPopupProps {
  children: React.ReactNode;
  pnlData?: PnLData;
}

export function PnLPopup({ children, pnlData }: PnLPopupProps) {
  // Mock PnL data - in real app this would come from props or API
  const defaultPnLData: PnLData = {
    totalPnL: -2450.75,
    totalPnLPercentage: -12.5,
    realizedPnL: -1200.50,
    unrealizedPnL: -1250.25,
    totalInvested: 19607.00,
    currentValue: 17156.25,
    bestTrade: {
      token: 'BONK',
      amount: 856.40,
      percentage: 45.2
    },
    worstTrade: {
      token: 'PEPE',
      amount: -1890.75,
      percentage: -32.8
    }
  };

  const data = pnlData || defaultPnLData;
  const isPositive = data.totalPnL >= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-background border-border" 
        align="end"
        data-testid="pnl-popup"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Profit & Loss
          </h3>

          {/* Total P&L */}
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total P&L</span>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : '-'}{formatCurrency(data.totalPnL)}
              </span>
              <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                ({formatPercentage(data.totalPnLPercentage)})
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Realized P&L</span>
              <span className={`text-sm font-medium ${data.realizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.realizedPnL >= 0 ? '+' : '-'}{formatCurrency(data.realizedPnL)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Unrealized P&L</span>
              <span className={`text-sm font-medium ${data.unrealizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.unrealizedPnL >= 0 ? '+' : '-'}{formatCurrency(data.unrealizedPnL)}
              </span>
            </div>
            
            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Invested</span>
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(data.totalInvested)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Value</span>
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(data.currentValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Best & Worst Trades */}
          <div className="space-y-3">
            <div className="bg-success/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">BEST TRADE</span>
                <TrendingUp className="w-3 h-3 text-success" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{data.bestTrade.token}</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-success">
                    +{formatCurrency(data.bestTrade.amount)}
                  </div>
                  <div className="text-xs text-success">
                    +{data.bestTrade.percentage}%
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-destructive/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">WORST TRADE</span>
                <TrendingDown className="w-3 h-3 text-destructive" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{data.worstTrade.token}</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-destructive">
                    -{formatCurrency(data.worstTrade.amount)}
                  </div>
                  <div className="text-xs text-destructive">
                    {data.worstTrade.percentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}