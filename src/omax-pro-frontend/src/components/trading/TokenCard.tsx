import { Link } from 'wouter';
import type { TokenData } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';

interface TokenCardProps {
  token: TokenData & {
    priceInSats?: string;
    priceInBTC?: string;
    marketCapInBTC?: string;
    volumeInBTC?: string;
    holders?: number;
    change5m?: string;
    change1h?: string;
  };
  showTradeButton?: boolean;
}

export function TokenCard({ token, showTradeButton = false }: TokenCardProps) {
  const { t } = useLanguage();

  const isPositive = (change: string) => change?.startsWith('+');

  return (
    <div className="p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" data-testid={`token-card-${token.id}`}>
      <Link href={`/token/${token.id}`}>
        <div className="flex items-start space-x-3">
          <img
            src={token.avatar || "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=48&h=48&fit=crop"}
            alt={token.name}
            className="w-12 h-12 rounded-full border-2 border-border"
            data-testid={`token-avatar-${token.id}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-foreground truncate" data-testid={`token-name-${token.id}`}>
                {token.name}
              </h4>
              <div className="flex items-center space-x-2">
                {token.holders !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{token.holders?.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground" data-testid={`token-symbol-${token.id}`}>
                ${token.symbol}
              </span>
              <span className="text-xs text-muted-foreground">
                {token.age}
              </span>
            </div>

            {/* Price Changes Row */}
            <div className="flex items-center justify-between mb-2 gap-2">
              {token.change5m && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">5m:</span>
                  <span className={`text-xs font-medium ${isPositive(token.change5m) ? 'text-success' : 'text-destructive'
                    }`}>
                    {token.change5m}
                  </span>
                </div>
              )}
              {token.change1h && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">1h:</span>
                  <span className={`text-xs font-medium ${isPositive(token.change1h) ? 'text-success' : 'text-destructive'
                    }`}>
                    {token.change1h}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                {isPositive(token.change24h) ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-xs font-medium ${isPositive(token.change24h) ? 'text-success' : 'text-destructive'
                  }`} data-testid={`token-change-${token.id}`}>
                  {token.change24h}
                </span>
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 bg-background rounded px-2 py-1">
                <DollarSign className="w-3 h-3 text-warning" />
                <span className="text-foreground font-medium" data-testid={`token-price-${token.id}`}>
                  {token.price}
                </span>
              </div>
              {token.priceInSats && (
                <span className="text-xs text-muted-foreground">
                  {token.priceInSats}
                </span>
              )}
            </div>

            {/* Market Cap & Volume Row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <div>
                <span>MC: </span>
                <span className="text-foreground" data-testid={`token-market-cap-${token.id}`}>{token.marketCap}</span>
              </div>
              <div>
                <span>Vol: </span>
                <span className="text-foreground" data-testid={`token-volume-${token.id}`}>{token.volume24h}</span>
              </div>
            </div>

            {showTradeButton && (
              <div className="mt-3">
                <Button
                  size="sm"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  data-testid={`button-trade-${token.id}`}
                >
                  {t('common.trade')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
