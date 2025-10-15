import { useParams } from "wouter";
import { useLanguage } from "../contexts/LanguageContext";
import { useOdinToken, useBTCPrice, getOdinImageUrl } from "../hooks/useOdinAPI";
import { PriceChart } from "../components/trading/PriceChart";
import { TradingInterface } from "../components/trading/TradingInterface";
import { TokenTrades } from "../components/trading/TokenTrades";
import { TokenPowerHolders } from "../components/trading/TokenPowerHolders";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ExternalLink, Heart, Share2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { SwapComponent } from "../components/trading/SwapComponent";

// Price conversion utilities (matching your enhanced API)
const SATOSHI_TO_BTC = 0.00000001;

interface PriceData {
  satoshis: number;
  btc: number;
  usd: number;
}

// Conversion functions based on your enhanced Odin API format
function satoshisToBTC(satoshis: number): number {
  return satoshis * SATOSHI_TO_BTC;
}

function satoshisToUSD(satoshis: number, btcPriceUSD: number): number {
  const btc = satoshisToBTC(satoshis);
  return btc * btcPriceUSD;
}

function parseOdinTokenPrice(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue / 1000; // Token price: API Value ÷ 1000 = sats
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

function parseOdinMarketCap(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue / 1000; // Market cap: API Value ÷ 1000 = sats
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

function parseOdinVolume(apiValue: number, btcPriceUSD: number): PriceData {
  const satoshis = apiValue; // Volume: API Value = sats (no division)
  const btc = satoshisToBTC(satoshis);
  const usd = satoshisToUSD(satoshis, btcPriceUSD);
  return { satoshis, btc, usd };
}

// Enhanced formatting functions
function formatSatoshis(satoshis: number): string {
  if (satoshis >= 1e9) return `${(satoshis / 1e9).toFixed(2)}B sats`;
  if (satoshis >= 1e6) return `${(satoshis / 1e6).toFixed(2)}M sats`;
  if (satoshis >= 1e3) return `${(satoshis / 1e3).toFixed(2)}K sats`;
  return `${satoshis.toLocaleString()} sats`;
}

function formatBTC(btc: number): string {
  if (btc >= 1) return `${btc.toFixed(4)} BTC`;
  if (btc >= 0.001) return `${btc.toFixed(6)} BTC`;
  return `${btc.toFixed(8)} BTC`;
}

function formatUSD(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(2)}K`;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(6)}`;
}

function formatPriceChangePercent(current: number, previous: number): string {
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
  const { btcPriceUSD } = useBTCPrice();

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

  // Enhanced price data with proper conversions
  const currentPrice = parseOdinTokenPrice(token.price, btcPriceUSD);
  const marketCap = parseOdinMarketCap(token.marketcap, btcPriceUSD);
  const volume24h = parseOdinVolume(token.volume_24, btcPriceUSD);
  
  // Historical prices
  const price5m = parseOdinTokenPrice(token.price_5m, btcPriceUSD);
  const price1h = parseOdinTokenPrice(token.price_1h, btcPriceUSD);
  const price6h = parseOdinTokenPrice(token.price_6h, btcPriceUSD);
  const price1d = parseOdinTokenPrice(token.price_1d, btcPriceUSD);

  // Calculate 24h change percentage
  const change24hPercent = formatPriceChangePercent(token.price, token.price_1d);

  return (
    <main
      className="mx-auto px-4 sm:px-6 lg:px-8 py-6"
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

              {/* Enhanced Price Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("common.price")} (USD)
                  </div>
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="text-token-price"
                  >
                    {formatUSD(currentPrice.usd)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatSatoshis(currentPrice.satoshis)}
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
                    {formatUSD(marketCap.usd)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatBTC(marketCap.btc)}
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
                    {t("common.volume")} (24h)
                  </div>
                  <div
                    className="text-lg font-bold text-foreground"
                    data-testid="text-token-volume"
                  >
                    {formatUSD(volume24h.usd)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatBTC(volume24h.btc)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Container */}
          <PriceChart tokenId={token.id} tokenSymbol={token.ticker} />

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
                    BTC Price
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    ${btcPriceUSD.toLocaleString()}
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

              {/* Enhanced Price Change Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">5M</div>
                  <div
                    className={`text-sm font-medium ${
                      formatPriceChangePercent(
                        token.price,
                        token.price_5m,
                      ).startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-change-5m"
                  >
                    {formatPriceChangePercent(token.price, token.price_5m)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">1H</div>
                  <div
                    className={`text-sm font-medium ${
                      formatPriceChangePercent(
                        token.price,
                        token.price_1h,
                      ).startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-change-1h"
                  >
                    {formatPriceChangePercent(token.price, token.price_1h)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">6H</div>
                  <div
                    className={`text-sm font-medium ${
                      formatPriceChangePercent(
                        token.price,
                        token.price_6h,
                      ).startsWith("+")
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    data-testid="text-change-6h"
                  >
                    {formatPriceChangePercent(token.price, token.price_6h)}
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
          

          {/* Enhanced Token Statistics */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-foreground">Token Statistics</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Price (USD)
                  </span>
                  <span
                    className="text-sm font-medium text-foreground"
                    data-testid="text-price-detailed"
                  >
                    {formatUSD(currentPrice.usd)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Price (Satoshis)
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatSatoshis(currentPrice.satoshis)}
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
                    {formatUSD(marketCap.usd)}
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
                    {formatUSD(volume24h.usd)}
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

          {/* Enhanced Price History Card */}
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
                      {formatUSD(price5m.usd)}
                    </div>
                    <div
                      className={`text-xs ${
                        formatPriceChangePercent(
                          token.price,
                          token.price_5m,
                        ).startsWith("+")
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {formatPriceChangePercent(token.price, token.price_5m)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    1 hour ago
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatUSD(price1h.usd)}
                    </div>
                    <div
                      className={`text-xs ${
                        formatPriceChangePercent(
                          token.price,
                          token.price_1h,
                        ).startsWith("+")
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {formatPriceChangePercent(token.price, token.price_1h)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    6 hours ago
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatUSD(price6h.usd)}
                    </div>
                    <div
                      className={`text-xs ${
                        formatPriceChangePercent(
                          token.price,
                          token.price_6h,
                        ).startsWith("+")
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {formatPriceChangePercent(token.price, token.price_6h)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    24 hours ago
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatUSD(price1d.usd)}
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