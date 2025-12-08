import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Filter, Search, X, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { FactoryService, CATEGORY_MAP } from '../../services/factory-service';

export interface FilterState {
  minVolume: string;
  maxVolume: string;
  minParticipants: string;
  maxParticipants: string;
  timeframe: string;
  status: string;
  category: string;
  showFeatured: boolean;
  sortBy: string;
  sortOrder: string;
}

interface PredictionFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: Partial<FilterState>;
}

const defaultFilters: FilterState = {
  minVolume: '',
  maxVolume: '',
  minParticipants: '',
  maxParticipants: '',
  timeframe: 'all',
  status: 'all',
  category: 'all',
  showFeatured: false,
  sortBy: 'volume',
  sortOrder: 'desc',
};

export function PredictionFilters({
  isOpen,
  onClose,
  onApply,
  searchTerm,
  onSearchChange,
  activeFilters
}: PredictionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...activeFilters
  });

  const [categories, setCategories] = useState<string[]>([]);

  // Fetch categories from factory
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const counts = await FactoryService.getCategoryCounts();
        const categoryNames = counts.map(c => c.category);
        setCategories(categoryNames);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Use fallback categories
        setCategories(Object.keys(CATEGORY_MAP));
      }
    };
    fetchCategories();
  }, []);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.minVolume) count++;
    if (filters.maxVolume) count++;
    if (filters.minParticipants) count++;
    if (filters.maxParticipants) count++;
    if (filters.timeframe !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.showFeatured) count++;
    if (filters.sortBy !== 'volume') count++;
    return count;
  };

  return (
    <>
      {/* Search and Filter Controls - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 sm:h-10 text-sm"
            data-testid="input-search-predictions"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onClose()}
            className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3"
            data-testid="button-open-prediction-filters"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="default" className="text-xs h-5 px-1.5">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => {
              setFilters({ ...filters, sortBy: value });
              onApply({ ...filters, sortBy: value });
            }}
          >
            <SelectTrigger className="w-20 sm:w-28 h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="participants">Users</SelectItem>
              <SelectItem value="endDate">Ending</SelectItem>
              <SelectItem value="created">New</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-surface border border-border rounded-xl p-4 sm:p-6 w-[95vw] sm:w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-foreground">
                Filter Markets
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Category Filter */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Category</span>
              </Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {CATEGORY_MAP[category]?.icon || '📊'} {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Volume Filter */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <DollarSign className="w-4 h-4" />
                <span>Volume Range (sats)</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minVolume}
                  onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })}
                  className="h-9"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxVolume}
                  onChange={(e) => setFilters({ ...filters, maxVolume: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            {/* Participants Filter */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Users className="w-4 h-4" />
                <span>Participants</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minParticipants}
                  onChange={(e) => setFilters({ ...filters, minParticipants: e.target.value })}
                  className="h-9"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxParticipants}
                  onChange={(e) => setFilters({ ...filters, maxParticipants: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span>Time to Resolution</span>
              </Label>
              <Select value={filters.timeframe} onValueChange={(value) => setFilters({ ...filters, timeframe: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timeframes</SelectItem>
                  <SelectItem value="1h">Less than 1 hour</SelectItem>
                  <SelectItem value="1d">Less than 1 day</SelectItem>
                  <SelectItem value="1w">Less than 1 week</SelectItem>
                  <SelectItem value="1m">Less than 1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Market Status</span>
              </Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
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

            {/* Additional Options */}
            <div className="flex items-center gap-2 py-2">
              <Checkbox
                id="show-featured"
                checked={filters.showFeatured}
                onCheckedChange={(checked) => setFilters({ ...filters, showFeatured: !!checked })}
              />
              <Label htmlFor="show-featured" className="text-sm text-foreground cursor-pointer">
                Show only featured markets
              </Label>
            </div>

            {/* Sort Options */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">Sort By</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="participants">Participants</SelectItem>
                    <SelectItem value="endDate">End Date</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                  </SelectContent>
                </Select>

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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleReset} className="h-9">
              Reset
            </Button>
            <Button onClick={handleApply} className="h-9">
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}