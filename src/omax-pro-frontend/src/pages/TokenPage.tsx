import { useParams } from "wouter";
import { useLanguage } from "../contexts/LanguageContext";
import { useOdinToken, getOdinImageUrl } from "../hooks/useOdinAPI";
import { PriceChart } from "../components/trading/PriceChart";
import { TradingInterface } from "../components/trading/TradingInterface";
import { TokenTrades } from "../components/trading/TokenTrades";
import { TokenPowerHolders } from "../components/trading/TokenPowerHolders";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ExternalLink, Heart, Share2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// API Base URL for images
const ODIN_API_BASE = "https://api.odin.fun/v1";

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function getPriceChangePercent(current: number, previous: number): string {
  if (previous === 0) return "+0.00%";
  const percentage = ((current - previous) / previous) * 100;
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return "Just now";
}

export default function TokenPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { token, isLoading, error } = useOdinToken(id || "");

  if (isLoading) {
    return (
      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        data-testid="page-token"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-muted-foreground">Loading token data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !token) {
    return (
      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        data-testid="page-token"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Token Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              The token you're looking for doesn't exist or couldn't be loaded.
            </p>
            <Link to="/trending">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Trending
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Calculate 24h change percentage
  const change24hPercent = getPriceChangePercent(token.price, token.price_1d);

  return (
    <main
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      data-testid="page-token"
    >
      {/* Back Button */}
      <div className="mb-4">
        <Link to="/trending">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trending
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chart Section */}
        <div className="xl:col-span-3">
          {/* Token Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={getOdinImageUrl('token', token.id)}
                    alt={token.name}
                    className="w-10 h-10 rounded-full bg-gray-100"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/40x40/f3f4f6/9ca3af?text=" +
                        token.ticker.charAt(0);
                    }}
                    data-testid={`img-token-avatar-${token.id}`}
                  />
                  <div>
                    <h1
                      className="text-2xl font-bold text-foreground"
                      data-testid="text-token-name"
                    >
                      {token.name}/{token.ticker}
                    </h1>
                    <p
                      className="text-muted-foreground"
                      data-testid="text-token-description"
                    >
                      on Odin.Fun Network - Token ID: {token.id}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-share-token"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Price Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("common.price")}
                  </div>
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="text-token-price"
                  >
                    {formatPrice(token.price)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("common.marketCap")}
                  </div>
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="text-token-market-cap"
                  >
                    {formatNumber(token.marketcap)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    24h Change
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      change24hPercent.startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-token-change-24h"
                  >
                    {change24hPercent}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("common.volume")}
                  </div>
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="text-token-volume"
                  >
                    {formatNumber(token.volume_24)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Container */}
          <PriceChart tokenSymbol={token.ticker} />

          {/* Token Activity Tabs */}
          <div className="mt-6">
            <Tabs defaultValue="trades" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trades">Recent Trades</TabsTrigger>
                <TabsTrigger value="holders">Power Holders</TabsTrigger>
              </TabsList>
              <TabsContent value="trades" className="mt-6">
                <TokenTrades tokenId={token.id} />
              </TabsContent>
              <TabsContent value="holders" className="mt-6">
                <TokenPowerHolders tokenId={token.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="space-y-6">
          {/* Token Quick Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Token Details</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-favorite-token"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-share-token-detail"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-external-link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <span
                    className="text-xs font-medium text-foreground"
                    data-testid="text-token-age"
                  >
                    {getTimeAgo(token.created_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Token ID
                  </span>
                  <span
                    className="text-xs font-medium text-foreground"
                    data-testid="text-token-id"
                  >
                    {token.id}
                  </span>
                </div>
                <div
                  className="text-xs text-muted-foreground"
                  data-testid="text-contract-address"
                >
                  Token ({token.id.slice(0, 4)}...{token.id.slice(-4)})
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t("common.marketCap")}
                  </span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-detailed-market-cap"
                  >
                    {formatNumber(token.marketcap)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Holders</span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-token-holders"
                  >
                    {token.holder_count.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Price Change Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">5M</div>
                  <div
                    className={`text-sm font-medium ${
                      getPriceChangePercent(
                        token.price,
                        token.price_5m,
                      ).startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-change-5m"
                  >
                    {getPriceChangePercent(token.price, token.price_5m)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">1H</div>
                  <div
                    className={`text-sm font-medium ${
                      getPriceChangePercent(
                        token.price,
                        token.price_1h,
                      ).startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-change-1h"
                  >
                    {getPriceChangePercent(token.price, token.price_1h)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">6H</div>
                  <div
                    className={`text-sm font-medium ${
                      getPriceChangePercent(
                        token.price,
                        token.price_6h,
                      ).startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-change-6h"
                  >
                    {getPriceChangePercent(token.price, token.price_6h)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">24H</div>
                  <div
                    className={`text-sm font-medium ${
                      change24hPercent.startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-change-24h"
                  >
                    {change24hPercent}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Interface */}
          <TradingInterface tokenSymbol={token.ticker} />

          {/* Additional Token Stats */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-foreground">Token Statistics</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Price
                  </span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-price-detailed"
                  >
                    {formatPrice(token.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Market Cap
                  </span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-market-cap-detailed"
                  >
                    {formatNumber(token.marketcap)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    24h Volume
                  </span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-volume-detailed"
                  >
                    {formatNumber(token.volume_24)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Holder Count
                  </span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-holders-detailed"
                  >
                    {token.holder_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-created-detailed"
                  >
                    {getTimeAgo(token.created_time)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price History Card */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-foreground">Price History</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    5 minutes ago
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatPrice(token.price_5m)}
                    </div>
                    <div
                      className={`text-xs ${
                        getPriceChangePercent(
                          token.price,
                          token.price_5m,
                        ).startsWith("+")
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {getPriceChangePercent(token.price, token.price_5m)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    1 hour ago
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatPrice(token.price_1h)}
                    </div>
                    <div
                      className={`text-xs ${
                        getPriceChangePercent(
                          token.price,
                          token.price_1h,
                        ).startsWith("+")
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {getPriceChangePercent(token.price, token.price_1h)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    6 hours ago
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatPrice(token.price_6h)}
                    </div>
                    <div
                      className={`text-xs ${
                        getPriceChangePercent(
                          token.price,
                          token.price_6h,
                        ).startsWith("+")
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {getPriceChangePercent(token.price, token.price_6h)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    24 hours ago
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatPrice(token.price_1d)}
                    </div>
                    <div
                      className={`text-xs ${
                        change24hPercent.startsWith("+")
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {change24hPercent}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
