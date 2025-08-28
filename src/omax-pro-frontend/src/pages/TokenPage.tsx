import { useParams } from 'wouter';
import { useTokenAPI } from '../hooks/useTokenAPI';
import { useLanguage } from '../contexts/LanguageContext';
import { PriceChart } from '../components/trading/PriceChart';
import { TradingInterface } from '../components/trading/TradingInterface';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { ExternalLink, Heart, Share2 } from 'lucide-react';

export default function TokenPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { token, isLoading } = useTokenAPI(id || '');

  // Fallback data if token not found or API fails
  const fallbackData = {
    id: id || '2jjj',
    name: 'ODINDOG',
    symbol: 'ODINDOG•ID•YTTL•ODIN',
    price: '$0.73120',
    marketCap: '$15.36M',
    change24h: '+15.7%',
    volume24h: '$1.53K',
    liquidity: '$811.53K',
    age: '4 days ago',
    contractAddress: '2jjj',
    pair: 'Pair ⚡',
    avatar: "https://images.odin.fun/token/2jjj",
  };

  // Use real token data if available, otherwise fallback
  const tokenData = token ? {
    ...token,
    pair: 'Pair ⚡', // Add missing fields for display
    contractAddress: token.contractAddress.slice(0, 4) + '...' + token.contractAddress.slice(-3)
  } : fallbackData;

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-token">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </main>
    );
  }

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
                      {tokenData.name}/BTC
                    </h1>
                    <p className="text-muted-foreground" data-testid="text-token-description">
                      on Odin.Fun Omax - 1s
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
                  <div className={`text-lg font-bold ${
                    tokenData.change24h?.startsWith('+') ? 'text-success' : 'text-destructive'
                  }`} data-testid="text-token-change-24h">
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
                  <span className="text-sm font-medium text-foreground" data-testid="text-token-supply">21M</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
