// pages/HoldingsPage.tsx - Token Holdings with authentication integration
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { SettingsModal } from '../components/modals/SettingsModal';
import { FilterModal } from '../components/modals/FilterModal';
import { Search, Wallet, TrendingUp, TrendingDown, DollarSign, Eye, AlertCircle, LogIn, User, RefreshCw } from 'lucide-react';
import { useOdinUserTokens, getOdinImageUrl } from '../hooks/useOdinAPI';
import { useAuth } from '../auth/AuthProvider';

export default function HoldingsPage() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchToken, setSearchToken] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Authentication hook
  const {
    isReady: authReady,
    isAuthenticated,
    principalId,
    login,
    logout
  } = useAuth();

  // Only fetch data if user is authenticated
  const shouldFetchData = Boolean(authReady && isAuthenticated && principalId);

  // Fetch user token holdings using the query hook
  // DEBUG CONSTANTS
  const {
    userTokens,
    totalCount,
    isLoading: tokensLoading,
    error: tokensError,
    refetch: refetchTokens
  } = useOdinUserTokens(
    principalId || '',
    1,
    100,
    { enabled: shouldFetchData }
  );

  // Debug logs
  useEffect(() => {
    console.log('HoldingsPage: Auth State:', {
      authReady,
      isAuthenticated,
      principalId,
      shouldFetchData
    });
  }, [authReady, isAuthenticated, principalId, shouldFetchData]);

  useEffect(() => {
    if (shouldFetchData) {
      console.log('HoldingsPage: Tokens Fetch State:', {
        loading: tokensLoading,
        error: tokensError,
        count: userTokens?.length,
        tokens: userTokens
      });
      if (tokensError) {
        console.error('HoldingsPage: Fetch Error:', tokensError);
      }
    }
  }, [shouldFetchData, tokensLoading, tokensError, userTokens]);

  // Filter tokens based on search
  const filteredTokens = tokensLoading ? [] : userTokens.filter(holding => {
    if (!searchToken.trim()) return true;
    const search = searchToken.toLowerCase();
    return (
      holding.token.name.toLowerCase().includes(search) ||
      holding.token.ticker?.toLowerCase().includes(search) ||
      holding.token.id.toLowerCase().includes(search)
    );
  });

  const formatAmount = (amount: number, decimals: number = 8) => {
    return (amount / Math.pow(10, decimals)).toFixed(6);
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) {
      return `$${price.toExponential(2)}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatMarketCap = (marketcap: number) => {
    if (marketcap >= 1000000) {
      return `$${(marketcap / 1000000).toFixed(2)}M`;
    } else if (marketcap >= 1000) {
      return `$${(marketcap / 1000).toFixed(2)}K`;
    }
    return `$${marketcap.toFixed(2)}`;
  };

  const calculatePortfolioValue = () => {
    return filteredTokens.reduce((total, holding) => {
      const tokenValue = (holding.balance / Math.pow(10, holding.token.decimals)) * holding.token.price;
      return total + tokenValue;
    }, 0);
  };

  const getPriceChangeColor = (price: number, price24h: number) => {
    if (price > price24h) return 'text-green-600';
    if (price < price24h) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangePercentage = (price: number, price24h: number) => {
    if (!price24h || price24h === 0) return 0;
    return ((price - price24h) / price24h) * 100;
  };

  // Show authentication required screen
  if (authReady && !isAuthenticated) {
    return (
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-holdings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Token Holdings
                </h2>
                <p className="text-muted-foreground">
                  Sign in with Internet Identity to view your token holdings and portfolio balance.
                </p>
              </div>

              <Button
                onClick={login}
                className="w-full"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign in with Internet Identity
              </Button>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Real-time Data:</strong> Your token holdings are fetched directly from the Odin API using your authenticated principal ID.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Show loading while auth is initializing
  if (!authReady) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground animate-pulse">Authenticating...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="page-holdings">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Portfolio Holdings</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {principalId ? `${principalId.slice(0, 8)}...${principalId.slice(-6)}` : 'Guest'}
                </span>
                <span>•</span>
                <span className="text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Live Data
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg border-border bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  ${calculatePortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalCount}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Wallet className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Assets</p>
                <p className="text-3xl font-bold text-foreground mt-1">{filteredTokens.length}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Search className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-border">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Token Holdings</h2>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTokens()}
                disabled={tokensLoading}
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${tokensLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tokens by name or ticker..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="pl-10 bg-background border-input"
              data-testid="input-search-token"
              disabled={!shouldFetchData}
            />
          </div>

          {/* Holdings Table */}
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Token
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Value
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tokensLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center animate-pulse">
                        <div className="w-12 h-12 bg-muted rounded-full mb-4"></div>
                        <div className="h-4 w-48 bg-muted rounded mb-2"></div>
                      </div>
                    </td>
                  </tr>
                ) : tokensError ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-destructive/10 rounded-full mb-4">
                          <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <h4 className="text-lg font-medium text-foreground mb-2">
                          Unable to Fetch Holdings
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          There was an error connecting to the Odin API.
                        </p>
                        <Button variant="outline" onClick={() => refetchTokens()}>
                          Retry Connection
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filteredTokens.length > 0 ? (
                  filteredTokens.map((holding) => {
                    // Safety check for token data
                    if (!holding.token) return null;

                    const decimals = holding.token.decimals || 8;
                    const balance = holding.balance / Math.pow(10, decimals);
                    const value = balance * (holding.token.price || 0);
                    const priceChange = getPriceChangePercentage(holding.token.price || 0, holding.token.price_1d || 0);
                    const priceChangeColor = getPriceChangeColor(holding.token.price || 0, holding.token.price_1d || 0);

                    return (
                      <tr key={holding.token.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={getOdinImageUrl('token', holding.token.id)}
                              alt={holding.token.name}
                              className="w-10 h-10 rounded-full bg-muted object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-token.png';
                              }}
                            />
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {holding.token.ticker || holding.token.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-32">
                                {holding.token.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-foreground">
                          {balance.toFixed(6)}
                        </td>
                        <td className="py-4 px-4 text-right text-muted-foreground">
                          {formatPrice(holding.token.price || 0)}
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${priceChangeColor}`}>
                          <div className="flex items-center justify-end">
                            {priceChange > 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : priceChange < 0 ? (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            ) : null}
                            {priceChange !== 0 ? `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%` : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-foreground">
                          ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-muted-foreground">
                          {formatMarketCap(holding.token.marketcap || 0)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                          <Eye className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-medium text-foreground mb-2">
                          {searchToken ? 'No matching tokens found' : 'No holdings found'}
                        </h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          {searchToken
                            ? 'Try adjusting your search terms.'
                            : 'You don\'t have any token holdings yet. Start trading to see your portfolio grow!'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          console.log('Applied filters:', filters);
        }}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </main>
  );
}