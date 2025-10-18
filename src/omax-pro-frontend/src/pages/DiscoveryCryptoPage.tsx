import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, Search, TrendingUp, TrendingDown, RefreshCw, Plus } from "lucide-react";
import { useCryptoData, useRefreshDiscoveryData } from "../hooks/useDiscoveryAPI";
import { useToast } from "../hooks/use-toast";

export default function DiscoveryCryptoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(50);
  
  const { data: cryptoAssets = [], isLoading, error } = useCryptoData(limit);
  const refreshMutation = useRefreshDiscoveryData();
  const { toast } = useToast();

  const filteredAssets = cryptoAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    refreshMutation.mutate("crypto", {
      onSuccess: () => {
        toast({
          title: "Data Refreshed",
          description: "Cryptocurrency data has been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh cryptocurrency data. Please try again.",
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
          <h2 className="text-xl font-semibold mb-2">Failed to Load Cryptocurrency Data</h2>
          <p className="text-muted-foreground mb-4">
            Unable to fetch cryptocurrency data. Please check your connection and try again.
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
          <h1 className="text-2xl font-bold">Cryptocurrency Discovery</h1>
          <p className="text-muted-foreground">
            Explore top cryptocurrencies and create predictions
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
                placeholder="Search cryptocurrencies..."
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
            <span className="text-sm text-muted-foreground">Show:</span>
            <div className="flex gap-2">
              {[25, 50, 100].map((count) => (
                <Button
                  key={count}
                  variant={limit === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLimit(count)}
                  data-testid={`button-limit-${count}`}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
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
            Showing {filteredAssets.length} of {cryptoAssets.length} cryptocurrencies
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-md transition-shadow" data-testid={`card-crypto-${asset.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0">
                      {asset.image ? (
                        <img
                          src={asset.image}
                          alt={asset.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {asset.symbol.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" data-testid={`text-name-${asset.id}`}>
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{asset.marketCapRank}
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
                      <span className="text-sm text-muted-foreground">24h Change</span>
                      <span className={`text-sm font-medium ${Number(asset.priceChangePercentage24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(asset.priceChangePercentage24h) >= 0 ? '+' : ''}
                        {Number(asset.priceChangePercentage24h).toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Market Cap</span>
                      <span className="text-sm">
                        ${Number(asset.marketCap).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Link href={`/discovery/crypto/${asset.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-details-${asset.id}`}>
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/create-prediction?asset=${asset.id}&category=crypto`}>
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
          <h3 className="text-lg font-semibold mb-2">No cryptocurrencies found</h3>
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