// pages/WalletPage.tsx - Complete final version
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { SettingsModal } from '../components/modals/SettingsModal';
import { FilterModal } from '../components/modals/FilterModal';
import { Plus, Download, Upload, Search, Wallet, Activity, Eye, Trash2, Edit3, AlertCircle, LogIn, User, Settings, Filter } from 'lucide-react';
import { useOdinUserActivity, getOdinImageUrl } from '../hooks/useOdinAPI';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../auth/AuthProvider';

// Import your fixed actor hook and services
import { useWalletActor } from '../hooks/useWalletActor';
import { useUserWallets, useAddWallet, useRemoveWallet, useUpdateWalletName, useWalletCount } from '../hooks/useWalletQueries';
import type { WalletEntry } from '../services/walletService';

export default function WalletPage() {
  const { toast } = useToast();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchWallet, setSearchWallet] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [editingWallet, setEditingWallet] = useState<WalletEntry | null>(null);

  // Authentication hook
  const { 
    isReady: authReady, 
    isAuthenticated, 
    identity, 
    principalId, 
    login, 
    logout 
  } = useAuth();

  // Use the simplified wallet actor hook
  const {
    actor,
    isInitializing,
    isAuthenticated: actorAuthenticated,
    isReady: actorReady,
    error: actorError,
    authenticate,
    clearAuth
  } = useWalletActor();

  // Authenticate actor when user identity is available
  useEffect(() => {
    if (identity && !actorAuthenticated && !isInitializing) {
      console.log('Authenticating actor with identity...');
      authenticate(identity).catch((error) => {
        console.error('Failed to authenticate actor:', error);
        toast({
          title: "Authentication Failed",
          description: "Failed to authenticate with wallet canister. Please try refreshing the page.",
          variant: "destructive"
        });
      });
    }
  }, [identity, actorAuthenticated, isInitializing, authenticate, toast]);

  // Clear actor auth when user logs out
  useEffect(() => {
    if (!isAuthenticated && actorAuthenticated) {
      console.log('Clearing actor authentication...');
      clearAuth();
    }
  }, [isAuthenticated, actorAuthenticated, clearAuth]);

  // Only fetch wallets if user is authenticated and actor is ready
  const shouldFetchData = authReady && isAuthenticated && principalId && actorReady && actorAuthenticated;

  // Fetch user wallets using the query hook
  const { 
    data: wallets = [], 
    isLoading: walletsLoading, 
    error: walletsError,
    refetch: refetchWallets
  } = useUserWallets(
    principalId || '', 
    searchWallet.trim() || undefined,
    { enabled: shouldFetchData }
  );

  // Fetch wallet count
  const { data: walletCount = 0 } = useWalletCount(
    principalId || '',
    { enabled: shouldFetchData }
  );

  // Fetch activity for selected wallet (external API)
  const { 
    activities, 
    isLoading: activityLoading, 
    error: activityError 
  } = useOdinUserActivity(selectedWallet || '', 1, 50);

  // Mutation hooks
  const addWalletMutation = useAddWallet();
  const removeWalletMutation = useRemoveWallet();
  const updateWalletMutation = useUpdateWalletName();

  // Event handlers
  const handleAddWallet = () => {
    if (!principalId) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to add wallets",
        variant: "destructive"
      });
      return;
    }

    if (!newWalletAddress.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        variant: "destructive"
      });
      return;
    }

    addWalletMutation.mutate({
      userPrincipal: principalId,
      address: newWalletAddress.trim(),
      name: newWalletName.trim() || `Wallet ${wallets.length + 1}`
    }, {
      onSuccess: () => {
        setShowAddWalletModal(false);
        setNewWalletAddress('');
        setNewWalletName('');
        toast({
          title: "Wallet Added",
          description: "Wallet has been successfully added to your tracking list",
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to Add Wallet",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const handleRemoveWallet = (address: string) => {
    if (!principalId) return;

    if (confirm('Are you sure you want to remove this wallet?')) {
      removeWalletMutation.mutate({
        userPrincipal: principalId,
        address
      }, {
        onSuccess: () => {
          if (selectedWallet === address) {
            setSelectedWallet(null);
          }
          toast({
            title: "Wallet Removed",
            description: "Wallet has been successfully removed from tracking",
          });
        },
        onError: (error) => {
          toast({
            title: "Failed to Remove Wallet",
            description: error.message,
            variant: "destructive"
          });
        }
      });
    }
  };

  const handleUpdateWalletName = (address: string, newName: string) => {
    if (!principalId || !newName.trim()) return;

    updateWalletMutation.mutate({
      userPrincipal: principalId,
      address,
      newName: newName.trim()
    }, {
      onSuccess: () => {
        setEditingWallet(null);
        toast({
          title: "Wallet Updated",
          description: "Wallet name has been successfully updated",
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to Update Wallet",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  // Utility functions
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount: number, decimals: number = 8) => {
    return (amount / Math.pow(10, decimals)).toFixed(6);
  };

  // Show authentication required screen
  if (authReady && !isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-wallet">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Wallet Tracker
                </h2>
                <p className="text-muted-foreground">
                  Sign in with Internet Identity to track your wallet addresses and view trading activity.
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
                  <strong>Secure & Private:</strong> Your wallet addresses are stored securely on the Internet Computer blockchain and only you can access them.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Show loading while auth or actor is initializing
  if (!authReady || isInitializing) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {!authReady ? 'Loading authentication...' : 'Connecting to wallet canister...'}
            </p>
            {actorError && (
              <p className="text-sm text-red-600 mt-2">
                Error: {actorError}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Handle actor connection errors
  if (!actorReady && !isInitializing) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to connect to wallet canister. {actorError && `Error: ${actorError}`}
          </AlertDescription>
        </Alert>
        <div className="mt-4 space-x-2">
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          {identity && (
            <Button 
              variant="outline" 
              onClick={() => authenticate(identity)}
            >
              Retry Connection
            </Button>
          )}
        </div>
      </main>
    );
  }

  // Main component render
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-wallet">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet Tracker</h1>
            <p className="text-gray-600 mt-1">Track your wallet addresses and monitor trading activity</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilterModal(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

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
                ✅ Connected to wallet canister • Status: {actorAuthenticated ? 'Authenticated' : 'Not Authenticated'}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Wallet Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">
                  Tracked Wallets ({walletCount})
                </h3>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-download-wallets">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-upload-wallets">
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => refetchWallets()}
                    disabled={walletsLoading}
                    title="Refresh wallets"
                  >
                    <div className={walletsLoading ? "animate-spin" : ""}>
                      <Activity className="w-4 h-4" />
                    </div>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full mb-4" 
                onClick={() => setShowAddWalletModal(true)}
                data-testid="button-add-wallet"
                disabled={addWalletMutation.isPending || !shouldFetchData}
              >
                <Plus className="w-4 h-4 mr-2" />
                {addWalletMutation.isPending ? 'Adding...' : 'Add Wallet'}
              </Button>

              {/* Search Wallet */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search wallet"
                  value={searchWallet}
                  onChange={(e) => setSearchWallet(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-wallet"
                  disabled={!shouldFetchData}
                />
              </div>

              {/* Wallets List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {walletsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading wallets...</p>
                  </div>
                ) : walletsError ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">Failed to load wallets</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchWallets()}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                ) : wallets.length > 0 ? (
                  wallets.map((wallet) => (
                    <div
                      key={wallet.address}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedWallet === wallet.address
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-background border-border hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedWallet(wallet.address)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          {editingWallet?.address === wallet.address ? (
                            <Input
                              value={editingWallet.name}
                              onChange={(e) => setEditingWallet({...editingWallet, name: e.target.value})}
                              onBlur={() => {
                                handleUpdateWalletName(wallet.address, editingWallet.name);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateWalletName(wallet.address, editingWallet.name);
                                } else if (e.key === 'Escape') {
                                  setEditingWallet(null);
                                }
                              }}
                              className="text-sm font-medium"
                              autoFocus
                            />
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground truncate">
                                {wallet.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWallet(wallet);
                            }}
                            disabled={updateWalletMutation.isPending}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveWallet(wallet.address);
                            }}
                            disabled={removeWalletMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {searchWallet ? 'No wallets found matching your search' : 'You haven\'t added any wallets yet!'}
                    </p>
                    {!searchWallet && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAddWalletModal(true)}
                        className="mt-2"
                        disabled={!shouldFetchData}
                      >
                        Add your first wallet
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Wallet Content - Activity section */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground" data-testid="text-wallet-title">
                  {selectedWallet ? 
                    `Activity for ${wallets.find(w => w.address === selectedWallet)?.name || 'Wallet'}` :
                    'Wallet Activity Tracker'
                  }
                </h2>
                <p className="text-muted-foreground text-sm">
                  {selectedWallet ? 
                    'Real-time activity from Odin API' :
                    'Select a wallet to view activity'
                  }
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Token
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount (Token)
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount (BTC)
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedWallet ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Eye className="w-16 h-16 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-medium text-foreground mb-2">
                              Select a Wallet
                            </h4>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              Choose a wallet from the sidebar to view its trading activity and transaction history from the Odin API.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : activityLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                            <p className="text-sm text-muted-foreground">Loading activity from Odin API...</p>
                          </div>
                        </td>
                      </tr>
                    ) : activityError ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                            <h4 className="text-lg font-medium text-foreground mb-2">
                              Failed to Load Activity
                            </h4>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              Unable to fetch activity data from Odin API. Please try again later.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : activities && activities.length > 0 ? (
                      activities.map((activity) => (
                        <tr key={activity.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={getOdinImageUrl('token', activity.token)}
                                alt={activity.token_name}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-token.png';
                                }}
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {activity.token_ticker || activity.token_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  MC: ${(activity.token_marketcap / 1000000).toFixed(2)}M
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              activity.buy 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {activity.buy ? 'BUY' : 'SELL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                            {formatAmount(activity.amount_token, activity.decimals)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                            {activity.amount_btc.toFixed(8)} BTC
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-foreground">
                            ${activity.price.toExponential(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                            {formatTime(activity.time)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-medium text-foreground mb-2">
                              No Activity Found
                            </h4>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              This wallet doesn't have any recent trading activity in the Odin API.
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
        </div>
      </div>

      {/* Add Wallet Modal */}
      {showAddWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Add Wallet</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowAddWalletModal(false);
                    setNewWalletAddress('');
                    setNewWalletName('');
                  }}
                  data-testid="button-close-add-wallet"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input 
                  placeholder="Wallet address or principal" 
                  className="w-full"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  data-testid="input-wallet-address"
                  disabled={addWalletMutation.isPending}
                />
                <Input 
                  placeholder="Wallet name (optional)" 
                  className="w-full"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  data-testid="input-wallet-name"
                  disabled={addWalletMutation.isPending}
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowAddWalletModal(false);
                      setNewWalletAddress('');
                      setNewWalletName('');
                    }}
                    data-testid="button-cancel-add-wallet"
                    disabled={addWalletMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleAddWallet}
                    disabled={!newWalletAddress.trim() || addWalletMutation.isPending}
                    data-testid="button-confirm-add-wallet"
                  >
                    {addWalletMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Wallet'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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