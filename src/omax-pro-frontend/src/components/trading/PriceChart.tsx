import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { TrendingUp, Download, Maximize2, Bitcoin, DollarSign } from 'lucide-react';
import { useOdinTokenTrades, useBTCPrice, type OdinTradeData } from '../../hooks/useOdinAPI';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area
} from 'recharts';

interface PriceChartProps {
  tokenId: string;
  tokenSymbol?: string;
}

interface EnhancedCandlestickData {
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
  // Enhanced price fields
  openUSD: number;
  highUSD: number;
  lowUSD: number;
  closeUSD: number;
  openSats: number;
  highSats: number;
  lowSats: number;
  closeSats: number;
  volumeUSD: number;
  volumeBTC: number;
}

// Enhanced price conversion functions
const SATOSHI_TO_BTC = 0.00000001;

function parseTradePrice(apiValue: number, btcPriceUSD: number) {
  const satoshis = apiValue / 1000; // API format: price * 1000 = sats
  const btc = satoshis * SATOSHI_TO_BTC;
  const usd = btc * btcPriceUSD;
  return { satoshis, btc, usd };
}

// Custom candlestick bar component with USD/BTC/Sats support
const EnhancedCandlestickBar = (props: any) => {
  const { payload, displayCurrency } = props;
  if (!payload || !payload.payload) return null;

  const data = payload.payload;
  let open, high, low, close;

  switch (displayCurrency) {
    case 'usd':
      open = data.openUSD;
      high = data.highUSD;
      low = data.lowUSD;
      close = data.closeUSD;
      break;
    case 'btc':
      open = data.open;
      high = data.high;
      low = data.low;
      close = data.close;
      break;
    case 'sats':
      open = data.openSats;
      high = data.highSats;
      low = data.lowSats;
      close = data.closeSats;
      break;
    default:
      open = data.openUSD;
      high = data.highUSD;
      low = data.lowUSD;
      close = data.closeUSD;
  }

  if (typeof open !== 'number' || typeof high !== 'number' || 
      typeof low !== 'number' || typeof close !== 'number') {
    return null;
  }

  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444';

  const x = props.x || 0;
  const y = props.y || 0;
  const width = props.width || 20;
  const height = props.height || 100;
  
  // This calculates the y-coordinates based on the data values and the chart's scale
  const yAxis = props.yAxis;
  const highY = yAxis.scale(high);
  const lowY = yAxis.scale(low);
  const openY = yAxis.scale(open);
  const closeY = yAxis.scale(close);

  const wickX = x + width / 2;
  const bodyY = Math.min(openY, closeY);
  const bodyHeight = Math.abs(openY - closeY);

  return (
    <g>
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
        opacity={0.8}
      />
      <rect
        x={x + width * 0.1}
        y={bodyY}
        width={width * 0.8}
        height={Math.max(bodyHeight, 1)}
        fill={isGreen ? color : 'transparent'}
        stroke={color}
        strokeWidth={isGreen ? 0 : 1}
        opacity={0.9}
      />
    </g>
  );
};


// Enhanced custom tooltip with multi-currency support
const EnhancedTooltip = ({ active, payload, label, displayCurrency, btcPriceUSD }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    const formatPrice = (value: number) => {
      if (displayCurrency === 'usd') {
        return value < 0.01 ? `$${value.toFixed(8)}` : value < 1 ? `$${value.toFixed(6)}` : `$${value.toFixed(4)}`;
      } else if (displayCurrency === 'btc') {
        return `${value.toFixed(8)} BTC`;
      } else {
        return `${value.toLocaleString()} sats`;
      }
    };

    const formatVolume = (btcVolume: number) => {
      if (displayCurrency === 'usd') {
        const usdVolume = btcVolume * btcPriceUSD;
        return usdVolume >= 1000 ? `$${(usdVolume / 1000).toFixed(1)}K` : `$${usdVolume.toFixed(2)}`;
      } else if (displayCurrency === 'btc') {
        return `${btcVolume.toFixed(6)} BTC`;
      } else {
        const satsVolume = btcVolume / SATOSHI_TO_BTC;
        return satsVolume >= 1000000 ? `${(satsVolume / 1000000).toFixed(1)}M sats` : `${satsVolume.toFixed(0)} sats`;
      }
    };

    return (
      <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">
          {new Date(data.time).toLocaleString()}
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Open:</span>
            <span className="font-medium">{formatPrice(displayCurrency === 'usd' ? data.openUSD : displayCurrency === 'btc' ? data.open : data.openSats)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">High:</span>
            <span className="font-medium">{formatPrice(displayCurrency === 'usd' ? data.highUSD : displayCurrency === 'btc' ? data.high : data.highSats)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-medium">{formatPrice(displayCurrency === 'usd' ? data.lowUSD : displayCurrency === 'btc' ? data.low : data.lowSats)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Close:</span>
            <span className="font-medium">{formatPrice(displayCurrency === 'usd' ? data.closeUSD : displayCurrency === 'btc' ? data.close : data.closeSats)}</span>
          </div>
          <div className="border-t border-border pt-1 mt-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{formatVolume(data.volumeBTC)}</span>
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

export function PriceChart({ tokenId, tokenSymbol }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area' | 'volume'>('candlestick');
  const [displayCurrency, setDisplayCurrency] = useState<'usd' | 'btc' | 'sats'>('usd');

  const { trades, isLoading, error } = useOdinTokenTrades(tokenId, 1, 500); // Get more trades for better chart
  const { btcPriceUSD, isLoading: btcLoading } = useBTCPrice();

  const timeframes = ['5m', '15m', '1h', '4h', '1d'];

  // Enhanced candlestick data processing with multi-currency support
  const enhancedCandlestickData = useMemo(() => {
    if (!trades || trades.length === 0 || btcLoading) return [];

    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const intervals: { [key: string]: OdinTradeData[] } = {};
    const intervalMs = timeframe === '5m' ? 5 * 60 * 1000 :
                       timeframe === '15m' ? 15 * 60 * 1000 :
                       timeframe === '1h' ? 60 * 60 * 1000 :
                       timeframe === '4h' ? 4 * 60 * 60 * 1000 :
                       24 * 60 * 60 * 1000;

    sortedTrades.forEach(trade => {
      if (!trade.price || trade.price <= 0) return;

      const tradeTime = new Date(trade.time).getTime();
      const intervalStart = Math.floor(tradeTime / intervalMs) * intervalMs;
      const intervalKey = intervalStart.toString();

      if (!intervals[intervalKey]) {
        intervals[intervalKey] = [];
      }
      intervals[intervalKey].push(trade);
    });

    const enhancedCandlesticks: EnhancedCandlestickData[] = [];

    Object.entries(intervals)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([timestamp, intervalTrades]) => {
        if (intervalTrades.length === 0) return;

        intervalTrades.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        const prices = intervalTrades.map(t => t.price).filter(p => p > 0);
        if (prices.length === 0) return;

        const open = intervalTrades[0].price;
        const close = intervalTrades[intervalTrades.length - 1].price;
        const high = Math.max(...prices);
        const low = Math.min(...prices);

        if (!open || !close || !high || !low || high < low) return;

        const buyTrades = intervalTrades.filter(t => t.buy);
        const sellTrades = intervalTrades.filter(t => !t.buy);

        const volume = intervalTrades.reduce((sum, t) => sum + (t.amount_token || 0), 0);
        const buyVolume = buyTrades.reduce((sum, t) => sum + (t.amount_token || 0), 0);
        const sellVolume = sellTrades.reduce((sum, t) => sum + (t.amount_token || 0), 0);
        const volumeBTC = intervalTrades.reduce((sum, t) => sum + (t.amount_btc || 0), 0);

        // Enhanced price conversions
        const openData = parseTradePrice(open, btcPriceUSD);
        const highData = parseTradePrice(high, btcPriceUSD);
        const lowData = parseTradePrice(low, btcPriceUSD);
        const closeData = parseTradePrice(close, btcPriceUSD);

        enhancedCandlesticks.push({
          time: new Date(parseInt(timestamp)).toISOString(),
          timestamp: parseInt(timestamp),
          // BTC prices (original API format)
          open: openData.btc,
          high: highData.btc,
          low: lowData.btc,
          close: closeData.btc,
          // USD prices
          openUSD: openData.usd,
          highUSD: highData.usd,
          lowUSD: lowData.usd,
          closeUSD: closeData.usd,
          // Satoshi prices
          openSats: openData.satoshis,
          highSats: highData.satoshis,
          lowSats: lowData.satoshis,
          closeSats: closeData.satoshis,
          // Volume data
          volume: Number(volume),
          buyVolume: Number(buyVolume),
          sellVolume: Number(sellVolume),
          volumeBTC: Number(volumeBTC),
          volumeUSD: Number(volumeBTC * btcPriceUSD),
          trades: intervalTrades.length,
          buyTrades: buyTrades.length,
          sellTrades: sellTrades.length
        });
      });

    return enhancedCandlesticks;
  }, [trades, timeframe, btcPriceUSD, btcLoading]);

  if (isLoading || btcLoading) {
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

  // Get current price data key based on display currency
  const getPriceKey = (field: 'open' | 'high' | 'low' | 'close') => {
    switch (displayCurrency) {
      case 'usd': return `${field}USD`;
      case 'btc': return field; // 'open', 'high', 'low', 'close'
      case 'sats': return `${field}Sats`;
      default: return `${field}USD`;
    }
  };

  const getCandleDataKey = () => [
    getPriceKey('open'),
    getPriceKey('high'),
    getPriceKey('low'),
    getPriceKey('close')
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex flex-col space-y-4 mb-4">
        {/* Top controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              size="sm" 
              variant={chartType === 'candlestick' ? 'default' : 'ghost'}
              onClick={() => setChartType('candlestick')}
            >
              Candlestick
            </Button>
            <Button 
              size="sm" 
              variant={chartType === 'line' ? 'default' : 'ghost'}
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button 
              size="sm" 
              variant={chartType === 'area' ? 'default' : 'ghost'}
              onClick={() => setChartType('area')}
            >
              Area
            </Button>
            <Button 
              size="sm" 
              variant={chartType === 'volume' ? 'default' : 'ghost'}
              onClick={() => setChartType('volume')}
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
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        {/* Currency and info row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Currency Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={displayCurrency === 'usd' ? 'default' : 'ghost'}
                onClick={() => setDisplayCurrency('usd')}
                className="flex items-center gap-1"
              >
                <DollarSign className="w-3 h-3" />
                USD
              </Button>
              <Button
                size="sm"
                variant={displayCurrency === 'btc' ? 'default' : 'ghost'}
                onClick={() => setDisplayCurrency('btc')}
                className="flex items-center gap-1"
              >
                <Bitcoin className="w-3 h-3" />
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

            {/* BTC Price Display */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bitcoin className="w-4 h-4" />
              <span>BTC: ${btcPriceUSD.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost">
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-96 w-full">
        {enhancedCandlestickData.length === 0 ? (
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
              data={enhancedCandlestickData} 
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
                yAxisId="price"
                orientation="right"
                domain={['dataMin * 0.99', 'dataMax * 1.01']}
                tickFormatter={(value) => {
                  if (displayCurrency === 'usd') {
                    return value < 0.01 ? `$${Number(value).toFixed(6)}` : value < 1 ? `$${Number(value).toFixed(4)}` : `$${Number(value).toFixed(2)}`;
                  } else if (displayCurrency === 'btc') {
                    return `${Number(value).toFixed(8)}`;
                  } else {
                    return `${Number(value).toLocaleString()}`;
                  }
                }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<EnhancedTooltip displayCurrency={displayCurrency} btcPriceUSD={btcPriceUSD} />} />

              {chartType === 'candlestick' && (
                <Bar
                  yAxisId="price"
                  dataKey={getCandleDataKey() as any}
                  shape={(props) => <EnhancedCandlestickBar {...props} displayCurrency={displayCurrency} />}
                  isAnimationActive={false}
                />
              )}

              {chartType === 'line' && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey={getPriceKey('close')}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              )}

              {chartType === 'area' && (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey={getPriceKey('close')}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              )}

              {chartType === 'volume' && (
                <>
                  <Bar
                    yAxisId="price"
                    dataKey="buyVolume"
                    fill="hsl(var(--success))"
                    opacity={0.7}
                  />
                  <Bar
                    yAxisId="price"
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

      {/* Enhanced Trading Summary */}
      {enhancedCandlestickData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background border border-border rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Volume</div>
            <div className="text-sm font-medium">
              {displayCurrency === 'usd' && `$${enhancedCandlestickData.reduce((sum, d) => sum + d.volumeUSD, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              {displayCurrency === 'btc' && `${enhancedCandlestickData.reduce((sum, d) => sum + d.volumeBTC, 0).toFixed(6)} BTC`}
              {displayCurrency === 'sats' && `${(enhancedCandlestickData.reduce((sum, d) => sum + d.volumeBTC, 0) / SATOSHI_TO_BTC).toLocaleString()} sats`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Trades</div>
            <div className="text-sm font-medium">
              {enhancedCandlestickData.reduce((sum, d) => sum + d.trades, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Buy Trades</div>
            <div className="text-sm font-medium text-success">
              {enhancedCandlestickData.reduce((sum, d) => sum + d.buyTrades, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Sell Trades</div>
            <div className="text-sm font-medium text-destructive">
              {enhancedCandlestickData.reduce((sum, d) => sum + d.sellTrades, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}