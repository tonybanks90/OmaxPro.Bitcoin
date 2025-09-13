import React from 'react';
import { Link } from 'wouter';
import type { PredictionMarket } from '../../types';
import { Users, DollarSign, Clock, TrendingUp, Bitcoin } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';

interface PredictionCardProps {
  market: PredictionMarket;
  showFull?: boolean;
}

export function PredictionCard({ market, showFull = false }: PredictionCardProps) {
  const { t } = useLanguage();
  
  const formatTimeRemaining = (endDate: Date | string) => {
    const now = new Date();
    let endDateObj: Date;
    
    if (typeof endDate === 'string') {
      endDateObj = new Date(endDate);
    } else if (endDate instanceof Date) {
      endDateObj = endDate;
    } else {
      return 'Invalid date';
    }
    
    // Check if date is valid
    if (isNaN(endDateObj.getTime())) {
      return 'Invalid date';
    }
    
    const diff = endDateObj.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  const getPlaceholderImage = (category: string) => {
    const placeholders = {
      sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop&auto=format',
      crypto: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop&auto=format',
      politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=200&fit=crop&auto=format',
      entertainment: 'https://images.unsplash.com/photo-1489599363715-049ef8e7e4ee?w=400&h=200&fit=crop&auto=format',
      default: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&auto=format'
    };
    return placeholders[category as keyof typeof placeholders] || placeholders.default;
  };

  const mainOptions = market.options.slice(0, 2);
  const additionalOptions = market.options.slice(2);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-accent transition-colors group" data-testid={`prediction-card-${market.id}`}>
      {/* Image and Status */}
      <div className="relative">
        <img 
          src={market.image || getPlaceholderImage(market.category)} 
          alt={market.title}
          className="w-full h-40 sm:h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getPlaceholderImage(market.category);
          }}
          data-testid={`prediction-image-${market.id}`}
        />
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap items-center gap-1 sm:gap-2">
          <Badge variant={market.isActive ? "default" : "secondary"} className="text-xs">
            {market.isActive ? "Live" : "Ended"}
          </Badge>
          {market.featured && (
            <Badge variant="outline" className="text-xs bg-warning/10 border-warning text-warning">
              Featured
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
            <Clock className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">{formatTimeRemaining(market.endDate)}</span>
            <span className="sm:hidden">{formatTimeRemaining(market.endDate).replace(' left', '')}</span>
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Category and Title */}
        <div className="mb-3">
          <Badge variant="outline" className="text-xs mb-2" data-testid={`prediction-category-${market.id}`}>
            {market.category}
          </Badge>
          <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-accent transition-colors" data-testid={`prediction-title-${market.id}`}>
            {market.title}
          </h3>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span data-testid={`prediction-participants-${market.id}`}>
              {market.participants.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span data-testid={`prediction-volume-usd-${market.id}`} className="hidden sm:inline">
                {market.totalVolumeUSD}
              </span>
              <span data-testid={`prediction-volume-usd-mobile-${market.id}`} className="sm:hidden">
                {market.totalVolumeUSD.replace('$', '$').replace('K', 'k').replace('M', 'm')}
              </span>
            </div>
            <div className="flex items-center space-x-1 hidden sm:flex">
              <Bitcoin className="w-3 h-3" />
              <span data-testid={`prediction-volume-sats-${market.id}`}>
                {market.totalVolumeSats}
              </span>
            </div>
          </div>
        </div>

        {/* Main Prediction Options */}
        <div className="space-y-2 mb-3">
          {mainOptions.map((option) => (
            <Link key={option.id} href={`/prediction/${market.id}`}>
              <Button
                variant="outline"
                className={`w-full flex items-center justify-between p-2 sm:p-3 h-auto transition-all hover:scale-[1.02] border-2`}
                style={{ borderColor: option.color + '40' }}
                data-testid={`prediction-option-${option.id}`}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="font-medium text-sm sm:text-base truncate">{option.label}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm" style={{ color: option.color }}>
                    {option.percentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.odds.toFixed(2)}x
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        {/* Additional Options (if more than 2) */}
        {additionalOptions.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                +{additionalOptions.length} more options
              </span>
              <div className="flex space-x-1">
                {additionalOptions.slice(0, 3).map((option, index) => (
                  <div
                    key={option.id}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: option.color }}
                    title={`${option.label}: ${option.percentage}%`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {market.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {market.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {market.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{market.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}