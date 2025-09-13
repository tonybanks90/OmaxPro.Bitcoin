import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Filter, Search, X, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';

interface PredictionFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: any;
}

export function PredictionFilters({ 
  isOpen, 
  onClose, 
  onApply, 
  searchTerm, 
  onSearchChange,
  activeFilters 
}: PredictionFiltersProps) {
  const [filters, setFilters] = useState({
    minVolume: '',
    maxVolume: '',
    minParticipants: '',
    maxParticipants: '',
    timeframe: 'all',
    status: 'all',
    showFeatured: false,
    sortBy: 'volume',
    sortOrder: 'desc',
    ...activeFilters
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      minVolume: '',
      maxVolume: '',
      minParticipants: '',
      maxParticipants: '',
      timeframe: 'all',
      status: 'all',
      showFeatured: false,
      sortBy: 'volume',
      sortOrder: 'desc',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.minVolume) count++;
    if (filters.maxVolume) count++;
    if (filters.minParticipants) count++;
    if (filters.maxParticipants) count++;
    if (filters.timeframe !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.showFeatured) count++;
    if (filters.sortBy !== 'volume') count++;
    return count;
  };

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search prediction markets..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            data-testid="input-search-predictions"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => onClose()}
            className="flex items-center space-x-2"
            data-testid="button-open-prediction-filters"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="default" className="text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
            <SelectTrigger className="w-24 sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="participants">Users</SelectItem>
              <SelectItem value="endDate">Ending Soon</SelectItem>
              <SelectItem value="created">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-foreground">
                Prediction Market Filters
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Volume Filter */}
            <div>
              <Label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
                <DollarSign className="w-4 h-4" />
                <span>Volume Range (USD)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.minVolume}
                  onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })}
                />
                <Input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxVolume}
                  onChange={(e) => setFilters({ ...filters, maxVolume: e.target.value })}
                />
              </div>
            </div>

            {/* Participants Filter */}
            <div>
              <Label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
                <Users className="w-4 h-4" />
                <span>Participants Range</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.minParticipants}
                  onChange={(e) => setFilters({ ...filters, minParticipants: e.target.value })}
                />
                <Input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxParticipants}
                  onChange={(e) => setFilters({ ...filters, maxParticipants: e.target.value })}
                />
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <Label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
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
                  <SelectItem value="3m">Less than 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
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
            <div>
              <Label className="block text-sm font-medium text-foreground mb-3">Additional Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-featured"
                    checked={filters.showFeatured}
                    onCheckedChange={(checked) => setFilters({ ...filters, showFeatured: !!checked })}
                  />
                  <Label htmlFor="show-featured" className="text-sm text-foreground">
                    Show only featured markets
                  </Label>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-3">Sort Options</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="participants">Participants</SelectItem>
                    <SelectItem value="endDate">End Date</SelectItem>
                    <SelectItem value="created">Created Date</SelectItem>
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

          <div className="flex items-center justify-end space-x-3 mt-8">
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}