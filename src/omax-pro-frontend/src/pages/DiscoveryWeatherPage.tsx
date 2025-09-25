import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, Search, Cloud, Sun, CloudRain, RefreshCw, Plus, Thermometer, Droplets, Wind, Eye } from "lucide-react";
import { usePopularWeather, useRefreshDiscoveryData } from "../hooks/useDiscoveryAPI";
import { useToast } from "../hooks/use-toast";

export default function DiscoveryWeatherPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: weatherData = [], isLoading, error } = usePopularWeather();
  const refreshMutation = useRefreshDiscoveryData();
  const { toast } = useToast();

  const filteredData = weatherData.filter(weather =>
    weather.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    refreshMutation.mutate("weather", {
      onSuccess: () => {
        toast({
          title: "Data Refreshed",
          description: "Weather data has been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh weather data. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const getWeatherIcon = (temp: number | null) => {
    const temperature = temp || 0;
    if (temperature > 25) return <Sun className="h-5 w-5 text-yellow-500" />;
    if (temperature > 15) return <Cloud className="h-5 w-5 text-blue-500" />;
    return <CloudRain className="h-5 w-5 text-gray-500" />;
  };

  const getTemperatureColor = (temp: number | null) => {
    const temperature = temp || 0;
    if (temperature > 30) return "text-red-500";
    if (temperature > 20) return "text-orange-500";
    if (temperature > 10) return "text-blue-500";
    return "text-cyan-500";
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Cloud className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Weather Data</h2>
          <p className="text-muted-foreground mb-4">
            Unable to fetch weather data. Please check your connection and try again.
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
          <h1 className="text-2xl font-bold">Weather Discovery</h1>
          <p className="text-muted-foreground">
            Explore weather conditions and create climate predictions
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
                placeholder="Search locations..."
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
        </CardContent>
      </Card>

      {/* Weather Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredData.length} weather locations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.map((weather) => (
              <Card key={weather.id} className="hover:shadow-md transition-shadow" data-testid={`card-weather-${weather.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      {getWeatherIcon(weather.temperature)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" data-testid={`text-location-${weather.id}`}>
                        {weather.location}
                      </h3>
                      <div className="text-xs text-muted-foreground capitalize">
                        {weather.condition}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <div className={`text-2xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                      {Number(weather.temperature || 0).toFixed(1)}°C
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Feels like {Number(weather.temperature || 0).toFixed(1)}°C
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span>Humidity</span>
                      </div>
                      <span>{weather.humidity}%</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Wind className="h-3 w-3 text-gray-500" />
                        <span>Wind</span>
                      </div>
                      <span>{Number(weather.windSpeed || 0).toFixed(1)} km/h</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-green-500" />
                        <span>Visibility</span>
                      </div>
                      <span>{Number(weather.visibility || 0).toFixed(1)} km</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3 text-purple-500" />
                        <span>Pressure</span>
                      </div>
                      <span>{Number(weather.pressure || 0).toFixed(0)} hPa</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link href={`/discovery/weather/${weather.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-details-${weather.id}`}>
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/create-prediction?asset=${weather.id}&category=weather`}>
                      <Button size="sm" data-testid={`button-predict-${weather.id}`}>
                        <Cloud className="h-3 w-3 mr-1" />
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

      {filteredData.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Cloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No weather data found</h3>
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