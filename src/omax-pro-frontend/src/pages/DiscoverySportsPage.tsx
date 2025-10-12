import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, Search, Trophy, Calendar, RefreshCw, Plus } from "lucide-react";
import { useSportsEvents, useRefreshDiscoveryData } from "../hooks/useDiscoveryAPI";
import { useToast } from "../hooks/use-toast";

export default function DiscoverySportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  
  const { data: sportsEvents = [], isLoading, error } = useSportsEvents(
    selectedSport !== "all" ? selectedSport : undefined
  );
  const refreshMutation = useRefreshDiscoveryData();
  const { toast } = useToast();

  const filteredEvents = sportsEvents.filter(event =>
    event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.league.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    refreshMutation.mutate("sports", {
      onSuccess: () => {
        toast({
          title: "Data Refreshed",
          description: "Sports events data has been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh sports data. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const sports = ["all", "football", "basketball", "baseball", "soccer", "hockey"];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Trophy className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Sports Data</h2>
          <p className="text-muted-foreground mb-4">
            Unable to fetch sports events data. Please check your connection and try again.
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
          <h1 className="text-2xl font-bold">Sports Events Discovery</h1>
          <p className="text-muted-foreground">
            Explore upcoming sports events and create predictions
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
                placeholder="Search events, teams, or leagues..."
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
            <span className="text-sm text-muted-foreground">Sport:</span>
            <div className="flex gap-2 flex-wrap">
              {sports.map((sport) => (
                <Button
                  key={sport}
                  variant={selectedSport === sport ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSport(sport)}
                  data-testid={`button-sport-${sport}`}
                >
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredEvents.length} sports events
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow" data-testid={`card-event-${event.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1">
                        {event.league}
                      </Badge>
                      <div className="text-xs text-muted-foreground capitalize">
                        {event.sport} • {event.season}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium text-center" data-testid={`text-matchup-${event.id}`}>
                      {event.homeTeam} vs {event.awayTeam}
                    </h3>
                    
                    {event.homeScore !== undefined && event.awayScore !== undefined && (
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {event.homeScore} - {event.awayScore}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </div>
                    
                    <div className="text-center">
                      <Badge 
                        variant={event.status === 'scheduled' ? 'outline' : event.status === 'live' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {event.status}
                      </Badge>
                    </div>
                    
                    {event.venue && (
                      <div className="text-xs text-muted-foreground text-center">
                        @ {event.venue}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Link href={`/discovery/sports/${event.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-details-${event.id}`}>
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/create-prediction?asset=${event.id}&category=sports`}>
                      <Button size="sm" data-testid={`button-predict-${event.id}`}>
                        <Trophy className="h-3 w-3 mr-1" />
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

      {filteredEvents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No sports events found</h3>
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