import React, { useState } from 'react';
import { PredictionCard } from '../components/prediction/PredictionCard';
import { CategoryTabs } from '../components/prediction/CategoryTabs';
import { usePredictionMarkets, usePredictionCategories } from '../hooks/usePredictionMarketsAPI';
import { TrendingUp, Zap, Calendar, Users, Plus, Search, Filter, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Link } from 'wouter';

export default function PredictionMarketsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ 
    sortBy: 'volume', 
    sortOrder: 'desc',
    marketType: 'all',
    status: 'all'
  });

  // Fetch data from API
  const { data: markets = [], isLoading: marketsLoading, error: marketsError } = usePredictionMarkets();
  const { data: categories = [], isLoading: categoriesLoading } = usePredictionCategories();

  // Filter markets based on category, search, and other filters
  const filteredAndSortedMarkets = markets
    .filter(market => {
      const matchesCategory = activeCategory === 'all' || market.category === activeCategory;
      const matchesSearch = searchTerm === '' || 
        market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMarketType = filters.marketType === 'all' || market.marketType === filters.marketType;
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'active' && market.isActive) ||
        (filters.status === 'ended' && !market.isActive);
      
      return matchesCategory && matchesSearch && matchesMarketType && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'volume':
          // Parse volume string like "$125K" to number
          aValue = parseFloat(a.totalVolumeUSD.replace(/[$K,M]/g, '')) * (a.totalVolumeUSD.includes('M') ? 1000000 : a.totalVolumeUSD.includes('K') ? 1000 : 1);
          bValue = parseFloat(b.totalVolumeUSD.replace(/[$K,M]/g, '')) * (b.totalVolumeUSD.includes('M') ? 1000000 : b.totalVolumeUSD.includes('K') ? 1000 : 1);
          break;
        case 'participants':
          aValue = a.participants;
          bValue = b.participants;
          break;
        case 'endDate':
          aValue = new Date(a.endDate).getTime();
          bValue = new Date(b.endDate).getTime();
          break;
        case 'created':
          // Use endDate as fallback since createdAt might not be available
          aValue = new Date(a.endDate).getTime();
          bValue = new Date(b.endDate).getTime();
          break;
        default:
          return 0;
      }
      
      return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

  const isLoading = marketsLoading || categoriesLoading;

  return (
    <div data-testid="page-prediction-markets">
      {/* Sticky Categories Bar */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="sticky top-16 z-40 bg-surface/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        </div>
      )}

      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Prediction Markets
        </h1>
        <p className="text-muted-foreground text-lg">
          Predict on future events with Bitcoin. Create and trade on predictions about sports, politics, crypto, and more.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Total Volume</span>
          </div>
          <div className="font-bold text-lg text-foreground">$3.25M</div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">Active Markets</span>
          </div>
          <div className="font-bold text-lg text-foreground">{markets.filter(m => m.isActive).length}</div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Participants</span>
          </div>
          <div className="font-bold text-lg text-foreground">
            {markets.reduce((sum, m) => sum + m.participants, 0).toLocaleString()}
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Resolving Today</span>
          </div>
          <div className="font-bold text-lg text-foreground">2</div>
        </div>
      </div>


      {/* Search, Filters, Volume and Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <Button
            variant="outline"
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2"
            data-testid="button-open-search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>

          {/* Filters Button */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2"
            data-testid="button-open-filters"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          {/* Volume/Sort Button */}
          <Button
            variant="outline"
            onClick={() => setShowVolume(true)}
            className="flex items-center gap-2"
            data-testid="button-open-volume"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Sort</span>
          </Button>
        </div>

        {/* Create Prediction Button */}
        <Link href="/create-prediction">
          <Button variant="outline" className="flex items-center gap-2 border-2 border-dashed border-accent/50 bg-transparent hover:bg-accent/10 hover:border-accent transition-all duration-200" data-testid="button-create-prediction">
            <Plus className="h-4 w-4" />
            Create Prediction
          </Button>
        </Link>
      </div>


      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedMarkets.length} prediction markets
          {activeCategory !== 'all' && ` in ${categories.find(c => c.id === activeCategory)?.name}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading prediction markets...</p>
          </div>
        ) : marketsError ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Markets</h3>
            <p className="text-muted-foreground text-center">
              Failed to load prediction markets. Please try again later.
            </p>
          </div>
        ) : filteredAndSortedMarkets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Markets Found</h3>
            <p className="text-muted-foreground text-center">
              No markets available in this category.
            </p>
          </div>
        ) : (
          filteredAndSortedMarkets.map((market) => (
            <PredictionCard key={market.id} market={market} />
          ))
        )}
      </div>

      {/* Load More (for future pagination) */}
      {filteredAndSortedMarkets.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing all available markets. More markets coming soon!
          </p>
        </div>
      )}
      </main>

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Search Prediction Markets
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search prediction markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-predictions"
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowSearch(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Filter Prediction Markets
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Market Type Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Market Type</label>
              <Select value={filters.marketType || 'all'} onValueChange={(value) => setFilters({ ...filters, marketType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="binary">Yes/No</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="compound">Compound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="ended">Ended Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowFilters(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Volume/Sort Dialog */}
      <Dialog open={showVolume} onOpenChange={setShowVolume}>
        <DialogContent className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Sort & Volume
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sort by</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="participants">Participants</SelectItem>
                  <SelectItem value="endDate">Ending Soon</SelectItem>
                  <SelectItem value="created">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Order</label>
              <Select value={filters.sortOrder} onValueChange={(value) => setFilters({ ...filters, sortOrder: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">High to Low</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowVolume(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}