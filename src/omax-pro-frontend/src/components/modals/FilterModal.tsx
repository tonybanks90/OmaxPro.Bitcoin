import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export function FilterModal({ isOpen, onClose, onApply }: FilterModalProps) {
  const [filters, setFilters] = useState({
    minMarketCap: '',
    maxMarketCap: '',
    minVolume: '',
    maxVolume: '',
    tokenAge: 'all',
    hideBundled: false,
    onlyVerified: false,
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      minMarketCap: '',
      maxMarketCap: '',
      minVolume: '',
      maxVolume: '',
      tokenAge: 'all',
      hideBundled: false,
      onlyVerified: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground">
              Advanced Filters
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-filter-modal">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Market Cap Filter */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">Market Cap Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                type="number" 
                placeholder="Min" 
                value={filters.minMarketCap}
                onChange={(e) => setFilters({ ...filters, minMarketCap: e.target.value })}
                data-testid="input-min-market-cap"
              />
              <Input 
                type="number" 
                placeholder="Max" 
                value={filters.maxMarketCap}
                onChange={(e) => setFilters({ ...filters, maxMarketCap: e.target.value })}
                data-testid="input-max-market-cap"
              />
            </div>
          </div>

          {/* Volume Filter */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">24h Volume Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                type="number" 
                placeholder="Min" 
                value={filters.minVolume}
                onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })}
                data-testid="input-min-volume"
              />
              <Input 
                type="number" 
                placeholder="Max" 
                value={filters.maxVolume}
                onChange={(e) => setFilters({ ...filters, maxVolume: e.target.value })}
                data-testid="input-max-volume"
              />
            </div>
          </div>

          {/* Token Age */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">Token Age</Label>
            <Select value={filters.tokenAge} onValueChange={(value) => setFilters({ ...filters, tokenAge: value })}>
              <SelectTrigger data-testid="select-token-age">
                <SelectValue placeholder="Select age range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="1h">Less than 1 hour</SelectItem>
                <SelectItem value="1-6h">1-6 hours</SelectItem>
                <SelectItem value="6-24h">6-24 hours</SelectItem>
                <SelectItem value="1d+">1+ days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Security Options */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-3">Security & Risk</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hide-bundled"
                  checked={filters.hideBundled}
                  onCheckedChange={(checked) => setFilters({ ...filters, hideBundled: !!checked })}
                  data-testid="checkbox-hide-bundled"
                />
                <Label htmlFor="hide-bundled" className="text-sm text-foreground">Hide bundled tokens</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="only-verified"
                  checked={filters.onlyVerified}
                  onCheckedChange={(checked) => setFilters({ ...filters, onlyVerified: !!checked })}
                  data-testid="checkbox-only-verified"
                />
                <Label htmlFor="only-verified" className="text-sm text-foreground">Show only verified tokens</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-8">
          <Button variant="ghost" onClick={handleReset} data-testid="button-reset-filters">
            Reset
          </Button>
          <Button onClick={handleApply} data-testid="button-apply-filters">
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
