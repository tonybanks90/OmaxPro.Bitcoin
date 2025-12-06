import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { Download, Maximize2, Bitcoin } from 'lucide-react';
import { useOdinTokenTrades, useBTCPrice, type OdinTradeData } from '../../hooks/useOdinAPI';
import {
  createChart,
  ColorType,
  LineStyle,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time
} from 'lightweight-charts';

interface PriceChartProps {
  tokenId: string;
  tokenSymbol?: string;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
}

const SATOSHI_TO_BTC = 0.00000001;

function parseTradePrice(apiValue: number, btcPriceUSD: number) {
  const satoshis = apiValue / 1000;
  const btc = satoshis * SATOSHI_TO_BTC;
  const usd = btc * btcPriceUSD;
  return { satoshis, btc, usd };
}

export function PriceChart({ tokenId }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState('1h');
  const [displayCurrency, setDisplayCurrency] = useState<'usd' | 'btc' | 'sats'>('usd');
  const [chartReady, setChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const { trades, isLoading, error } = useOdinTokenTrades(tokenId, 1, 500);
  const { btcPriceUSD, isLoading: btcLoading } = useBTCPrice();

  const timeframes = useMemo(() => [
    { value: '5m', label: '5m', ms: 5 * 60 * 1000 },
    { value: '15m', label: '15m', ms: 15 * 60 * 1000 },
    { value: '1h', label: '1h', ms: 60 * 60 * 1000 },
    { value: '4h', label: '4h', ms: 4 * 60 * 60 * 1000 },
    { value: '1d', label: '1d', ms: 24 * 60 * 60 * 1000 },
  ], []);

  // Debug logging
  useEffect(() => {
    console.log('📊 Chart Debug Info:', {
      tokenId,
      tradesCount: trades?.length || 0,
      isLoading,
      error,
      btcPriceUSD,
      btcLoading,
      chartReady
    });
  }, [tokenId, trades, isLoading, error, btcPriceUSD, btcLoading, chartReady]);

  // Process candlestick data
  const candleData = useMemo(() => {
    if (!trades || trades.length === 0 || btcLoading) {
      console.log('⚠️ No candle data: trades empty or BTC loading');
      return [];
    }

    console.log('🔄 Processing trades:', trades.length);

    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const intervals: { [key: string]: OdinTradeData[] } = {};
    const intervalMs = timeframes.find(tf => tf.value === timeframe)?.ms || 60 * 60 * 1000;

    sortedTrades.forEach(trade => {
      if (!trade.price || trade.price <= 0) return;

      const tradeTime = new Date(trade.time).getTime();
      const intervalStart = Math.floor(tradeTime / intervalMs) * intervalMs;
      const intervalKey = intervalStart.toString();

      if (!intervals[intervalKey]) intervals[intervalKey] = [];
      intervals[intervalKey].push(trade);
    });

    const candles: CandleData[] = [];

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

        const volume = intervalTrades.reduce((sum, t) => sum + (t.amount_token || 0), 0);

        candles.push({
          time: Math.floor(parseInt(timestamp) / 1000),
          open,
          high,
          low,
          close,
          volume,
          trades: intervalTrades.length
        });
      });

    console.log('✅ Candles processed:', candles.length);
    if (candles.length > 0) {
      console.log('📍 First candle:', candles[0]);
      console.log('📍 Last candle:', candles[candles.length - 1]);
    }

    return candles;
  }, [trades, timeframe, btcLoading, timeframes]);

  // Initialize chart function
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    console.log('🎨 Initializing chart...');

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1f2937',
      },
      rightPriceScale: {
        borderColor: '#1f2937',
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.3)',
          style: LineStyle.Dashed,
        },
        horzLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.3)',
          style: LineStyle.Dashed,
        },
      },
    });

    // Add series immediately
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;
    setChartReady(true);
    console.log('✅ Chart initialized and series added');
  }, []);

  // Initialize chart when container is available AND we have data
  useEffect(() => {
    if (candleData.length > 0 && chartContainerRef.current && !chartRef.current) {
      initializeChart();
    }
  }, [candleData.length, initializeChart]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up chart');
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current || !chartReady || candleData.length === 0) {
      console.log('⚠️ No candle data to display or series not ready', { chartReady, candleLength: candleData.length });
      return;
    }

    console.log('📊 Updating chart with', candleData.length, 'candles');

    try {
      // Prepare data with currency conversion
      const chartData: CandlestickData[] = candleData.map(d => {
        const openData = parseTradePrice(d.open, btcPriceUSD);
        const highData = parseTradePrice(d.high, btcPriceUSD);
        const lowData = parseTradePrice(d.low, btcPriceUSD);
        const closeData = parseTradePrice(d.close, btcPriceUSD);

        const candle = {
          time: d.time as Time,
          open: displayCurrency === 'usd' ? openData.usd : displayCurrency === 'sats' ? openData.satoshis : openData.btc,
          high: displayCurrency === 'usd' ? highData.usd : displayCurrency === 'sats' ? highData.satoshis : highData.btc,
          low: displayCurrency === 'usd' ? lowData.usd : displayCurrency === 'sats' ? lowData.satoshis : lowData.btc,
          close: displayCurrency === 'usd' ? closeData.usd : displayCurrency === 'sats' ? closeData.satoshis : closeData.btc,
        };

        return candle;
      });

      seriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();
      console.log('✅ Chart updated successfully');
    } catch (err) {
      console.error('❌ Error updating chart:', err);
    }
  }, [candleData, displayCurrency, btcPriceUSD, chartReady]);

  if (isLoading || btcLoading) {
    return (
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
        <div className="h-[580px] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
        <div className="h-[580px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400">Error loading trades</p>
            <p className="text-sm text-gray-500 mt-2">{error.toString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1f2937]">
        <div className="flex items-center justify-between mb-4">
          {/* Chart Type */}
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="default" className="bg-[#1f2937] hover:bg-[#374151] text-white">
              Candlestick
            </Button>
            <span className="text-xs text-gray-500 ml-2">
              {candleData.length} candles | {trades?.length || 0} trades
            </span>
          </div>

          {/* Timeframe */}
          <div className="flex items-center space-x-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                size="sm"
                variant={timeframe === tf.value ? 'default' : 'ghost'}
                onClick={() => setTimeframe(tf.value)}
                className={timeframe === tf.value ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-[#1f2937]'}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Currency & BTC Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={displayCurrency === 'usd' ? 'default' : 'ghost'}
              onClick={() => setDisplayCurrency('usd')}
              className={displayCurrency === 'usd' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-[#1f2937]'}
            >
              $ USD
            </Button>
            <Button
              size="sm"
              variant={displayCurrency === 'btc' ? 'default' : 'ghost'}
              onClick={() => setDisplayCurrency('btc')}
              className={displayCurrency === 'btc' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-[#1f2937]'}
            >
              ₿ BTC
            </Button>
            <Button
              size="sm"
              variant={displayCurrency === 'sats' ? 'default' : 'ghost'}
              onClick={() => setDisplayCurrency('sats')}
              className={displayCurrency === 'sats' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-[#1f2937]'}
            >
              Sats
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-400 ml-4">
              <Bitcoin className="w-4 h-4" />
              <span>BTC: ${btcPriceUSD.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#1f2937]">
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#1f2937]">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#0f172a]">
        {candleData.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400">No trading data available</p>
              <p className="text-sm text-gray-500 mt-2">
                {trades?.length ? `${trades.length} trades found but no candles generated` : 'Waiting for trades...'}
              </p>
            </div>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full" style={{ height: '500px' }} />
        )}
      </div>
    </div>
  );
}