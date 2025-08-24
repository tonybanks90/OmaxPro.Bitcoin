import React from 'react';
import { useParams } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { PriceChart } from '@/components/trading/PriceChart';
import { TradingInterface } from '@/components/trading/TradingInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExternalLink, Heart, Share2, TrendingUp } from 'lucide-react';

export default function TokenPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();

  // In a real app, fetch token data based on ID
  const tokenData = {
    id: id || 'demo',
    name: 'STYLE',
    symbol: 'STYLE',
    price: '$0.571K',
    marketCap: '$6.13K',
    change24h: '+15.7%',
    volume24h: '$1.53K',
    liquidity: '$1.53K',
    age: '4 days ago',
    contractAddress: '84A4...ump',
    pair: 'Pair ⚡',
    avatar: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=64&h=64&fit=crop",
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-token">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chart Section */}
        <div className="xl:col-span-3">
          {/* Token Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={tokenData.avatar}
                    alt={tokenData.name}
                    className="w-16 h-16 rounded-full"
                    data-testid="img-token-avatar"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-foreground" data-testid="text-token-name">
                      {tokenData.name}/USD
                    </h1>
                    <p className="text-muted-foreground" data-testid="text-token-description">
                      on Pump.Fun Nova - 1s
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" data-testid="button-share-token">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Price Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t('common.price')}</div>
                  <div className="text-lg font-bold text-foreground" data-testid="text-token-price">
                    {tokenData.price}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t('common.marketCap')}</div>
                  <div className="text-lg font-bold text-foreground" data-testid="text-token-market-cap">
                    {tokenData.marketCap}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">24h Change</div>
                  <div className="text-lg font-bold text-success" data-testid="text-token-change-24h">
                    {tokenData.change24h}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t('common.volume')}</div>
                  <div className="text-lg font-bold text-foreground" data-testid="text-token-volume">
                    {tokenData.volume24h}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Container */}
          <PriceChart tokenSymbol={tokenData.symbol} />
        </div>

        {/* Trading Panel */}
        <div className="space-y-6">
          {/* Token Quick Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">スタイル</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" data-testid="button-favorite-token">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" data-testid="button-share-token-detail">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" data-testid="button-external-link">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{tokenData.age}</span>
                  <span className="text-xs font-medium text-foreground" data-testid="text-token-pair">
                    {tokenData.pair}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground" data-testid="text-contract-address">
                  Token ({tokenData.contractAddress})
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{t('common.marketCap')}</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-detailed-market-cap">
                    {tokenData.marketCap}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Liquidity</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-token-liquidity">
                    {tokenData.liquidity}
                  </span>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">5M</div>
                  <div className="text-sm font-medium text-destructive" data-testid="text-change-5m">0.00%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">1H</div>
                  <div className="text-sm font-medium text-destructive" data-testid="text-change-1h">0.00%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">6H</div>
                  <div className="text-sm font-medium text-destructive" data-testid="text-change-6h">0.00%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">24H</div>
                  <div className="text-sm font-medium text-destructive" data-testid="text-change-24h">0.00%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Interface */}
          <TradingInterface tokenSymbol={tokenData.symbol} />

          {/* Additional Token Stats */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-foreground">Token Stats</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price in USD</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-price-usd">0.06129</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supply</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-token-supply">1B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dex Paid</span>
                  <span className="text-sm font-medium text-destructive" data-testid="text-dex-paid">Unpaid</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
