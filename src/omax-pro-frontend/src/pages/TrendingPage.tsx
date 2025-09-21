import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FilterModal } from "../components/modals/FilterModal";
import { SettingsModal } from "../components/modals/SettingsModal";
import { Search, Filter, Settings, TrendingUp } from "lucide-react";

// Odin API Types
interface OdinTokenData {
  id: string;
  name: string;
  ticker: string;
  created_time: string;
  holder_count: number;
  price: number;
  price_5m: number;
  price_1h: number;
  price_6h: number;
  price_1d: number;
  volume_24: number;
  marketcap: number;
  image: string;
}

interface OdinTokensResponse {
  data: OdinTokenData[];
  count: number;
  page: number;
  limit: number;
}

// API function
const ODIN_API_BASE = "https://api.odin.fun/v1";

async function fetchOdinTokens(): Promise<OdinTokensResponse> {
  const searchParams = new URLSearchParams({
    page: "1",
    limit: "100",
    env: "development",
    sort: "marketcap:desc",
    bonded: "true",
  });

  const response = await fetch(`${ODIN_API_BASE}/tokens?${searchParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Odin tokens: ${response.statusText}`);
  }

  return response.json();
}

// Hook for Odin tokens
function useOdinTokens() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["odin", "tokens"],
    queryFn: fetchOdinTokens,
    refetchInterval: 10000, // 30 seconds
  });

  return {
    tokens: data?.data || [],
    totalCount: data?.count || 0,
    isLoading,
    error,
    refetch,
  };
}

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

// Function to get Odin image URL
function getOdinImageUrl(type: string, id: string): string {
  return `${ODIN_API_BASE}/${type}/${id}/image`;
}

export default function TrendingPage() {
  const { t } = useLanguage();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState("1M");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    minMarketCap: '',
    maxMarketCap: '',
    minVolume: '',
    maxVolume: '',
    tokenAge: 'all',
    hideBundled: false,
    onlyVerified: false,
  });

  // Use Odin API hook
  const { tokens: odinTokens, isLoading, error } = useOdinTokens();

  // Helper function to check token age
  const getTokenAgeInHours = (createdTime: string): number => {
    const now = new Date();
    const created = new Date(createdTime);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  };

  // Helper function to check if token matches age filter
  const matchesAgeFilter = (token: OdinTokenData, ageFilter: string): boolean => {
    if (ageFilter === 'all') return true;

    const ageInHours = getTokenAgeInHours(token.created_time);

    switch (ageFilter) {
      case '1h': return ageInHours < 1;
      case '1-6h': return ageInHours >= 1 && ageInHours < 6;
      case '6-24h': return ageInHours >= 6 && ageInHours < 24;
      case '1d+': return ageInHours >= 24;
      default: return true;
    }
  };

  // Count active filters
  const countActiveFilters = (): number => {
    let count = 0;
    if (activeFilters.minMarketCap) count++;
    if (activeFilters.maxMarketCap) count++;
    if (activeFilters.minVolume) count++;
    if (activeFilters.maxVolume) count++;
    if (activeFilters.tokenAge !== 'all') count++;
    if (activeFilters.hideBundled) count++;
    if (activeFilters.onlyVerified) count++;
    return count;
  };

  // Apply all filters
  const filteredTokens = odinTokens.filter((token) => {
    // Search filter
    const matchesSearch = 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.ticker.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Market cap filters
    if (activeFilters.minMarketCap && token.marketcap < parseFloat(activeFilters.minMarketCap)) {
      return false;
    }
    if (activeFilters.maxMarketCap && token.marketcap > parseFloat(activeFilters.maxMarketCap)) {
      return false;
    }

    // Volume filters
    if (activeFilters.minVolume && token.volume_24 < parseFloat(activeFilters.minVolume)) {
      return false;
    }
    if (activeFilters.maxVolume && token.volume_24 > parseFloat(activeFilters.maxVolume)) {
      return false;
    }

    // Age filter
    if (!matchesAgeFilter(token, activeFilters.tokenAge)) {
      return false;
    }

    // Security filters (Note: Odin API doesn't have these fields yet, but preparing for future)
    // if (activeFilters.hideBundled && token.bundled) return false;
    // if (activeFilters.onlyVerified && !token.verified) return false;

    return true;
  });

  // Handle filter application
  const handleApplyFilters = (filters: any) => {
    setActiveFilters(filters);
  };

  const timeframes = ["1M", "5M", "30M", "1H"];

  return (
    <main
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      data-testid="page-trending"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-foreground mb-2"
          data-testid="text-page-title"
        >
          {t("pages.trending.title")}
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          {t("pages.trending.subtitle")} - Powered by Odin Network
        </p>
      </div>

      {/* Filters + Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        {/* Left Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Timeframe */}
          <div className="flex bg-surface rounded-lg p-1">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe}
                size="sm"
                variant={activeTimeframe === timeframe ? "default" : "ghost"}
                onClick={() => setActiveTimeframe(timeframe)}
                data-testid={`button-timeframe-${timeframe.toLowerCase()}`}
              >
                {timeframe}
              </Button>
            ))}
          </div>

          {/* Odin Network Badge */}
          <div className="flex items-center space-x-2 bg-surface rounded-lg px-3 py-2">
            <TrendingUp className="text-accent text-sm" />
            <span className="text-sm font-medium text-foreground">
              Odin Network
            </span>
            <span
              className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full"
              data-testid="text-token-count"
            >
              {filteredTokens.length}
            </span>
          </div>

          {/* Extra Filters */}
          <Button
            variant="outline"
            onClick={() => setShowFilterModal(true)}
            className="flex items-center space-x-2"
            data-testid="button-open-filters"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <span
              className="bg-success text-white text-xs px-2 py-1 rounded-full"
              data-testid="text-active-filters"
            >
              {countActiveFilters()}
            </span>
          </Button>
        </div>

        {/* Right Search + Settings */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              data-testid="input-search-tokens"
            />
          </div>
          <Button
            onClick={() => setShowSettingsModal(true)}
            variant="outline"
            size="icon"
            className="self-start sm:self-auto"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-destructive text-sm">
            Failed to load token data from Odin API. Please try again later.
          </p>
        </div>
      )}

      {/* Trending Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Odin tokens...</p>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Tokens Found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms."
                : "No tokens available from Odin API at the moment."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Token
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Age
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Mkt Cap
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Holders
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    5M
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    1H
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    6H
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    24H
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token) => (
                  <tr
                    key={token.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                    data-testid={`row-token-${token.id}`}
                  >
                    {/* Token Info - Make entire row clickable */}
                    <td className="py-4 px-6">
                      <Link
                        to={`/token/${token.id}`}
                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={getOdinImageUrl('token', token.id)}
                          alt={token.name}
                          className="w-10 h-10 rounded-full bg-gray-100"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/40x40/f3f4f6/9ca3af?text=${token.ticker?.charAt(0) || 'T'}`;
                          }}
                          data-testid={`img-token-avatar-${token.id}`}
                        />
                        <div>
                          <div
                            className="font-medium text-foreground"
                            data-testid={`text-token-name-${token.id}`}
                          >
                            {token.name}
                          </div>
                          <div
                            className="text-sm text-muted-foreground"
                            data-testid={`text-token-symbol-${token.id}`}
                          >
                            ${token.ticker}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* Age */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm text-muted-foreground">
                          {getTimeAgo(token.created_time)}
                        </span>
                      </Link>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {formatPrice(token.price)}
                        </span>
                      </Link>
                    </td>

                    {/* Market Cap */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm font-medium">
                          {formatNumber(token.marketcap)}
                        </span>
                      </Link>
                    </td>

                    {/* Holders */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm">
                          {token.holder_count.toLocaleString()}
                        </span>
                      </Link>
                    </td>

                    {/* Price Changes */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span
                          className={`text-sm font-medium ${
                            getPriceChangePercent(
                              token.price,
                              token.price_5m,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {getPriceChangePercent(token.price, token.price_5m)}
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span
                          className={`text-sm font-medium ${
                            getPriceChangePercent(
                              token.price,
                              token.price_1h,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {getPriceChangePercent(token.price, token.price_1h)}
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span
                          className={`text-sm font-medium ${
                            getPriceChangePercent(
                              token.price,
                              token.price_6h,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {getPriceChangePercent(token.price, token.price_6h)}
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span
                          className={`text-sm font-medium ${
                            getPriceChangePercent(
                              token.price,
                              token.price_1d,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {getPriceChangePercent(token.price, token.price_1d)}
                        </span>
                      </Link>
                    </td>

                    {/* Volume */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm font-medium">
                          {formatNumber(token.volume_24)}
                        </span>
                      </Link>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle trade action
                        }}
                      >
                        {t("common.trade")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </main>
  );
}