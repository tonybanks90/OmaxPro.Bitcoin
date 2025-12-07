import { useState } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from '../components/ui/badge';
import {
  Target,
  Plus,
  Trash2,
  Wallet as WalletIcon,
  AlertCircle,
  LogIn,
  User,
  RefreshCcw,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthProvider";
import { useSniper } from "../hooks/useSniper";
import { useToast } from "../hooks/use-toast";

// --- Types mirroring the Backend ---
interface SnipeConfig {
  id: bigint;
  owner: unknown; // Principal
  tokenId: string;
  targetMarketCapUSD: number;
  amountBTC: bigint;
  status: { active?: null; completed?: null; failed?: string; cancelled?: null };
  createdAt: bigint;
}

export default function SniperPage() {
  useLanguage();
  const { toast } = useToast();
  const { isAuthenticated, principalId, login, logout, isReady: authReady } = useAuth();
  const { addSnipe, cancelSnipe, deposit } = useSniper();

  // State
  const balance = 0.0; // TODO: Fetch from canister
  const [snipes, setSnipes] = useState<SnipeConfig[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [newSnipe, setNewSnipe] = useState({
    tokenId: '',
    targetMarketCapUSD: '',
    amountBTC: '',
  });

  const refreshData = () => {
    // TODO: Fetch snipes from canister
    console.log('Refreshing data...');
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      toast({ title: "Invalid Input", description: "Please enter a valid amount to deposit.", variant: "destructive" });
      return;
    }
    try {
      const sats = BigInt(Math.floor(Number(depositAmount) * 100_000_000));
      await deposit(sats);
      toast({ title: "Deposit Successful", description: `Deposited ${depositAmount} BTC` });
      setDepositAmount('');
      refreshData();
    } catch (e) {
      toast({ title: "Deposit Failed", description: String(e), variant: "destructive" });
    }
  };

  const handleAddSnipe = async () => {
    if (!newSnipe.tokenId || !newSnipe.targetMarketCapUSD || !newSnipe.amountBTC) {
      toast({ title: "Invalid Input", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    try {
      const sats = BigInt(Math.floor(Number(newSnipe.amountBTC) * 100_000_000));
      const mc = Number(newSnipe.targetMarketCapUSD);
      await addSnipe(newSnipe.tokenId, mc, sats);
      toast({ title: "Snipe Added", description: `Watching ${newSnipe.tokenId}` });
      setNewSnipe({ tokenId: '', targetMarketCapUSD: '', amountBTC: '' });
      setShowAddModal(false);
      refreshData();
    } catch (e) {
      toast({ title: "Failed to add snipe", description: String(e), variant: "destructive" });
    }
  };

  const handleCancelSnipe = async (id: bigint) => {
    try {
      await cancelSnipe(id);
      toast({ title: "Snipe Cancelled" });
      refreshData();
    } catch (e) {
      toast({ title: "Failed to cancel", description: String(e), variant: "destructive" });
    }
  };

  const activeSnipes = snipes.filter(s => 'active' in s.status);
  const historySnipes = snipes.filter(s => !('active' in s.status));

  // Show authentication required screen
  if (authReady && !isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-sniper">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Sniper</h2>
                <p className="text-muted-foreground">
                  Sign in with Internet Identity to create automated snipes.
                </p>
              </div>
              <Button onClick={login} className="w-full" size="lg">
                <LogIn className="w-5 h-5 mr-2" />
                Sign in with Internet Identity
              </Button>
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-sniper">
      {/* User Info Banner & Balance */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {principalId?.slice(0, 8)}...{principalId?.slice(-6)}
              </p>
              <p className="text-xs text-green-600">Connected</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="text-green-700 border-green-300">
            Sign Out
          </Button>
        </div>

        {/* Canister Balance */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <WalletIcon className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Canister Balance</p>
              <p className="text-lg font-bold text-blue-900">{balance.toFixed(8)} BTC</p>
            </div>
          </div>
          <Button size="sm" onClick={handleDeposit} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" />
            Deposit
          </Button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-page-title">Sniper</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            data-testid="button-add-task"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Snipe
          </Button>
        </div>
      </div>

      {/* Sniper Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="active" data-testid="tab-active">
                  Active Snipes ({activeSnipes.length})
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">
                  History ({historySnipes.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="active" className="mt-0">
                {activeSnipes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="w-12 h-12 text-accent" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No active snipes</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Set up a new snipe to catch market moves automatically.
                    </p>
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Snipe
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSnipes.map(snipe => (
                      <SnipeCard key={snipe.id.toString()} snipe={snipe} onCancel={handleCancelSnipe} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <div className="text-center py-16">
                  {historySnipes.length === 0 ? (
                    <>
                      <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <RefreshCcw className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">No history</h3>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {historySnipes.map(snipe => (
                        <div key={snipe.id.toString()} className="grid grid-cols-6 gap-4 px-4 py-3 bg-muted/20 border border-border rounded-lg items-center opacity-70">
                          <div className="col-span-1">
                            <Badge variant="secondary">
                              {'completed' in snipe.status ? 'Completed' : 'cancelled' in snipe.status ? 'Cancelled' : 'Failed'}
                            </Badge>
                          </div>
                          <div className="col-span-2 font-medium truncate">{snipe.tokenId}</div>
                          <div className="text-right">${snipe.targetMarketCapUSD}</div>
                          <div className="text-right">{(Number(snipe.amountBTC) / 100000000).toFixed(6)}</div>
                          <div className="text-right">-</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Snipe Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Snipe</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Token ID (Canister ID or Odin ID)</label>
                <Input
                  placeholder="e.g. ryjl3-tyaaa-aaaaa-aaaba-cai"
                  value={newSnipe.tokenId}
                  onChange={(e) => setNewSnipe(prev => ({ ...prev, tokenId: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Market Cap ($)</label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={newSnipe.targetMarketCapUSD}
                  onChange={(e) => setNewSnipe(prev => ({ ...prev, targetMarketCapUSD: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Snipe triggers when MC is at or below this value.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to Buy (BTC)</label>
                <Input
                  type="number"
                  placeholder="e.g. 0.001"
                  value={newSnipe.amountBTC}
                  onChange={(e) => setNewSnipe(prev => ({ ...prev, amountBTC: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleAddSnipe}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4"
              >
                <Target className="w-4 h-4 mr-2" />
                Activate Snipe
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function SnipeCard({ snipe, onCancel }: { snipe: SnipeConfig, onCancel: (id: bigint) => void }) {
  const statusColor = 'active' in snipe.status ? 'bg-green-500/10 text-green-500' :
    'completed' in snipe.status ? 'bg-blue-500/10 text-blue-500' :
      'cancelled' in snipe.status ? 'bg-yellow-500/10 text-yellow-500' :
        'bg-red-500/10 text-red-500';

  const statusText = 'active' in snipe.status ? 'Active' :
    'completed' in snipe.status ? 'Completed' :
      'cancelled' in snipe.status ? 'Cancelled' :
        'Failed';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <Card className="relative border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:border-primary/20">
        <div className={`absolute top-0 left-0 w-1 h-full ${'active' in snipe.status ? 'bg-green-500' :
            'completed' in snipe.status ? 'bg-blue-500' :
              'cancelled' in snipe.status ? 'bg-yellow-500' : 'bg-red-500'
          }`} />

        <CardHeader className="pb-3 pl-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {snipe.tokenId}
              </CardTitle>
              <CardDescription className="font-mono text-xs mt-1 opacity-70">
                ID: #{snipe.id.toString()}
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${statusColor} border-0 capitalize`}>
              {statusText}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pl-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Target MC</span>
              <div className="font-mono font-medium flex items-center text-green-500">
                ${snipe.targetMarketCapUSD.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Amount</span>
              <div className="font-mono font-medium">
                {(Number(snipe.amountBTC) / 100_000_000).toFixed(6)} BTC
              </div>
            </div>
          </div>

          {'active' in snipe.status && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full mt-2 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onCancel(snipe.id)}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Cancel Snipe
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}