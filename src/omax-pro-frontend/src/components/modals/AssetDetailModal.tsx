import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  X,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Calendar,
  MapPin,
  Trophy,
  Cloud,
  BarChart3,
  Bitcoin,
  Info,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Sunset,
  Activity
} from "lucide-react";
import type { CryptoAsset, StockAsset, SportsEvent, WeatherData } from "../../shared/schema";
import { useState } from "react";
import { CreatePredictionModal } from "./CreatePredictionModal";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "crypto" | "stocks" | "sports" | "weather";
  asset: CryptoAsset | StockAsset | SportsEvent | WeatherData;
}

export function AssetDetailModal({ isOpen, onClose, category, asset }: AssetDetailModalProps) {
  const [showPredictionModal, setShowPredictionModal] = useState(false);

  const renderCryptoDetails = (crypto: CryptoAsset) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img src={crypto.image} alt={crypto.name} className="w-16 h-16 rounded-full" />
        <div>
          <h2 className="text-2xl font-bold">{crypto.name}</h2>
          <p className="text-muted-foreground">{crypto.symbol}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="supply">Supply</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="text-lg font-bold">${crypto.currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Market Cap Rank</span>
                <Badge>#{crypto.marketCapRank}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">24h Price Change</span>
                <span className={`font-semibold ${crypto.priceChangePercentage24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {crypto.priceChangePercentage24h >= 0 ? "+" : ""}
                  {crypto.priceChangePercentage24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">24h High</span>
                <span className="font-medium">${crypto.high24h?.toLocaleString() || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">24h Low</span>
                <span className="font-medium">${crypto.low24h?.toLocaleString() || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Market Cap</span>
                <span className="font-medium">${(crypto.marketCap / 1e9).toFixed(2)}B</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">24h Volume</span>
                <span className="font-medium">${(crypto.totalVolume / 1e9).toFixed(2)}B</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fully Diluted Valuation</span>
                <span className="font-medium">
                  {crypto.fullyDilutedValuation ? `$${(crypto.fullyDilutedValuation / 1e9).toFixed(2)}B` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">All Time High</span>
                <div className="text-right">
                  <div className="font-medium">${crypto.ath?.toLocaleString() || "N/A"}</div>
                  <div className="text-xs text-red-500">
                    {crypto.athChangePercentage ? `${crypto.athChangePercentage.toFixed(2)}%` : ""}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">All Time Low</span>
                <div className="text-right">
                  <div className="font-medium">${crypto.atl?.toLocaleString() || "N/A"}</div>
                  <div className="text-xs text-green-500">
                    {crypto.atlChangePercentage ? `${crypto.atlChangePercentage.toFixed(2)}%` : ""}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supply" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Circulating Supply</span>
                <span className="font-medium">
                  {crypto.circulatingSupply ? `${(crypto.circulatingSupply / 1e6).toFixed(2)}M` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Supply</span>
                <span className="font-medium">
                  {crypto.totalSupply ? `${(crypto.totalSupply / 1e6).toFixed(2)}M` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max Supply</span>
                <span className="font-medium">
                  {crypto.maxSupply ? `${(crypto.maxSupply / 1e6).toFixed(2)}M` : "Unlimited"}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderStockDetails = (stock: StockAsset) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{stock.name}</h2>
          <p className="text-muted-foreground">{stock.symbol} • {stock.exchange}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="text-xl font-bold">${stock.currentPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Change</span>
            <div className="text-right">
              <div className={`font-semibold ${stock.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                {stock.changePercent >= 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">
                ${stock.change.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Volume</span>
            <span className="font-medium">{stock.volume.toLocaleString()}</span>
          </div>
          {stock.avgVolume && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Volume</span>
              <span className="font-medium">{stock.avgVolume.toLocaleString()}</span>
            </div>
          )}
          {stock.marketCap && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Market Cap</span>
              <span className="font-medium">${(stock.marketCap / 1e9).toFixed(2)}B</span>
            </div>
          )}
          {stock.peRatio && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">P/E Ratio</span>
              <span className="font-medium">{stock.peRatio.toFixed(2)}</span>
            </div>
          )}
          {stock.weekHigh52 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">52 Week High</span>
              <span className="font-medium">${stock.weekHigh52.toLocaleString()}</span>
            </div>
          )}
          {stock.weekLow52 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">52 Week Low</span>
              <span className="font-medium">${stock.weekLow52.toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSportsDetails = (event: SportsEvent) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Trophy className="w-16 h-16 text-orange-500" />
        <div>
          <h2 className="text-2xl font-bold">{event.eventName}</h2>
          <p className="text-muted-foreground">{event.league} • {event.sport}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            {event.homeTeamLogo && (
              <img src={event.homeTeamLogo} alt={event.homeTeam} className="w-16 h-16 mx-auto mb-2" />
            )}
            <h3 className="font-bold text-lg">{event.homeTeam}</h3>
            <p className="text-xs text-muted-foreground mb-2">Home</p>
            {event.homeScore !== undefined && event.homeScore !== null && (
              <div className="text-3xl font-bold">{event.homeScore}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            {event.awayTeamLogo && (
              <img src={event.awayTeamLogo} alt={event.awayTeam} className="w-16 h-16 mx-auto mb-2" />
            )}
            <h3 className="font-bold text-lg">{event.awayTeam}</h3>
            <p className="text-xs text-muted-foreground mb-2">Away</p>
            {event.awayScore !== undefined && event.awayScore !== null && (
              <div className="text-3xl font-bold">{event.awayScore}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Event Date</span>
            <span className="ml-auto font-medium">{new Date(event.eventDate).toLocaleString()}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Venue</span>
              <span className="ml-auto font-medium">{event.venue}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className="ml-auto capitalize">{event.status}</Badge>
          </div>
          {event.odds && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Odds</h4>
              <div className="space-y-2 text-sm">
                {event.odds.homeWin && (
                  <div className="flex justify-between">
                    <span>{event.homeTeam} Win</span>
                    <span className="font-medium">{event.odds.homeWin}</span>
                  </div>
                )}
                {event.odds.draw && (
                  <div className="flex justify-between">
                    <span>Draw</span>
                    <span className="font-medium">{event.odds.draw}</span>
                  </div>
                )}
                {event.odds.awayWin && (
                  <div className="flex justify-between">
                    <span>{event.awayTeam} Win</span>
                    <span className="font-medium">{event.odds.awayWin}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderWeatherDetails = (weather: WeatherData) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Cloud className="w-16 h-16 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold">{weather.location}</h2>
          <p className="text-muted-foreground">{weather.country}</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-6xl font-bold mb-2">{Math.round(weather.temperature)}°C</div>
        <p className="text-lg text-muted-foreground capitalize">{weather.description}</p>
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-24 h-24 mx-auto"
        />
      </div>

      <Tabs defaultValue="current">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Feels Like</span>
                <span className="font-medium">{Math.round(weather.feelsLike)}°C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">High / Low</span>
                <span className="font-medium">
                  {Math.round(weather.tempMax)}° / {Math.round(weather.tempMin)}°
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Humidity</span>
                </div>
                <span className="font-medium">{weather.humidity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-muted-foreground">Wind Speed</span>
                </div>
                <span className="font-medium">{weather.windSpeed} m/s</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pressure</span>
                <span className="font-medium">{weather.pressure} hPa</span>
              </div>
              {weather.visibility && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-muted-foreground">Visibility</span>
                  </div>
                  <span className="font-medium">{(weather.visibility / 1000).toFixed(1)} km</span>
                </div>
              )}
              {weather.clouds !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cloudiness</span>
                  <span className="font-medium">{weather.clouds}%</span>
                </div>
              )}
              {weather.sunrise && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Sunrise</span>
                  </div>
                  <span className="font-medium">{new Date(weather.sunrise).toLocaleTimeString()}</span>
                </div>
              )}
              {weather.sunset && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Sunset</span>
                  </div>
                  <span className="font-medium">{new Date(weather.sunset).toLocaleTimeString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Coordinates</span>
                <span className="font-medium text-xs">
                  {weather.latitude.toFixed(4)}, {weather.longitude.toFixed(4)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Info className="h-5 w-5" />
                {category.charAt(0).toUpperCase() + category.slice(1)} Details
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-4">
            {category === "crypto" && renderCryptoDetails(asset as CryptoAsset)}
            {category === "stocks" && renderStockDetails(asset as StockAsset)}
            {category === "sports" && renderSportsDetails(asset as SportsEvent)}
            {category === "weather" && renderWeatherDetails(asset as WeatherData)}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-close"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowPredictionModal(true);
                onClose();
              }}
              className="flex-1"
              data-testid="button-create-prediction-from-detail"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Create Prediction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreatePredictionModal
        isOpen={showPredictionModal}
        onClose={() => setShowPredictionModal(false)}
        category={category}
        assetData={asset}
      />
    </>
  );
}
