
import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { TrendingUp, Download, Maximize2 } from 'lucide-react';
import { useOdinTokenTrades, type OdinTradeData } from '../../hooks/useOdinAPI';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface PriceChartProps {
  tokenSymbol: string;
}

interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  trades: number;
  buyTrades: number;
  sellTrades: number;
}

// Custom candlestick bar component
const CandlestickBar = (props: any) => {
  const { payload } = props;
  if (!payload || !payload.payload) return null;

  const data = payload.payload;
  const { open, high, low, close } = data;

  if (typeof open !== 'number' || typeof high !== 'number' || 
      typeof low !== 'number' || typeof close !== 'number') {
    return null;
  }

  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444'; // green-500 : red-500

  const x = payload.x || 0;
  const y = payload.y || 0;
  const width = payload.width || 20;
  const height = payload.height || 100;

  // Calculate positions relative to the chart scale
  const priceRange = high - low;
  if (priceRange === 0) return null;

  const bodyTop = Math.max(open, close);
  const bodyBottom = Math.min(open, close);
  const bodyHeight = Math.abs(close - open);

  const wickX = x + width / 2;
  const scale = height / priceRange;

  // Y positions (inverted because SVG y increases downward)
  const highY = y;
  const lowY = y + height;
  const bodyTopY = y + (high - bodyTop) * scale;
  const bodyBottomY = y + (high - bodyBottom) * scale;

  return (
    <g>
      {/* High-Low wick */}
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
        opacity={0.8}
      />
      {/* Open-Close body */}
      <rect
        x={x + width * 0.25}
        y={bodyTopY}
        width={width * 0.5}
        height={Math.max(bodyBottomY - bodyTopY, 1)}
        fill={isGreen ? color : 'transparent'}
        stroke={color}
        strokeWidth={isGreen ? 0 : 1}
        opacity={0.9}
      />
    </g>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">
          {new Date(data.time).toLocaleString()}
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Open:</span>
            <span className="font-medium">${data.open.toFixed(6)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">High:</span>
            <span className="font-medium">${data.high.toFixed(6)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-medium">${data.low.toFixed(6)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Close:</span>
            <span className="font-medium">${data.close.toFixed(6)}</span>
          </div>
          <div className="border-t border-border pt-1 mt-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{data.volume.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-success">Buy Vol:</span>
              <span className="font-medium text-success">{data.buyVolume.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-destructive">Sell Vol:</span>
              <span className="font-medium text-destructive">{data.sellVolume.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Trades:</span>
              <span className="font-medium">{data.trades}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function PriceChart({ tokenSymbol }: PriceChartProps) {
  const [activeTab, setActiveTab] = useState('trades');
  const [timeframe, setTimeframe] = useState('1d');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'volume'>('candlestick');

  // Get token ID from symbol (in a real app, you'd have this mapping)
  // For now, we'll use a placeholder or extract from URL/context
  const tokenId = tokenSymbol || '2kcf'; // fallback to sample token

  const { trades, isLoading, error } = useOdinTokenTrades(tokenId, 1, 200);

  const timeframes = ['5m', '15m', '1h', '4h', '1d'];
  const tabs = ['Candlestick', 'Line', 'Volume', 'Trades', 'Depth'];

  // Process trades data into candlestick format
  const candlestickData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    // Sort trades by time first
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Group trades by time intervals
    const intervals: { [key: string]: OdinTradeData[] } = {};
    const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 :
                     timeframe === '15m' ? 15 * 60 * 1000 :
                     timeframe === '1h' ? 60 * 60 * 1000 :
                     timeframe === '4h' ? 4 * 60 * 60 * 1000 :
                     24 * 60 * 60 * 1000; // 1d

    sortedTrades.forEach(trade => {
      // Skip trades with invalid price data
      if (!trade.price || trade.price <= 0) return;

      const tradeTime = new Date(trade.time).getTime();
      const intervalStart = Math.floor(tradeTime / intervalMs) * intervalMs;
      const intervalKey = intervalStart.toString();

      if (!intervals[intervalKey]) {
        intervals[intervalKey] = [];
      }
      intervals[intervalKey].push(trade);
    });

    // Convert to candlestick data
    const candlesticks: CandlestickData[] = [];

    Object.entries(intervals)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([timestamp, intervalTrades]) => {
        if (intervalTrades.length === 0) return;

        // Sort trades within interval by time
        intervalTrades.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        const prices = intervalTrades.map(t => t.price).filter(p => p > 0);
        if (prices.length === 0) return;

        const open = intervalTrades[0].price;
        const close = intervalTrades[intervalTrades.length - 1].price;
        const high = Math.max(...prices);
        const low = Math.min(...prices);

        // Ensure we have valid OHLC data
        if (!open || !close || !high || !low || high < low) return;

        const buyTrades = intervalTrades.filter(t => t.buy);
        const sellTrades = intervalTrades.filter(t => !t.buy);

        const volume = intervalTrades.reduce((sum, t) => sum + (t.amount_token || 0), 0);
        const buyVolume = buyTrades.reduce((sum, t) => sum + (t.amount_token || 0), 0);
        const sellVolume = sellTrades.reduce((sum, t) => sum + (t.amount_token || 0), 0);

        candlesticks.push({
          time: new Date(parseInt(timestamp)).toISOString(),
          timestamp: parseInt(timestamp),
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          volume: Number(volume),
          buyVolume: Number(buyVolume),
          sellVolume: Number(sellVolume),
          trades: intervalTrades.length,
          buyTrades: buyTrades.length,
          sellTrades: sellTrades.length
        });
      });

    return candlesticks;
  }, [trades, timeframe]);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load chart data</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button 
            size="sm" 
            variant={chartType === 'candlestick' ? 'default' : 'ghost'}
            onClick={() => setChartType('candlestick')}
            data-testid="button-candlestick"
          >
            Candlestick
          </Button>
          <Button 
            size="sm" 
            variant={chartType === 'line' ? 'default' : 'ghost'}
            onClick={() => setChartType('line')}
            data-testid="button-line"
          >
            Line
          </Button>
          <Button 
            size="sm" 
            variant={chartType === 'volume' ? 'default' : 'ghost'}
            onClick={() => setChartType('volume')}
            data-testid="button-volume"
          >
            Volume
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={timeframe === tf ? 'default' : 'ghost'}
              onClick={() => setTimeframe(tf)}
              data-testid={`button-timeframe-${tf}`}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-96 w-full">
        {candlestickData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No trading data available</p>
              <p className="text-sm text-muted-foreground mt-2">Chart will appear when trades are made</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={candlestickData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time"
                tickFormatter={(time) => {
                  const date = new Date(time);
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: timeframe.includes('m') || timeframe.includes('h') ? '2-digit' : undefined,
                    minute: timeframe.includes('m') ? '2-digit' : undefined
                  });
                }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                domain={['dataMin - 0.000001', 'dataMax + 0.000001']}
                tickFormatter={(value) => `$${Number(value).toFixed(6)}`}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />

              {chartType === 'candlestick' && (
                <Bar
                  dataKey="high"
                  fill="transparent"
                  shape={(props) => <CandlestickBar {...props} />}
                  isAnimationActive={false}
                />
              )}

              {chartType === 'line' && (
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              )}

              {chartType === 'volume' && (
                <>
                  <Bar
                    dataKey="buyVolume"
                    fill="hsl(var(--success))"
                    opacity={0.7}
                  />
                  <Bar
                    dataKey="sellVolume"
                    fill="hsl(var(--destructive))"
                    opacity={0.7}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            {candlestickData.length > 0 && (
              <span>
                {candlestickData.length} intervals • {trades.length} total trades
              </span>
            )}
          </div>
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

      {/* Trading Summary */}
      {candlestickData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background border border-border rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Volume</div>
            <div className="text-sm font-medium">
              {candlestickData.reduce((sum, d) => sum + d.volume, 0).toFixed(0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Buy Volume</div>
            <div className="text-sm font-medium text-success">
              {candlestickData.reduce((sum, d) => sum + d.buyVolume, 0).toFixed(0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Sell Volume</div>
            <div className="text-sm font-medium text-destructive">
              {candlestickData.reduce((sum, d) => sum + d.sellVolume, 0).toFixed(0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Trades</div>
            <div className="text-sm font-medium">
              {candlestickData.reduce((sum, d) => sum + d.trades, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}