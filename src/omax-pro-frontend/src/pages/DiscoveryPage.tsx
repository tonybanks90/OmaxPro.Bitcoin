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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Discovery
        </h1>
        <p className="text-xl text-muted-foreground">
          Explore trending assets, events, and data across multiple categories to create predictions
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => {
          const stats = categoryStats.find((s) => s.category === category.id);

          return (
            <Link key={category.id} href={category.route}>
              <Card
                className="relative overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full group"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${category.color}`} />
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-lg ${category.color} text-white group-hover:scale-110 transition-transform`}>
                      {category.icon}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRefresh(category.id);
                      }}
                      disabled={refreshMutation.isPending}
                      data-testid={`button-refresh-${category.id}`}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                  <CardTitle className="text-xl mb-1">{category.label}</CardTitle>
                  {statsLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {stats?.total || 0} items available
                    </div>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <CardDescription className="text-sm mb-4 min-h-[2.5rem]">
                    {category.description}
                  </CardDescription>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      data-testid={`button-explore-${category.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Explore
                    </Button>
                    {stats?.trending && (
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{stats.trending}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Info Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About Discovery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Browse real-time data from multiple sources including cryptocurrencies, stocks, sports events, and weather conditions. 
              Click on any category above to explore available assets and create predictions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start by exploring a category. Each category provides detailed information and the ability to create custom predictions.
            </p>
            <Link href="/discovery/crypto">
              <Button className="w-full" data-testid="button-start-crypto">
                Start with Crypto
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}