import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { MarketsService } from '../../services/markets-service';

interface MarketChartProps {
  marketId: string;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
}

export function MarketChart({ marketId }: MarketChartProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Markets canister
  useEffect(() => {
    const fetchData = async () => {
      if (!marketId) return;

      try {
        const mId = BigInt(marketId);
        const txs = await MarketsService.getMarketActivity(mId);

        // Transform transactions into chart data points
        // Group by time intervals and track price evolution
        const dataPoints: ChartDataPoint[] = txs.map((tx: any) => {
          const timestampMs = Number(tx.timestamp) / 1000000;
          const date = new Date(timestampMs);

          // Calculate YES/NO prices from transaction
          const price = tx.price || 0.5;
          let yesPrice = 50;
          let noPrice = 50;

          if (tx.tokenIdentifier && 'Binary' in tx.tokenIdentifier) {
            if ('YES' in tx.tokenIdentifier.Binary) {
              yesPrice = price * 100;
              noPrice = (1 - price) * 100;
            } else if ('NO' in tx.tokenIdentifier.Binary) {
              noPrice = price * 100;
              yesPrice = (1 - price) * 100;
            }
          }

          return {
            time: date.toISOString(),
            timestamp: timestampMs,
            yesPrice: yesPrice,
            noPrice: noPrice,
            volume: Number(tx.cost) || 0
          };
        });

        // Sort by time (oldest first for chart)
        dataPoints.sort((a, b) => a.timestamp - b.timestamp);

        setChartData(dataPoints);
      } catch (e) {
        console.error("Failed to fetch chart data", e);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [marketId]);

  const timeRanges = [
    { value: '1h', label: '1H' },
    { value: '1d', label: '1D' },
    { value: '7d', label: '7D' },
    { value: '1m', label: '1M' },
  ];

  const formatTooltipValue = (value: any, name: string) => {
    if (chartType === 'volume') {
      return [`${value.toLocaleString()} sats`, name];
    }
    return [`${value.toFixed(1)}%`, name];
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Get current prices from last data point
  const currentYesPrice = chartData.length > 0 ? chartData[chartData.length - 1].yesPrice : 50;
  const currentNoPrice = chartData.length > 0 ? chartData[chartData.length - 1].noPrice : 50;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Market Chart</span>
          </CardTitle>

          <div className="flex items-center space-x-2">
            {/* Chart Type Toggle */}
            <div className="flex bg-surface rounded-lg p-1">
              <Button
                variant={chartType === 'price' ? 'default' : 'ghost'}
                onClick={() => setChartType('price')}
                size="sm"
                data-testid="button-chart-price"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Price
              </Button>
              <Button
                variant={chartType === 'volume' ? 'default' : 'ghost'}
                onClick={() => setChartType('volume')}
                size="sm"
                data-testid="button-chart-volume"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Volume
              </Button>
            </div>

            {/* Time Range */}
            <div className="flex bg-surface rounded-lg p-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? 'default' : 'ghost'}
                  onClick={() => setTimeRange(range.value)}
                  size="sm"
                  data-testid={`button-time-range-${range.value}`}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Prices */}
        <div className="flex items-center space-x-4 mt-2">
          <Badge
            variant="outline"
            className="text-sm border-green-500 text-green-500 bg-green-500/10"
          >
            Yes: {currentYesPrice.toFixed(1)}%
          </Badge>
          <Badge
            variant="outline"
            className="text-sm border-red-500 text-red-500 bg-red-500/10"
          >
            No: {currentNoPrice.toFixed(1)}%
          </Badge>
          {loading && (
            <span className="text-xs text-muted-foreground">Loading...</span>
          )}
          {!loading && chartData.length === 0 && (
            <span className="text-xs text-muted-foreground">No trading data yet</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'price' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatXAxis}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    formatter={formatTooltipValue}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--surface))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="yesPrice"
                    name="Yes"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={true}
                    activeDot={{ r: 4, fill: '#22c55e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="noPrice"
                    name="No"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={true}
                    activeDot={{ r: 4, fill: '#ef4444' }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatXAxis}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={formatTooltipValue}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--surface))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    name="Volume"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {loading ? 'Loading chart data...' : 'No trading activity yet. Place some trades to see the chart.'}
            </div>
          )}
        </div>

        {/* Chart Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
          {chartType === 'price' ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Yes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>No</span>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>Trading Volume (sats)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}