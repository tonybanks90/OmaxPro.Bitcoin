import { useState } from 'react';
import { Button } from '../ui/button';
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
          <p className="text-muted-foreground text-sm sm:text-base">Price Chart</p>
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
          {tabs.map((tab, index) => (
            <Button
              key={tab}
              size="sm"
              variant={index === 0 ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.toLowerCase().replace(/\s+/g, ''))}
              data-testid={`button-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
              className="whitespace-nowrap"
            >
              {tab}
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

      {/* --- Trades Table Placeholder --- */}
      {activeTab === 'trades' && (
        <div className="mt-6 bg-background border border-border rounded-lg p-4">
          <div className="text-center py-6 sm:py-8 px-2">
            <p className="text-muted-foreground text-sm sm:text-base">No recent trades to display</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Trade data will appear here once transactions occur
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
