// pages/WalletPage.tsx - Refactored to use actor directly
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { SettingsModal } from '../components/modals/SettingsModal';
import { FilterModal } from '../components/modals/FilterModal';
import { Plus, Download, Upload, Search, Wallet, Activity, Eye, Trash2, Edit3, AlertCircle, Settings, Zap } from 'lucide-react';
import { getOdinImageUrl, useInfiniteOdinUserActivity, useInfiniteAllWalletsActivity, formatTradeBTC, formatTradeTokenAmount, type OdinUserActivityData } from '../hooks/useOdinAPI';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../auth/AuthProvider';
import { useWallet } from '../auth/WalletActorProvider';

import { Principal } from '@dfinity/principal';
import { useOdinTrading } from '../hooks/useOdinTrading';

interface WalletEntry {
  address: string;
  name: string;
  addedAt: bigint;
}

export default function WalletPage() {
  const { toast } = useToast();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchWallet, setSearchWallet] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>('ALL');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [editingWallet, setEditingWallet] = useState<WalletEntry | null>(null);
  const { buyToken, sellToken, initialize: initTrading, isLoading: isTradingLoading } = useOdinTrading();
  const [walletCount, setWalletCount] = useState<number>(0);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [walletsError, setWalletsError] = useState<string | null>(null);

  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [isRemovingWallet, setIsRemovingWallet] = useState(false);
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);

  // Authentication hook
  const {
    isReady: authReady,
    isAuthenticated,
    identity,
    principalId,
    login,
    logout
  } = useAuth();

  // Use the wallet actor hook
  const {
    actor,
    isInitializing,
    isAuthenticated: actorAuthenticated,
    isReady: actorReady,
    error: actorError,
    authenticate,
    clearAuth
  } = useWallet();

  // Initialize trading when authenticated
  useEffect(() => {
    if (isAuthenticated && identity) {
      initTrading(identity);
    }
  }, [isAuthenticated, identity]);

  console.log('WalletPage: Auth State', { authReady, isAuthenticated, principalId });
  console.log('WalletPage: Actor State', { actor: !!actor, isInitializing, actorAuthenticated, actorReady, actorError });


  // Authenticate actor when user identity is available
  useEffect(() => {
    if (identity && !actorAuthenticated && !isInitializing) {
      console.log('🔐 Authenticating actor with identity...');
      authenticate(identity).catch((error: any) => {
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
      console.log('🔓 Clearing actor authentication...');
      clearAuth();
    }
  }, [isAuthenticated, actorAuthenticated, clearAuth]);

  const shouldFetchData = authReady && isAuthenticated && principalId && actorReady && actorAuthenticated;

  const fetchWallets = useCallback(async () => {
    console.log('fetchWallets: Checking conditions...', { shouldFetchData, actor: !!actor });
    if (!shouldFetchData || !actor) return;

    console.log(`fetchWallets: Fetching for principal: ${principalId}`);
    setIsLoadingWallets(true);
    setWalletsError(null);
    try {
      const principal = Principal.fromText(principalId!); // Use ! because shouldFetchData ensures principalId is not null
      let result;
      if (searchWallet.trim()) {
        console.log(`fetchWallets: Searching for term: "${searchWallet.trim()}"`);
        result = await actor.searchUserWallets(principal, searchWallet.trim());
      } else {
        console.log('fetchWallets: Getting all user wallets.');
        result = await actor.getUserWallets(principal);
      }
      const count = await actor.getUserWalletCount(principal);

      console.log('fetchWallets: Raw result from actor:', result);
      console.log('fetchWallets: Raw count from actor:', count);

      console.log('fetchWallets: Raw count from actor:', count);

      const mappedWallets = result.map(([address, name, addedAt]: [string, string, bigint]) => ({ address, name, addedAt }));
      setWallets(mappedWallets);
      setWalletCount(Number(count));

      console.log('fetchWallets: Successfully fetched and set state.', { wallets: mappedWallets, count: Number(count) });

      console.log('fetchWallets: Successfully fetched and set state.', { wallets: mappedWallets, count: Number(count) });

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setWalletsError(errorMessage);
      console.error('fetchWallets: Error fetching wallets:', error);
      toast({
        title: "Failed to Fetch Wallets",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingWallets(false);
    }
  }, [shouldFetchData, actor, principalId, searchWallet, toast]);

  useEffect(() => {
    console.log('useEffect[fetchWallets]: Triggered.');
    fetchWallets();
  }, [fetchWallets]);

  // Fetch activity for selected wallet (Infinite)
  const {
    data: singleWalletData,
    fetchNextPage: fetchNextSingle,
    hasNextPage: hasNextSingle,
    isFetchingNextPage: isFetchingNextSingle,
    isLoading: singleWalletLoading,
    error: activityError
  } = useInfiniteOdinUserActivity(selectedWallet === 'ALL' ? '' : (selectedWallet || ''), 50);

  // Fetch activity for ALL wallets (Infinite)
  const {
    data: allWalletsData,
    fetchNextPage: fetchNextAll,
    hasNextPage: hasNextAll,
    isFetchingNextPage: isFetchingNextAll,
    isLoading: allWalletsLoading,
  } = useInfiniteAllWalletsActivity(selectedWallet === 'ALL' ? wallets : [], 20);

  // Flatten data
  const singleWalletActivities = useMemo(() => singleWalletData?.pages.flatMap(p => p.data) || [], [singleWalletData]);
  const allActivities = useMemo(() => allWalletsData?.pages.flatMap(p => p.data) || [], [allWalletsData]);

  const activityLoading = selectedWallet === 'ALL' ? allWalletsLoading : singleWalletLoading;
  const activities = selectedWallet === 'ALL' ? allActivities : singleWalletActivities;
  const fetchNextPage = selectedWallet === 'ALL' ? fetchNextAll : fetchNextSingle;
  const hasNextPage = selectedWallet === 'ALL' ? hasNextAll : hasNextSingle;
  const isFetchingNextPage = selectedWallet === 'ALL' ? isFetchingNextAll : isFetchingNextSingle;

  // Filter activities based on wallet added time
  const filteredActivities = useMemo(() => {
    if (!activities || !selectedWallet) return [];
    const wallet = wallets.find(w => w.address === selectedWallet);

    console.log('🔍 Activity Debug:', {
      selectedWallet,
      rawActivitiesCount: activities.length,
      walletAddedAt: wallet?.addedAt ? new Date(Number(wallet.addedAt) / 1_000_000).toISOString() : 'N/A',
      sampleActivity: activities[0]
    });

    // If we don't know when it was added (legacy), show all
    if (!wallet || !wallet.addedAt) {
      console.log('📊 Showing ALL activities (no addedAt filter)');
      return activities;
    }

    // Convert nanoseconds to milliseconds
    const addedAtMs = Number(wallet.addedAt) / 1_000_000;

    const filtered = activities.filter(activity => {
      const activityTime = new Date(activity.time).getTime();
      return activityTime >= addedAtMs;
    });

    console.log('📊 Filtered activities:', {
      before: activities.length,
      after: filtered.length,
      addedAtMs,
      addedAtDate: new Date(addedAtMs).toISOString()
    });

    return filtered;
  }, [activities, selectedWallet, wallets]);

  // Combined display activities
  const displayActivities: OdinUserActivityData[] = selectedWallet === 'ALL' ? allActivities : filteredActivities;

  // Event handlers
  const handleAddWallet = async () => {
    console.log('handleAddWallet: Attempting to add wallet...', { newWalletAddress, newWalletName });
    if (!principalId || !actor) {
      console.warn('handleAddWallet: Aborted. Principal or actor not available.');
      toast({
        title: "Not Ready",
        description: "Please sign in and wait for the wallet canister to be ready.",
        variant: "destructive"
      });
      return;
    }

    if (!newWalletAddress.trim()) {
      console.warn('handleAddWallet: Aborted. Wallet address is empty.');
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        variant: "destructive"
      });
      return;
    }

    setIsAddingWallet(true);
    try {
      const principal = Principal.fromText(principalId);
      const address = newWalletAddress.trim();
      const name = newWalletName.trim() || `Wallet ${wallets.length + 1}`;
      console.log('handleAddWallet: Calling actor.addWalletEntry with:', { principal: principal.toText(), address, name });
      await actor.addWalletEntry(principal, address, name);

      console.log('handleAddWallet: Successfully added wallet.');
      setShowAddWalletModal(false);
      setNewWalletAddress('');
      setNewWalletName('');
      toast({
        title: "Wallet Added",
        description: "Wallet has been successfully added to your tracking list",
      });
      fetchWallets(); // Refetch wallets
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error('handleAddWallet: Error adding wallet:', error);
      toast({
        title: "Failed to Add Wallet",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAddingWallet(false);
    }
  };

  const handleRemoveWallet = async (address: string) => {
    console.log(`handleRemoveWallet: Attempting to remove wallet: ${address}`);
    if (!principalId || !actor) {
      console.warn('handleRemoveWallet: Aborted. Principal or actor not available.');
      return;
    }

    if (confirm('Are you sure you want to remove this wallet?')) {
      setIsRemovingWallet(true);
      try {
        const principal = Principal.fromText(principalId);
        console.log('handleRemoveWallet: Calling actor.removeWalletEntry with:', { principal: principal.toText(), address });
        await actor.removeWalletEntry(principal, address);

        console.log('handleRemoveWallet: Successfully removed wallet.');
        if (selectedWallet === address) {
          setSelectedWallet('ALL'); // Changed to 'ALL' instead of null
        }
        toast({
          title: "Wallet Removed",
          description: "Wallet has been successfully removed from tracking",
        });
        fetchWallets(); // Refetch wallets
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error('handleRemoveWallet: Error removing wallet:', error);
        toast({
          title: "Failed to Remove Wallet",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsRemovingWallet(false);
      }
    } else {
      console.log('handleRemoveWallet: User canceled removal.');
    }
  };

  const handleUpdateWalletName = async (address: string, newName: string) => {
    console.log(`handleUpdateWalletName: Attempting to update wallet: ${address} to name: "${newName}"`);
    if (!principalId || !newName.trim() || !actor) {
      console.warn('handleUpdateWalletName: Aborted. Principal, new name, or actor not available.');
      return;
    }

    setIsUpdatingWallet(true);
    try {
      const principal = Principal.fromText(principalId);
      const name = newName.trim();
      console.log('handleUpdateWalletName: Calling actor.updateWalletName with:', { principal: principal.toText(), address, newName: name });
      await actor.updateWalletName(principal, address, name);

      console.log('handleUpdateWalletName: Successfully updated wallet name.');
      setEditingWallet(null);
      toast({
        title: "Wallet Updated",
        description: "Wallet name has been successfully updated",
      });
      fetchWallets(); // Refetch wallets
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error('handleUpdateWalletName: Error updating wallet name:', error);
      toast({
        title: "Failed to Update Wallet",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingWallet(false);
    }
  };

  // Utility functions
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

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
      {/* Header */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Wallet Tracker</h1>
              <p className="text-muted-foreground">Track your Bitcoin wallets and copying trading activity</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => setShowAddWalletModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar - Wallet List */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg border-border">
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
                    onClick={() => fetchWallets()}
                    disabled={isLoadingWallets}
                    title="Refresh wallets"
                  >
                    <div className={isLoadingWallets ? "animate-spin" : ""}>
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
                disabled={isAddingWallet || !shouldFetchData}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAddingWallet ? 'Adding...' : 'Add Wallet'}
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
                <Button
                  variant={selectedWallet === 'ALL' ? "secondary" : "ghost"}
                  className={`w-full justify-start mb-2 ${selectedWallet === 'ALL' ? 'bg-accent text-accent-foreground' : ''}`}
                  onClick={() => setSelectedWallet('ALL')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  All Wallets Activity
                </Button>
                {isLoadingWallets ? (
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
                      onClick={() => fetchWallets()}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                ) : wallets.length > 0 ? (
                  wallets.map((wallet) => (
                    <div
                      key={wallet.address}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedWallet === wallet.address
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
                              onChange={(e) => setEditingWallet({ ...editingWallet, name: e.target.value })}
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
                            disabled={isUpdatingWallet}
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
                            disabled={isRemovingWallet}
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

        {/* Main Content - Activity */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-lg border-border">
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
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Copy
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
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
                    ) : (
                      <>
                        {displayActivities.length > 0 ? (
                          displayActivities.map((activity, index) => (
                            <tr key={`${activity.id || index}-${activity.time}`} className="hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={getOdinImageUrl('token', typeof activity.token === 'object' ? (activity.token as any)?.id : activity.token)}
                                    alt={activity.token_name || (typeof activity.token === 'object' ? (activity.token as any)?.name : 'Token')}
                                    className="w-8 h-8 rounded-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-token.png';
                                    }}
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {activity.token_ticker || activity.token_name || (typeof activity.token === 'object' ? (activity.token as any)?.ticker || (activity.token as any)?.name : 'Unknown')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      MC: ${((activity.token_marketcap || (typeof activity.token === 'object' ? (activity.token as any)?.marketcap : 0) || 0) / 1000000).toFixed(2)}M
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(activity.buy === true || (activity as any).action === 'BUY')
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {(activity.buy === true || (activity as any).action === 'BUY') ? 'BUY' : 'SELL'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                                {formatTradeTokenAmount(activity.amount_token || (activity as any).token_amount || 0, activity.decimals || 3).toFixed(6)}
                              </td>
                              <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                                {formatTradeBTC(activity.amount_btc || (activity as any).btc_amount || 0).formatted}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-foreground">
                                ${(activity.price || (typeof activity.token === 'object' ? (activity.token as any)?.price : 0) || 0).toExponential(2)}
                              </td>
                              <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                                {formatTime(activity.time)}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end">
                                  {(activity.action === 'BUY' || (!activity.action && activity.buy === true)) && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!isAuthenticated) {
                                          await login(); // Prompt login instead of just error
                                          return;
                                        }

                                        const tokenId = typeof activity.token === 'object' ? activity.token?.id : activity.token;
                                        // Convert API millisatoshis to BTC for buyToken
                                        const btcAmount = formatTradeBTC(activity.amount_btc || activity.btc_amount || 0).btc;

                                        // TODO: Add slippage settings from user preferences
                                        const result = await buyToken(tokenId, btcAmount);

                                        if (result && 'ok' in result) {
                                          toast({
                                            title: "Copy Buy Successful",
                                            description: `Bought ${activity.token_ticker || (typeof activity.token === 'object' ? (activity.token as any)?.ticker : 'tokens')} successfully`,
                                            className: "bg-green-50 border-green-200 text-green-800"
                                          });
                                        } else {
                                          toast({
                                            title: "Buy Failed",
                                            description: (result && 'err' in result) ? result.err : "Unknown error",
                                            variant: "destructive"
                                          });
                                        }
                                      }}
                                      disabled={isTradingLoading}
                                    >
                                      {isTradingLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                                      Copy Buy
                                    </Button>
                                  )}

                                  {(activity.action === 'SELL' || (!activity.action && activity.buy === false)) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-3 border-red-200 hover:bg-red-50 text-red-700 shadow-sm"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!isAuthenticated) {
                                          await login();
                                          return;
                                        }

                                        const tokenId = typeof activity.token === 'object' ? (activity.token as any)?.id : activity.token;
                                        // Convert API scaled amount to human-readable for sellToken
                                        const tokenAmount = formatTradeTokenAmount(activity.amount_token || (activity as any).token_amount || 0, activity.decimals || 3);
                                        const result = await sellToken(tokenId, tokenAmount);

                                        if (result && 'ok' in result) {
                                          toast({
                                            title: "Copy Sell Successful",
                                            description: `Sold ${activity.token_ticker || (typeof activity.token === 'object' ? (activity.token as any)?.ticker : 'tokens')} successfully`,
                                            className: "bg-green-50 border-green-200 text-green-800"
                                          });
                                        } else {
                                          toast({
                                            title: "Sell Failed",
                                            description: (result && 'err' in result) ? result.err : "Unknown error",
                                            variant: "destructive"
                                          });
                                        }
                                      }}
                                      disabled={isTradingLoading}
                                    >
                                      {isTradingLoading ? <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                                      Copy Sell
                                    </Button>
                                  )}
                                </div>
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
                                  {selectedWallet === 'ALL'
                                    ? "No trading activity found across all your tracked wallets."
                                    : "No trading activity found for this wallet address."}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {/* Load More Button */}
                        {hasNextPage && displayActivities.length > 0 && (
                          <tr>
                            <td colSpan={6} className="py-4 text-center bg-slate-50/50">
                              <Button
                                variant="outline"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="w-full max-w-xs"
                              >
                                {isFetchingNextPage ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                                    Loading more...
                                  </>
                                ) : (
                                  "Load More Activity"
                                )}
                              </Button>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div >
      </div >

      {/* Add Wallet Modal */}
      {
        showAddWalletModal && (
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
                    disabled={isAddingWallet}
                  />
                  <Input
                    placeholder="Wallet name (optional)"
                    className="w-full"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    data-testid="input-wallet-name"
                    disabled={isAddingWallet}
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
                      disabled={isAddingWallet}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleAddWallet}
                      disabled={!newWalletAddress.trim() || isAddingWallet}
                      data-testid="button-confirm-add-wallet"
                    >
                      {isAddingWallet ? (
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
        )
      }

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
    </main >
  );
}
