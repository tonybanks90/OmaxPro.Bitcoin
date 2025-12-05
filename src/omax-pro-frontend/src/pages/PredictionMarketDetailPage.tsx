import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useLanguage } from '../contexts/LanguageContext';
import type { PredictionMarket, PredictionOption } from '../types';
import { usePredictionMarket } from '../hooks/usePredictionMarketsAPI';
import { BettingInterface } from '../components/prediction/BettingInterface';
import { MarketChat } from '../components/prediction/MarketChat';
import { MarketChart } from '../components/prediction/MarketChart';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Share, Clock, Users, DollarSign, Bitcoin, TrendingUp, Calendar, Info } from 'lucide-react';
import { Link } from 'wouter';
import { MarketActivity } from '../components/prediction/MarketActivity';
import { MarketDebugPanel } from '../components/prediction/MarketDebugPanel';


export default function PredictionMarketDetailPage() {
  const { t } = useLanguage();
  const [, params] = useRoute('/prediction/:id');
  const [selectedOption, setSelectedOption] = useState<PredictionOption | undefined>();

  const marketId = params?.id || '1';

  // Fetch market data from API
  const { data: market, isLoading, error } = usePredictionMarket(marketId);

  // Set first option as default when market loads
  useEffect(() => {
    if (market && market.options.length > 0) {
      setSelectedOption(market.options[0]);
    }
  }, [market]);

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
    if (diff <= 0) return 'Market Closed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} days, ${hours} hours remaining`;
    return `${hours} hours remaining`;
  };

  const getPlaceholderImage = (category: string) => {
    const placeholders = {
      sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=300&fit=crop&auto=format',
      crypto: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=300&fit=crop&auto=format',
      politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=300&fit=crop&auto=format',
      entertainment: 'https://images.unsplash.com/photo-1489599363715-049ef8e7e4ee?w=600&h=300&fit=crop&auto=format',
      default: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop&auto=format'
    };
    return placeholders[category as keyof typeof placeholders] || placeholders.default;
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-prediction-detail">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading prediction market...</p>
        </div>
      </main>
    );
  }

  if (error || !market) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-prediction-detail">
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">Market Not Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            The prediction market you're looking for could not be found.
          </p>
          <Link href="/prediction-markets">
            <Button>Back to Markets</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-prediction-detail">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/prediction-markets">
          <Button variant="ghost" className="flex items-center space-x-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Markets</span>
          </Button>
        </Link>
      </div>

      {/* Market Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
          {/* Market Image */}
          <div className="flex-shrink-0 mb-4 lg:mb-0">
            <img
              src={market.image || getPlaceholderImage(market.category)}
              alt={market.title}
              className="w-full lg:w-80 h-48 lg:h-60 object-cover rounded-xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getPlaceholderImage(market.category);
              }}
            />
          </div>

          {/* Market Info */}
          <div className="flex-1 space-y-4">
            {/* Title and Status */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline">{market.category}</Badge>
                <Badge variant={market.isActive ? "default" : "secondary"}>
                  {market.isActive ? "Live" : "Ended"}
                </Badge>
                {market.featured && (
                  <Badge variant="outline" className="bg-warning/10 border-warning text-warning">
                    Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                {market.title}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatTimeRemaining(market.endDate)}</span>
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-4 gap-2 lg:gap-3">
              <div className="bg-surface border border-border rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <DollarSign className="w-3 h-3 text-success" />
                  <span className="text-xs text-muted-foreground">Volume</span>
                </div>
                <div className="font-bold text-sm">{market.totalVolumeUSD}</div>
              </div>

              <div className="bg-surface border border-border rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <Bitcoin className="w-3 h-3 text-warning" />
                  <span className="text-xs text-muted-foreground">Sats</span>
                </div>
                <div className="font-bold text-sm">{market.totalVolumeSats}</div>
              </div>

              <div className="bg-surface border border-border rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <Users className="w-3 h-3 text-accent" />
                  <span className="text-xs text-muted-foreground">Users</span>
                </div>
                <div className="font-bold text-sm">{market.participants.toLocaleString()}</div>
              </div>

              <div className="bg-surface border border-border rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Options</span>
                </div>
                <div className="font-bold text-sm">{market.options.length}</div>
              </div>
            </div>

            {/* Share Button */}
            <div className="flex space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Share className="w-4 h-4" />
                <span>Share Market</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Chart */}
          <MarketChart market={market} />

          {/* Market Activity */}
          <MarketActivity marketId={marketId} />

          {/* Market Description */}
          <Card className="border-2 border-border/50 shadow-lg bg-gradient-to-br from-surface to-surface/80">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-t-xl border-b border-border/30">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <Info className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Market Description
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Main Description */}
              <div className="mb-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed text-base font-normal tracking-wide">
                    {market.description}
                  </p>
                </div>
              </div>

              <Separator className="my-6 bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Market Details Grid */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                    <div className="w-1 h-4 bg-accent rounded-full"></div>
                    <span>Market Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm font-medium">Creator</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                          <span className="font-semibold text-foreground">{market.creator}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm font-medium">Resolution Date</span>
                        <span className="font-semibold text-foreground">
                          {typeof market.endDate === 'string'
                            ? new Date(market.endDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                            : market.endDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          }
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm font-medium">Market ID</span>
                        <span className="font-mono text-xs font-semibold text-foreground bg-background/50 px-2 py-1 rounded">
                          #{market.id}
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm font-medium">Status</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${market.isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></div>
                          <span className={`font-semibold ${market.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                            {market.isActive ? 'Live Trading' : 'Market Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                {market.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-4 flex items-center space-x-2">
                      <div className="w-1 h-4 bg-accent rounded-full"></div>
                      <span>Related Topics</span>
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {market.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm px-3 py-1.5 font-medium bg-gradient-to-r from-accent/10 to-accent/20 border-accent/30 text-accent hover:from-accent/20 hover:to-accent/30 transition-all duration-200"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Market Chat - Mobile/Tablet */}
          <div className="lg:hidden">
            <MarketChat marketId={marketId} />
          </div>
        </div>

        {/* Right Column - Betting Interface and Chat */}
        <div className="space-y-6">
          {/* Betting Interface */}
          <BettingInterface
            market={market}
            selectedOption={selectedOption}
            onOptionSelect={setSelectedOption}
          />

          {/* Debug Panel - Development Only */}
          <MarketDebugPanel marketId={marketId} />

          {/* Market Chat - Desktop */}
          <div className="hidden lg:block">
            <MarketChat marketId={marketId} />
          </div>
        </div>
      </div>
    </main>
  );
}