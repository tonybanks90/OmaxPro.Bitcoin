import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { PredictionMarket } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

// Sample chart data
const generateSampleData = (market: PredictionMarket) => {
  const data = [];
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  for (let i = 0; i < 168; i++) { // 168 hours = 7 days
    const date = new Date(startDate.getTime() + i * 60 * 60 * 1000);
    const option1 = market.options[0];
    const option2 = market.options[1];
    
    // Generate realistic price movements
    const basePrice1 = option1.percentage;
    const basePrice2 = option2.percentage;
    const noise1 = (Math.random() - 0.5) * 5;
    const noise2 = (Math.random() - 0.5) * 5;
    
    data.push({
      time: date.toISOString(),
      [option1.label]: Math.max(10, Math.min(90, basePrice1 + noise1)),
      [option2.label]: Math.max(10, Math.min(90, basePrice2 + noise2)),
      volume: Math.floor(Math.random() * 50000) + 10000,
    });
  }
  
  return data;
};

interface MarketChartProps {
  market: PredictionMarket;
}

export function MarketChart({ market }: MarketChartProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');
  
  const chartData = generateSampleData(market);
  
  const timeRanges = [
    { value: '1h', label: '1H' },
    { value: '1d', label: '1D' },
    { value: '7d', label: '7D' },
    { value: '1m', label: '1M' },
  ];

  const formatTooltipValue = (value: any, name: string) => {
    if (chartType === 'volume') {
      return [`$${value.toLocaleString()}`, name];
    }
    return [`${value.toFixed(1)}%`, name];
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
          {market.options.slice(0, 2).map((option) => (
            <Badge
              key={option.id}
              variant="outline"
              className="text-sm"
              style={{ 
                borderColor: option.color,
                color: option.color,
                backgroundColor: option.color + '10'
              }}
            >
              {option.label}: {option.percentage}%
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
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
                {market.options.slice(0, 2).map((option) => (
                  <Line
                    key={option.id}
                    type="monotone"
                    dataKey={option.label}
                    stroke={option.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: option.color }}
                  />
                ))}
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
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Chart Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
          {chartType === 'price' ? (
            market.options.slice(0, 2).map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                <span>{option.label}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>Trading Volume</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}