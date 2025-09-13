import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PredictionCard } from '../components/prediction/PredictionCard';
import { CategoryTabs } from '../components/prediction/CategoryTabs';
import { PredictionFilters } from '../components/prediction/PredictionFilters';
import { usePredictionMarkets, usePredictionCategories } from '../hooks/usePredictionMarketsAPI';
import { TrendingUp, Zap, Calendar, Users, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';

export default function PredictionMarketsPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  // Fetch data from API
  const { data: markets = [], isLoading: marketsLoading, error: marketsError } = usePredictionMarkets();
  const { data: categories = [], isLoading: categoriesLoading } = usePredictionCategories();

  // Filter markets based on category and search
  const filteredMarkets = markets.filter(market => {
    const matchesCategory = activeCategory === 'all' || market.category === activeCategory;
    const matchesSearch = market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const isLoading = marketsLoading || categoriesLoading;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-prediction-markets">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Prediction Markets
          </h1>
          <p className="text-muted-foreground">
            Bet on future events with real money. Create and trade on predictions about sports, politics, crypto, and more.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/create-prediction">
            <Button className="w-full sm:w-auto" data-testid="button-create-prediction">
              <Plus className="h-4 w-4 mr-2" />
              Create Prediction
            </Button>
          </Link>
        </div>
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

      {/* Categories */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="mb-6">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      )}

      {/* Filters */}
      <PredictionFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilters={filters}
      />

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredMarkets.length} prediction markets
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
        ) : filteredMarkets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Markets Found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? `No markets match your search for "${searchTerm}"`
                : 'No markets available in this category.'
              }
            </p>
          </div>
        ) : (
          filteredMarkets.map((market) => (
            <PredictionCard key={market.id} market={market} />
          ))
        )}
      </div>

      {/* Load More (for future pagination) */}
      {filteredMarkets.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing all available markets. More markets coming soon!
          </p>
        </div>
      )}
    </main>
  );
}