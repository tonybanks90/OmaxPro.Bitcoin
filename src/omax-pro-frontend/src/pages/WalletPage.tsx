import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Download, Upload, Search, Wallet, Settings, Filter, Star, Inbox } from 'lucide-react';

export default function WalletPage() {
  const { t } = useLanguage();
  const [searchWallet, setSearchWallet] = useState('');
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-wallet">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Wallet Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Tracked Wallets</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" data-testid="button-download-wallets">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" data-testid="button-upload-wallets">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full mb-4" 
                onClick={() => setShowAddWalletModal(true)}
                data-testid="button-add-wallet"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Wallet
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
                />
              </div>

              {/* Empty State */}
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">You haven't added any wallets yet!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Wallet Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {/* Wallet Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground" data-testid="text-wallet-title">
                  {t('pages.wallet.title')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Add any wallet to receive real-time notifications on trades and activity
                </p>
              </div>

              {/* Wallet Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-background rounded-lg px-3 py-2 border border-border">
                    <Wallet className="text-accent" />
                    <span className="text-sm font-medium text-foreground">W1</span>
                    <Button variant="ghost" size="icon" className="w-4 h-4">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-1 bg-background rounded px-2 py-1 border border-border">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-xs font-medium text-foreground" data-testid="text-wallet-value">0.0001</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-preset-n1">N1</Button>
                    <Button variant="outline" size="sm" data-testid="button-preset-n2">N2</Button>
                    <Button variant="outline" size="sm" data-testid="button-preset-n3">N3</Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="button-star-wallet">
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="button-wallet-settings">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="outline" data-testid="button-wallet-filters">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Table Header */}
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
                        Amount
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Market Cap
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Wallet Name
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Empty State */}
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-wallets-title">
                            {t('empty.noWallets')}
                          </h4>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            It looks like you don't have any wallets set up yet. To start managing your crypto assets, create a new wallet or import an existing one.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Wallet Modal would be implemented here */}
      {showAddWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Add Wallet</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAddWalletModal(false)}
                  data-testid="button-close-add-wallet"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input 
                  placeholder="Wallet address" 
                  className="w-full"
                  data-testid="input-wallet-address"
                />
                <Input 
                  placeholder="Wallet name (optional)" 
                  className="w-full"
                  data-testid="input-wallet-name"
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAddWalletModal(false)}
                    data-testid="button-cancel-add-wallet"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setShowAddWalletModal(false)}
                    data-testid="button-confirm-add-wallet"
                  >
                    Add Wallet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
