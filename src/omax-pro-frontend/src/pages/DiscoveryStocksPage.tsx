import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, Search, TrendingUp, TrendingDown, RefreshCw, Plus } from "lucide-react";
import { useStockData, useTrendingStocks, useRefreshDiscoveryData } from "../hooks/useDiscoveryAPI";
import { useToast } from "../hooks/use-toast";

export default function DiscoveryStocksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTrending, setShowTrending] = useState(false);
  
  const { data: stockAssets = [], isLoading: stocksLoading, error: stocksError } = useStockData();
  const { data: trendingStocks = [], isLoading: trendingLoading, error: trendingError } = useTrendingStocks();
  const refreshMutation = useRefreshDiscoveryData();
  const { toast } = useToast();

  const currentData = showTrending ? trendingStocks : stockAssets;
  const isLoading = showTrending ? trendingLoading : stocksLoading;
  const error = showTrending ? trendingError : stocksError;

  const filteredAssets = currentData.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    refreshMutation.mutate("stocks", {
      onSuccess: () => {
        toast({
          title: "Data Refreshed",
          description: "Stock market data has been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh stock data. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <TrendingDown className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Stock Data</h2>
          <p className="text-muted-foreground mb-4">
            Unable to fetch stock market data. Please check your connection and try again.
          </p>
          <Button onClick={handleRefresh} disabled={refreshMutation.isPending} data-testid="button-retry">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/discovery">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Discovery
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Stock Market Discovery</h1>
          <p className="text-muted-foreground">
            Explore stocks and create market predictions
          </p>
        </div>
      </div>

      {/* Search and Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshMutation.isPending}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/create-prediction">
                <Button data-testid="button-create-prediction">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prediction
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex gap-2">
              <Button
                variant={!showTrending ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTrending(false)}
                data-testid="button-all-stocks"
              >
                All Stocks
              </Button>
              <Button
                variant={showTrending ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTrending(true)}
                data-testid="button-trending-stocks"
              >
                Trending
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stocks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredAssets.length} {showTrending ? 'trending' : ''} stocks
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-md transition-shadow" data-testid={`card-stock-${asset.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                        {asset.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" data-testid={`text-name-${asset.id}`}>
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {asset.exchange}
                        </Badge>
                        <span className="text-xs text-muted-foreground uppercase">
                          {asset.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-medium" data-testid={`text-price-${asset.id}`}>
                        ${Number(asset.currentPrice).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Change</span>
                      <span className={`text-sm font-medium ${Number(asset.changePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(asset.changePercent) >= 0 ? '+' : ''}
                        {Number(asset.changePercent).toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Volume</span>
                      <span className="text-sm">
                        {Number(asset.volume).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Link href={`/discovery/stocks/${asset.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-details-${asset.id}`}>
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/create-prediction?asset=${asset.id}&category=stocks`}>
                      <Button size="sm" data-testid={`button-predict-${asset.id}`}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Predict
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {filteredAssets.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No stocks found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or refresh the data.
          </p>
          <Button onClick={() => setSearchQuery("")} variant="outline" data-testid="button-clear-search">
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}