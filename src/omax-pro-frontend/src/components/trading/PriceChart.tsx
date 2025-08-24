import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, Maximize2 } from 'lucide-react';

interface PriceChartProps {
  tokenSymbol: string;
}

export function PriceChart({ tokenSymbol }: PriceChartProps) {
  const [activeTab, setActiveTab] = useState('trades');
  const [timeframe, setTimeframe] = useState('1d');

  const timeframes = ['3m', '1m', '5d', '1d'];
  const tabs = ['Trades', 'Holders (1)', 'Top Traders', 'Dev Tokens', 'My Position'];

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
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

      {/* Chart Placeholder */}
      <div className="h-96 bg-background border border-border rounded-lg flex items-center justify-center relative">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Price Chart</p>
          <p className="text-sm text-muted-foreground">Chart component integration pending</p>
        </div>
        
        {/* Mock Chart Controls */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
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
            <div className="flex items-center space-x-2">
              <span data-testid="text-current-time">14:38:09 (UTC+3)</span>
              <span>%</span>
              <span>log</span>
              <span className="text-warning">auto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          {tabs.map((tab, index) => (
            <Button
              key={tab}
              size="sm"
              variant={index === 0 ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.toLowerCase().replace(/\s+/g, ''))}
              data-testid={`button-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tab}
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid="button-download-chart">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid="button-expand-chart">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trades Table Placeholder */}
      {activeTab === 'trades' && (
        <div className="mt-6 bg-background border border-border rounded-lg p-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent trades to display</p>
            <p className="text-sm text-muted-foreground mt-2">Trade data will appear here once transactions occur</p>
          </div>
        </div>
      )}
    </div>
  );
}
