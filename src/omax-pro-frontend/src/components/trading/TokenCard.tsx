import React from 'react';
import { Link } from 'wouter';
import { TokenData } from '@/types';
import { Heart, MessageCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface TokenCardProps {
  token: TokenData;
  showTradeButton?: boolean;
}

export function TokenCard({ token, showTradeButton = false }: TokenCardProps) {
  const { t } = useLanguage();
  
  const isPositive = (change: string) => change.startsWith('+');
  
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
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">0</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground" data-testid={`token-symbol-${token.id}`}>
                {token.symbol}
              </span>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">0</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                <span>{token.age}</span>
              </span>
              <div className="flex items-center space-x-1">
                {isPositive(token.change24h) ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-xs font-medium ${
                  isPositive(token.change24h) ? 'text-success' : 'text-destructive'
                }`} data-testid={`token-change-${token.id}`}>
                  {token.change24h}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Bundled:</span>
                <span className={token.isBundled ? "text-destructive" : "text-success"}>
                  {token.isBundled ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-background rounded px-2 py-1">
                <DollarSign className="w-3 h-3 text-warning" />
                <span className="text-foreground font-medium" data-testid={`token-price-${token.id}`}>
                  {token.price}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-1">
              <span>MC: </span>
              <span data-testid={`token-market-cap-${token.id}`}>{token.marketCap}</span>
              <span className="ml-2">Vol: </span>
              <span data-testid={`token-volume-${token.id}`}>{token.volume24h}</span>
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
