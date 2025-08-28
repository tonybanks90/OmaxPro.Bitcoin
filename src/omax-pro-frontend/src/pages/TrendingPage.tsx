import { useState } from 'react';
import { useOdinAPI } from '../hooks/useOdinAPI';
import { useAstroApeAPI } from '../hooks/useAstroApeAPI';
import { useTycheAPI } from '../hooks/useTycheAPI';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FilterModal } from '../components/modals/FilterModal';
import { Search, Filter, Settings, TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  const { t } = useLanguage();
  const [activeTimeframe, setActiveTimeframe] = useState('1M');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { tokens: odinTokens, isLoading: odinLoading } = useOdinAPI();
  const { tokens: astroapeTokens, isLoading: astroapeLoading } = useAstroApeAPI();
  const { tokens: tycheTokens, isLoading: tycheLoading } = useTycheAPI();
  
  const isLoading = odinLoading || astroapeLoading || tycheLoading;
  const allTokens = [...odinTokens, ...astroapeTokens, ...tycheTokens];
  
  const filteredTokens = allTokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const timeframes = ['1M', '5M', '30M', '1H'];

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
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

          {/* Exchange Filter */}
          <div className="flex items-center space-x-2 bg-surface rounded-lg px-3 py-2">
            <TrendingUp className="text-accent text-sm" />
            <span className="text-sm font-medium text-foreground">Dexes</span>
            <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full" data-testid="text-active-exchanges">
              3
            </span>
          </div>

          {/* Additional Filters */}
          <Button
  variant="outline"
  onClick={() => setShowFilterModal(true)}
  className="flex items-center space-x-2"
  data-testid="button-open-filters"
>
  <Filter className="w-4 h-4" />
  
  {/* Hide text & badge on small screens */}
  <span className="hidden sm:inline">Filters</span>
  <span
    className="hidden sm:inline bg-success text-white text-xs px-2 py-1 rounded-full"
    data-testid="text-active-filters"
  >
    0
  </span>
</Button>

        </div>

        {/* Search and Options */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-tokens"
            />
          </div>
          <Button variant="outline" size="icon" data-testid="button-settings">
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
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Token
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Age
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
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`row-token-${token.id}`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img
                          src={token.avatar || "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=40&h=40&fit=crop"}
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
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-muted-foreground" data-testid={`text-token-age-${token.id}`}>
                        {token.age}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-foreground" data-testid={`text-token-market-cap-${token.id}`}>
                        {token.marketCap}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-foreground" data-testid={`text-token-holders-${token.id}`}>
                        {token.holders.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          token.change5m.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}
                        data-testid={`text-token-change-5m-${token.id}`}
                      >
                        {token.change5m}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          token.change1h.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}
                        data-testid={`text-token-change-1h-${token.id}`}
                      >
                        {token.change1h}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          token.change6h.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}
                        data-testid={`text-token-change-6h-${token.id}`}
                      >
                        {token.change6h}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          token.change24h.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}
                        data-testid={`text-token-change-24h-${token.id}`}
                      >
                        {token.change24h}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-foreground" data-testid={`text-token-volume-${token.id}`}>
                        {token.volume24h}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button size="sm" data-testid={`button-trade-${token.id}`}>
                        {t('common.trade')}
                      </Button>
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
