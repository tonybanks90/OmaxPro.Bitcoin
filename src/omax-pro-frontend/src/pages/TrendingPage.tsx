import React, { useState } from 'react';
import { Link } from 'wouter';
import { useOdinAPI } from '../hooks/useOdinAPI';
import { useAstroApeAPI } from '../hooks/useAstroApeAPI';
import { useTycheAPI } from '../hooks/useTycheAPI';
import { useKongSwapAPI } from '../hooks/useKongSwapAPI';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FilterModal } from '../components/modals/FilterModal';
import { Search, Filter, Settings, TrendingUp } from 'lucide-react';
import type { TokenData } from '../types';

export default function TrendingPage() {
  const { t } = useLanguage();
  const [activeTimeframe, setActiveTimeframe] = useState('1M');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDexes, setActiveDexes] = useState(['Odin', 'Tyche', 'KongSwap', 'AstroApe']);
  
  const { tokens: odinTokens, isLoading: odinLoading } = useOdinAPI();
  const { tokens: astroapeTokens, isLoading: astroapeLoading } = useAstroApeAPI();
  const { tokens: tycheTokens, isLoading: tycheLoading } = useTycheAPI();
  const { tokens: kongswapTokens, isLoading: kongswapLoading } = useKongSwapAPI();
  
  const isLoading = odinLoading || astroapeLoading || tycheLoading || kongswapLoading;
  
  // Filter tokens based on active DEXes
  const getTokensByDex = (): TokenData[] => {
    let tokens: TokenData[] = [];
    if (activeDexes.includes('Odin')) tokens = [...tokens, ...odinTokens];
    if (activeDexes.includes('AstroApe')) tokens = [...tokens, ...astroapeTokens];
    if (activeDexes.includes('Tyche')) tokens = [...tokens, ...tycheTokens];
    if (activeDexes.includes('KongSwap')) tokens = [...tokens, ...kongswapTokens];
    return tokens;
  };
  
  const allTokens = getTokensByDex();
  
  const filteredTokens = allTokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const timeframes = ['1M', '5M', '30M', '1H'];
  const dexes = ['Odin', 'Tyche', 'KongSwap', 'AstroApe'];
  
  const toggleDex = (dex: string) => {
    setActiveDexes(prev => 
      prev.includes(dex) 
        ? prev.filter(d => d !== dex)
        : [...prev, dex]
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-trending">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-page-title">
          {t('pages.trending.title')}
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          {t('pages.trending.subtitle')}
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        
        {/* Left Section: Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Time Filter */}
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

          {/* DEX Filter Toggles */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-2 bg-surface rounded-lg px-3 py-2">
              <TrendingUp className="text-accent text-sm" />
              <span className="text-sm font-medium text-foreground">Dexes</span>
              <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full" data-testid="text-active-exchanges">
                {activeDexes.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {dexes.map((dex) => (
                <Button
                  key={dex}
                  size="sm"
                  variant={activeDexes.includes(dex) ? "default" : "outline"}
                  onClick={() => toggleDex(dex)}
                  className="text-xs"
                  data-testid={`button-dex-${dex.toLowerCase()}`}
                >
                  {dex}
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <Button
            variant="outline"
            onClick={() => setShowFilterModal(true)}
            className="flex items-center space-x-2"
            data-testid="button-open-filters"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <span className="bg-success text-white text-xs px-2 py-1 rounded-full" data-testid="text-active-filters">
              0
            </span>
          </Button>
        </div>

        {/* Right Section: Search + Settings */}
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
          <Button variant="outline" size="icon" className="self-start sm:self-auto" data-testid="button-settings">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

       {/* Trending Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trending tokens...</p>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Tokens Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No trending tokens available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">Token</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Age</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Mkt Cap</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Holders</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">5M</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">1H</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">6H</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">24H</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token) => (
                  <tr
                    key={token.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`row-token-${token.id}`}
                  >
                    {/* Avatar + Name */}
                    <td className="py-4 px-6">
                      <Link to={`/token/${token.id}`} className="flex items-center space-x-3">
                        <img
                          src={token.avatar || "https://placehold.co/40x40"}
                          alt={token.name}
                          className="w-10 h-10 rounded-full"
                          data-testid={`img-token-avatar-${token.id}`}
                        />
                        <div>
                          <div className="font-medium text-foreground" data-testid={`text-token-name-${token.id}`}>
                            {token.name}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-token-symbol-${token.id}`}>
                            {token.symbol}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* Stats */}
                    <td className="py-4 px-4 text-right"><span className="text-sm text-muted-foreground">{token.age}</span></td>
                    <td className="py-4 px-4 text-right"><span className="text-sm font-medium">{token.marketCap}</span></td>
                    <td className="py-4 px-4 text-right"><span className="text-sm">{token.holders.toLocaleString()}</span></td>

                    {/* Changes */}
                    <td className="py-4 px-4 text-right">
                      <span className={`text-sm font-medium ${token.change5m.startsWith('+') ? 'text-success' : 'text-destructive'}`}>{token.change5m}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`text-sm font-medium ${token.change1h.startsWith('+') ? 'text-success' : 'text-destructive'}`}>{token.change1h}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`text-sm font-medium ${token.change6h.startsWith('+') ? 'text-success' : 'text-destructive'}`}>{token.change6h}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`text-sm font-medium ${token.change24h.startsWith('+') ? 'text-success' : 'text-destructive'}`}>{token.change24h}</span>
                    </td>

                    {/* Volume */}
                    <td className="py-4 px-4 text-right"><span className="text-sm font-medium">{token.volume24h}</span></td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <Button size="sm">{t('common.trade')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          console.log('Applied filters:', filters);
        }}
      />
    </main>
  );
}
