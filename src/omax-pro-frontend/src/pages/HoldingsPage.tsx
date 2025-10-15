// pages/HoldingsPage.tsx - Token Holdings with authentication integration
import { useState } from 'react';
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-holdings">
      {/* User Info Banner */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Signed in as: {principalId?.slice(0, 8)}...{principalId?.slice(-6)}
              </p>
              <p className="text-xs text-green-600">
                ✅ Fetching holdings from Odin API
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${calculatePortfolioValue().toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold text-foreground">{filteredTokens.length}</p>
              </div>
              <Search className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
              placeholder="Search tokens..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="pl-10"
              data-testid="input-search-token"
              disabled={!shouldFetchData}
            />
          </div>

          {/* Holdings Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Token
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Value
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokensLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading your token holdings...</p>
                      </div>
                    </td>
                  </tr>
                ) : tokensError ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h4 className="text-lg font-medium text-foreground mb-2">
                          Error Loading Holdings
                        </h4>
                        <p className="text-sm text-red-600 mb-4">
                          Failed to fetch your token holdings from Odin API
                        </p>
                        <Button variant="outline" onClick={() => refetchTokens()}>
                          Try Again
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filteredTokens.length > 0 ? (
                  filteredTokens.map((holding) => {
                    const balance = holding.balance / Math.pow(10, holding.token.decimals);
                    const value = balance * holding.token.price;
                    const priceChange = getPriceChangePercentage(holding.token.price, holding.token.price_1d);
                    const priceChangeColor = getPriceChangeColor(holding.token.price, holding.token.price_1d);

                    return (
                      <tr key={holding.token.id} className="border-b border-border hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={getOdinImageUrl('token', holding.token.id)}
                              alt={holding.token.name}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-token.png';
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {holding.token.ticker || holding.token.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-32">
                                {holding.token.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                          {balance.toFixed(6)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-foreground">
                          {formatPrice(holding.token.price)}
                        </td>
                        <td className={`py-3 px-4 text-right text-sm font-medium ${priceChangeColor}`}>
                          <div className="flex items-center justify-end">
                            {priceChange > 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : priceChange < 0 ? (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            ) : null}
                            {priceChange !== 0 ? `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%` : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                          ${value.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                          {formatMarketCap(holding.token.marketcap)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Eye className="w-16 h-16 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-medium text-foreground mb-2">
                          {searchToken ? 'No Matching Tokens' : 'No Token Holdings Found'}
                        </h4>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          {searchToken 
                            ? 'No tokens found matching your search criteria.'
                            : 'You don\'t have any token holdings yet. Start trading to see your portfolio here!'
                          }
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