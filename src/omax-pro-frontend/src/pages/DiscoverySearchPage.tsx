import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, Search, TrendingUp, RefreshCw } from "lucide-react";
import { useDiscoverySearch } from "../hooks/useDiscoveryAPI";
import { useToast } from "../hooks/use-toast";

export default function DiscoverySearchPage() {
  const searchParams = new URLSearchParams(useSearch());
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [location, setLocation] = useLocation();
  
  const { data: searchResults = [], isLoading, error } = useDiscoverySearch(
    searchQuery, 
    selectedCategory === "all" ? undefined : selectedCategory
  );

  const { toast } = useToast();

  const categories = [
    { id: "all", name: "All Categories" },
    { id: "crypto", name: "Cryptocurrency" },
    { id: "stocks", name: "Stocks" },
    { id: "sports", name: "Sports" },
    { id: "weather", name: "Weather" }
  ];

  const handleSearch = (query: string, category: string) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    
    setLocation(`/discovery/search?${params.toString()}`);
  };

  useEffect(() => {
    if (initialQuery !== searchQuery || initialCategory !== selectedCategory) {
      handleSearch(searchQuery, selectedCategory);
    }
  }, [searchQuery, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "crypto": return "₿";
      case "stocks": return "📈";
      case "sports": return "🏆";
      case "weather": return "🌤️";
      default: return "🔍";
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Search Failed</h2>
          <p className="text-muted-foreground mb-4">
            Unable to perform search. Please try again.
          </p>
          <Button onClick={() => handleSearch(searchQuery, selectedCategory)} data-testid="button-retry">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Search
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
          <h1 className="text-2xl font-bold">Search Results</h1>
          <p className="text-muted-foreground">
            {searchQuery ? `Search results for "${searchQuery}"` : "Enter a search term to get started"}
          </p>
        </div>
      </div>

      {/* Search Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across all categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery, selectedCategory)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Button 
              onClick={() => handleSearch(searchQuery, selectedCategory)}
              disabled={!searchQuery.trim()}
              data-testid="button-search"
            >
              Search
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-muted-foreground">Category:</span>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`button-category-${category.id}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchQuery && searchResults.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {searchResults.length} results for "{searchQuery}"
            {selectedCategory !== "all" && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((asset) => (
              <Card key={`${asset.category}-${asset.externalId}`} className="hover:shadow-md transition-shadow" data-testid={`card-result-${asset.category}-${asset.externalId}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                          {getCategoryIcon(asset.category)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" data-testid={`text-name-${asset.category}-${asset.externalId}`}>
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {asset.category}
                        </Badge>
                        {asset.symbol && (
                          <span className="text-xs text-muted-foreground uppercase">
                            {asset.symbol}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {asset.currentPrice && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="font-medium">
                          {asset.category === "weather" ? asset.currentPrice : `$${asset.currentPrice}`}
                        </span>
                      </div>
                    )}
                    
                    {asset.change24h && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">24h Change</span>
                        <span className={`text-sm font-medium ${Number(asset.change24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {Number(asset.change24h) >= 0 ? '+' : ''}
                          {Number(asset.change24h).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Link href={`/discovery/${asset.category}/${asset.externalId}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-details-${asset.category}-${asset.externalId}`}>
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/create-prediction?asset=${asset.externalId}&category=${asset.category}`}>
                      <Button size="sm" data-testid={`button-predict-${asset.category}-${asset.externalId}`}>
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
      ) : searchQuery ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground mb-4">
            No assets found matching "{searchQuery}" 
            {selectedCategory !== "all" && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}.
            Try adjusting your search terms or category filter.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setSelectedCategory("all")} variant="outline" data-testid="button-all-categories">
              Search All Categories
            </Button>
            <Button onClick={() => setSearchQuery("")} variant="outline" data-testid="button-clear-search">
              Clear Search
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Start Your Search</h3>
          <p className="text-muted-foreground mb-4">
            Enter a search term above to find assets across all categories.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/discovery/crypto">
              <Button variant="outline" data-testid="button-browse-crypto">Browse Crypto</Button>
            </Link>
            <Link href="/discovery/stocks">
              <Button variant="outline" data-testid="button-browse-stocks">Browse Stocks</Button>
            </Link>
            <Link href="/discovery/sports">
              <Button variant="outline" data-testid="button-browse-sports">Browse Sports</Button>
            </Link>
            <Link href="/discovery/weather">
              <Button variant="outline" data-testid="button-browse-weather">Browse Weather</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}