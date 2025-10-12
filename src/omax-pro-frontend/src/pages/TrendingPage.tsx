import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FilterModal } from "../components/modals/FilterModal";
import { SettingsModal } from "../components/modals/SettingsModal";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { Search, Filter, Settings, TrendingUp } from "lucide-react";

// Import enhanced Odin API types and hook with price conversions
import { 
  useEnhancedOdinAPI, 
  useBTCPrice,
  type EnhancedOdinTokenData, 
  getOdinImageUrl 
} from "../hooks/useOdinAPI";

// Utility functions updated for enhanced data
function formatPriceChange(current: number, previous: number): string {
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

export default function TrendingPage() {
  const { t } = useLanguage();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState("1M");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [activeFilters, setActiveFilters] = useState({
    minMarketCap: '',
    maxMarketCap: '',
    minVolume: '',
    maxVolume: '',
    tokenAge: 'all',
    hideBundled: false,
    onlyVerified: false,
  });

  // Use Enhanced Odin API hook with proper price conversions
  const { 
    tokens: enhancedTokens, 
    totalCount, 
    isLoading, 
    error, 
    btcPriceUSD 
  } = useEnhancedOdinAPI({
    page: currentPage,
    limit: pageSize,
    sort: "marketcap:desc",
    bonded: true // Show graduated tokens by default
  });

  // Helper function to check token age
  const getTokenAgeInHours = (createdTime: string): number => {
    const now = new Date();
    const created = new Date(createdTime);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  };

  // Helper function to check if token matches age filter
  const matchesAgeFilter = (token: EnhancedOdinTokenData, ageFilter: string): boolean => {
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

  // Apply client-side filters (some filters like search need to be client-side)
  const filteredTokens = enhancedTokens.filter((token) => {
    // Search filter (client-side for real-time filtering)
    const matchesSearch = 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.ticker.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Age filter (client-side)
    if (!matchesAgeFilter(token, activeFilters.tokenAge)) {
      return false;
    }

    return true;
  });

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

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

          {/* Odin Network Badge with BTC Price */}
          <div className="flex items-center space-x-2 bg-surface rounded-lg px-3 py-2">
            <TrendingUp className="text-accent text-sm" />
            <span className="text-sm font-medium text-foreground">
              Odin Network
            </span>
            <span
              className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full"
              data-testid="text-token-count"
            >
              {totalCount.toLocaleString()}
            </span>
            {btcPriceUSD && (
              <span className="text-xs text-muted-foreground">
                BTC ${btcPriceUSD.toLocaleString()}
              </span>
            )}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center space-x-2 bg-surface rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}
              className="bg-transparent text-sm text-foreground border-none outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
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

      {/* Pagination Info */}
      {!isLoading && totalCount > 0 && (
        <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
          <span>
            Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalCount.toLocaleString()} tokens
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Enhanced Trending Table */}
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
                    Price (USD)
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Price (Sats)
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
                    24HVolume
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

                    {/* Price USD - Using enhanced formatted data */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {token.priceFormatted.usd}
                        </span>
                      </Link>
                    </td>

                    {/* Price Sats - New column showing satoshi price */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm text-muted-foreground">
                          {token.priceFormatted.sats}
                        </span>
                      </Link>
                    </td>

                    {/* Market Cap - Using enhanced formatted data */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm font-medium">
                          {token.marketCapFormatted.usd}
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
                            formatPriceChange(
                              token.price,
                              token.price_5m,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {formatPriceChange(token.price, token.price_5m)}
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
                            formatPriceChange(
                              token.price,
                              token.price_1h,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {formatPriceChange(token.price, token.price_1h)}
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
                            formatPriceChange(
                              token.price,
                              token.price_6h,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {formatPriceChange(token.price, token.price_6h)}
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
                            formatPriceChange(
                              token.price,
                              token.price_1d,
                            ).startsWith("+")
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {formatPriceChange(token.price, token.price_1d)}
                        </span>
                      </Link>
                    </td>

                    {/* Volume - Using enhanced formatted data */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/token/${token.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm font-medium">
                          {token.volumeFormatted.usd}
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

      {/* Pagination Controls - Mobile Responsive */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6">
          {/* Mobile Pagination - Simplified */}
          <div className="flex sm:hidden justify-between items-center px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-1"
            >
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
            </Button>
          </div>

          {/* Desktop Pagination - Full Controls */}
          <div className="hidden sm:flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setCurrentPage(1)}
                        isActive={currentPage === 1}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}
                
                {/* Current page and neighbors */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const pageNumber = startPage + i;
                  
                  if (pageNumber > totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setCurrentPage(totalPages)}
                        isActive={currentPage === totalPages}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

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