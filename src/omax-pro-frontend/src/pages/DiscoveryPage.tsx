import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { 
  Search, 
  TrendingUp, 
  Bitcoin, 
  BarChart3, 
  Trophy, 
  Cloud,
  RefreshCw,
  Eye,
  ArrowRight
} from "lucide-react";
import { useTrendingAssets, useCategoryStats, useDiscoverySearch, useRefreshDiscoveryData } from "../hooks/useDiscoveryAPI";
import { useToast } from "../hooks/use-toast";

const categories = [
  {
    id: "crypto",
    label: "Cryptocurrency",
    description: "Top 100 cryptocurrencies by market cap",
    icon: <Bitcoin className="h-6 w-6" />,
    color: "bg-orange-500",
    route: "/discovery/crypto"
  },
  {
    id: "stocks",
    label: "Stocks",
    description: "Trending stocks and market leaders",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "bg-green-500",
    route: "/discovery/stocks"
  },
  {
    id: "sports",
    label: "Sports",
    description: "Live sports events and upcoming matches",
    icon: <Trophy className="h-6 w-6" />,
    color: "bg-blue-500",
    route: "/discovery/sports"
  },
  {
    id: "weather",
    label: "Weather",
    description: "Weather conditions worldwide",
    icon: <Cloud className="h-6 w-6" />,
    color: "bg-purple-500",
    route: "/discovery/weather"
  }
];

export default function DiscoveryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // API hooks
  const { data: trendingAssets = [], isLoading: trendingLoading } = useTrendingAssets();
  const { data: categoryStats = [], isLoading: statsLoading } = useCategoryStats();
  // Search results handled by search page navigation
  const refreshMutation = useRefreshDiscoveryData();

  const handleRefresh = async (category: string) => {
    try {
      await refreshMutation.mutateAsync(category);
      toast({
        title: "Data Refreshed",
        description: `${category} data has been updated from external APIs.`,
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discovery/search?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Discovery
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Explore trending assets, events, and data across multiple categories to create predictions
        </p>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search across all categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-discovery-search"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
              data-testid="select-search-category"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <Button type="submit" data-testid="button-search">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Category Overview */}
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {categories.map((category) => {
    const stats = categoryStats.find((s) => s.category === category.id);

    return (
      <Card
        key={category.id}
        className="relative overflow-hidden hover:shadow-md transition-shadow h-full"
      >
        <div className={`absolute top-0 left-0 w-1 h-full ${category.color}`} />
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-md ${category.color} text-white`}>
                {category.icon}
              </div>
              <div>
                <CardTitle className="text-base">{category.label}</CardTitle>
                {statsLoading ? (
                  <Skeleton className="h-3 w-12 mt-1" />
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {stats?.total || 0} items
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleRefresh(category.id)}
              disabled={refreshMutation.isPending}
              data-testid={`button-refresh-${category.id}`}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <CardDescription className="text-xs mb-2 line-clamp-2">
            {category.description}
          </CardDescription>
          <div className="flex justify-between items-center">
            <Link href={category.route}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                data-testid={`button-explore-${category.id}`}
              >
                <Eye className="h-3 w-3 mr-1" />
                Explore
              </Button>
            </Link>
            {stats?.trending && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0.5">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.trending}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  })}
</div>


      {/* Trending Assets */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Across All Categories
          </CardTitle>
          <CardDescription>
            Popular assets and events that are gaining attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendingLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : trendingAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingAssets.slice(0, 6).map((asset) => (
                <Card key={`${asset.category}-${asset.externalId}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {asset.imageUrl ? (
                          <img 
                            src={asset.imageUrl} 
                            alt={asset.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {asset.symbol?.charAt(0) || asset.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{asset.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {asset.category}
                          </Badge>
                          {asset.symbol && (
                            <span className="text-xs text-muted-foreground uppercase">
                              {asset.symbol}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {asset.currentPrice && (
                          <div className="text-sm font-medium">
                            ${asset.currentPrice}
                          </div>
                        )}
                        {asset.change24h && (
                          <div className={`text-xs ${Number(asset.change24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {Number(asset.change24h) >= 0 ? '+' : ''}{Number(asset.change24h).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <Link href={`/discovery/${asset.category}/${asset.externalId}`}>
                      <Button variant="ghost" size="sm" className="w-full mt-3" data-testid={`button-view-${asset.category}-${asset.externalId}`}>
                        View Details
                        <ArrowRight className="h-3 w-3 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trending data available. Refresh categories to load data.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Prediction</CardTitle>
            <CardDescription>
              Start with a category or create a custom prediction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/create-prediction">
                <Button className="w-full" data-testid="button-create-prediction">
                  Create Custom Prediction
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                {categories.slice(0, 4).map((category) => (
                  <Link key={category.id} href={`/create-prediction?category=${category.id}`}>
                    <Button variant="outline" size="sm" className="w-full" data-testid={`button-create-${category.id}-prediction`}>
                      {category.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
            <CardDescription>
              Common discovery queries from the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                "Bitcoin price prediction",
                "Tesla stock forecast", 
                "NBA playoffs odds",
                "Hurricane season weather",
                "AI stocks trending"
              ].map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    setSearchQuery(search);
                    navigate(`/discovery/search?q=${encodeURIComponent(search)}`);
                  }}
                  data-testid={`button-popular-search-${index}`}
                >
                  <Search className="h-3 w-3 mr-2" />
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}