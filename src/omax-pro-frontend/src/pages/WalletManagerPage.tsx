import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../auth/AuthProvider';
import { useWalletBalances, useTransactionFees, useWithdrawFunds } from '../hooks/useWalletAPI';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Wallet, 
  Download, 
  Plus, 
  Copy, 
  ArrowUpCircle,
  ArrowDownCircle,
  Bitcoin,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  QrCode
} from 'lucide-react';

// ckBTC Integration Types
interface CkBTCMinterService {
  get_btc_address: (args: { owner?: string; subaccount?: number[] }) => Promise<string>;
  update_balance: (args: { owner?: string; subaccount?: number[] }) => Promise<{ Ok: bigint } | { Err: any }>;
  retrieve_btc: (args: { address: string; amount: bigint }) => Promise<{ Ok: bigint } | { Err: any }>;
}

interface DepositState {
  address: string;
  isGenerating: boolean;
  error: string | null;
  qrCode: string | null;
}

export default function WalletManagerPage() {
  const { t } = useLanguage();
  const { identity, isAuthenticated, principalId } = useAuth();
  const [activeTab, setActiveTab] = useState('deposits');
  const [selectedNetwork, setSelectedNetwork] = useState('bitcoin');
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [depositState, setDepositState] = useState<DepositState>({
    address: '',
    isGenerating: false,
    error: null,
    qrCode: null
  });
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  
  const { data: balances = [], refetch: refetchBalances } = useWalletBalances();
  const { data: fees = [] } = useTransactionFees();
  const withdrawMutation = useWithdrawFunds();

  const networks = [
    { id: 'bitcoin', name: 'Bitcoin', icon: Bitcoin, token: 'BTC' },
    { id: 'internet-computer', name: 'Internet Computer', icon: Globe, token: 'ckBTC' }
  ];

  const currentBalance = balances.find(b => b.network === selectedNetwork && b.token === selectedToken);
  const networkFee = fees.find(f => f.network === selectedNetwork);

  // Generate ckBTC deposit address using Internet Identity
  const generateDepositAddress = async () => {
    if (!isAuthenticated || !identity || !principalId) {
      setDepositState(prev => ({ 
        ...prev, 
        error: 'Please authenticate with Internet Identity first' 
      }));
      return;
    }

    setDepositState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null 
    }));

    try {
      // This would be the actual ckBTC minter canister integration
      // Replace with your actual canister ID
      const ckBTCMinterCanisterId = 'mqygn-kiaaa-aaaar-qaadq-cai'; // ckBTC minter canister
      
      // Mock implementation - replace with actual canister call
      // In a real implementation, you'd use @dfinity/agent to call the canister
      const mockAddress = await generateMockBTCAddress(principalId);
      
      setDepositState(prev => ({
        ...prev,
        address: mockAddress,
        isGenerating: false,
        qrCode: `bitcoin:${mockAddress}` // For QR code generation
      }));

    } catch (error) {
      console.error('Error generating deposit address:', error);
      setDepositState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'Failed to generate deposit address. Please try again.'
      }));
    }
  };

  // Mock function - replace with actual ckBTC minter integration
  const generateMockBTCAddress = async (principalId: string): Promise<string> => {
    // This simulates the ckBTC minter service
    // In reality, you'd call the ckBTC minter canister's get_btc_address method
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a mock Bitcoin address based on principal ID
        const mockAddress = `bc1q${principalId.slice(0, 8)}example${Math.random().toString(36).slice(2, 8)}`;
        resolve(mockAddress);
      }, 2000);
    });
  };

  // Update balance using ckBTC minter
  const handleUpdateBalance = async () => {
    if (!isAuthenticated || !identity) {
      alert('Please authenticate first');
      return;
    }

    setIsUpdatingBalance(true);
    try {
      // Mock balance update - replace with actual ckBTC minter call
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refetchBalances();
      
      // In a real implementation, you'd call:
      // const result = await ckBTCMinter.update_balance({ owner: principalId });
      
    } catch (error) {
      console.error('Error updating balance:', error);
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !destinationAddress) return;
    
    withdrawMutation.mutate({
      network: selectedNetwork as 'bitcoin' | 'internet-computer',
      token: selectedToken as 'BTC' | 'ckBTC',
      amount: withdrawAmount,
      destinationAddress
    });
  };

  const generateQRCode = () => {
    if (depositState.address) {
      // In a real implementation, you'd generate an actual QR code
      alert(`QR Code for: ${depositState.address}`);
    }
  };

  // Generate deposit address when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && activeTab === 'deposits' && !depositState.address && !depositState.isGenerating) {
      generateDepositAddress();
    }
  }, [isAuthenticated, activeTab]);

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-wallet-manager">
        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please authenticate with Internet Identity to access your wallet manager.
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be authenticated to manage deposits and withdrawals using ckBTC.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-wallet-manager">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-page-title">
          Wallet Manager
        </h1>
        <p className="text-muted-foreground">
          Manage your Bitcoin and ckBTC deposits and withdrawals using Internet Identity.
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          Principal ID: {principalId}
        </div>
      </div>

      {/* Wallet Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button 
          className="bg-accent hover:bg-accent/90 text-accent-foreground" 
          data-testid="button-generate-wallet"
          onClick={generateDepositAddress}
          disabled={depositState.isGenerating}
        >
          {depositState.isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Generate New Deposit Address
            </>
          )}
        </Button>
      </div>

      {/* Wallet Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
                <TabsTrigger value="withdraw" data-testid="tab-withdraw">Withdraw</TabsTrigger>
                <TabsTrigger value="logs" data-testid="tab-logs">Logs</TabsTrigger>
              </TabsList>
              
              {/* Balance Display */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-foreground">Wallets</h2>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-balance">
                    $ {currentBalance?.usdValue || '0.00'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentBalance?.balance || '0.00000000'} {selectedToken}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <TabsContent value="deposits" className="mt-0">
                <div className="space-y-6">
                  {/* Network Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select the network
                    </label>
                    <Select value={selectedNetwork} onValueChange={(value) => {
                      setSelectedNetwork(value);
                      const network = networks.find(n => n.id === value);
                      if (network) setSelectedToken(network.token);
                    }}>
                      <SelectTrigger data-testid="select-network">
                        <div className="flex items-center space-x-2">
                          {networks.find(n => n.id === selectedNetwork)?.icon && 
                            React.createElement(networks.find(n => n.id === selectedNetwork)!.icon, { 
                              className: "w-4 h-4 text-warning" 
                            })
                          }
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map(network => (
                          <SelectItem key={network.id} value={network.id}>
                            <div className="flex items-center space-x-2">
                              <network.icon className="w-4 h-4 text-warning" />
                              <span>{network.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Token Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select the token
                    </label>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger data-testid="select-token">
                        <div className="flex items-center space-x-2">
                          <Bitcoin className="w-4 h-4 text-warning" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">
                          <div className="flex items-center space-x-2">
                            <Bitcoin className="w-4 h-4 text-warning" />
                            <span>Bitcoin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ckBTC">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-warning" />
                            <span>Chain Key Bitcoin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Alert */}
                  {depositState.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{depositState.error}</AlertDescription>
                    </Alert>
                  )}

                  {selectedToken === 'ckBTC' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        ckBTC deposits are powered by Internet Computer's Chain-key Bitcoin integration. 
                        Your deposits will be automatically converted to ckBTC tokens.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Deposit Address */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Deposit address {depositState.isGenerating && '(Generating...)'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={depositState.address}
                        readOnly
                        className="flex-1 bg-background"
                        placeholder={depositState.isGenerating ? "Generating address..." : "No address generated"}
                        data-testid="input-deposit-address"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => handleCopyAddress(depositState.address)}
                        disabled={!depositState.address}
                        data-testid="button-copy-address"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Update Balance */}
                  <div className="flex justify-between items-center">
                    <Button 
                      onClick={handleUpdateBalance}
                      disabled={isUpdatingBalance}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      data-testid="button-update-balance"
                    >
                      {isUpdatingBalance ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update balance'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={generateQRCode}
                      disabled={!depositState.address}
                      data-testid="button-show-qr"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Show QR Code
                    </Button>
                  </div>

                  {/* Deposit Instructions */}
                  <Alert>
                    <Bitcoin className="h-4 w-4" />
                    <AlertDescription>
                      {selectedToken === 'ckBTC' 
                        ? "Send Bitcoin to the address above. It will automatically be converted to ckBTC on the Internet Computer network with 1:1 backing."
                        : "Send Bitcoin to the address above. Minimum deposit: 0.001 BTC"
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="withdraw" className="mt-0">
                <div className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    No upcoming transaction
                  </div>

                  {/* Network Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select the network
                    </label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger data-testid="select-withdraw-network">
                        <div className="flex items-center space-x-2">
                          {networks.find(n => n.id === selectedNetwork)?.icon && 
                            React.createElement(networks.find(n => n.id === selectedNetwork)!.icon, { 
                              className: "w-4 h-4 text-warning" 
                            })
                          }
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map(network => (
                          <SelectItem key={network.id} value={network.id}>
                            <div className="flex items-center space-x-2">
                              <network.icon className="w-4 h-4 text-warning" />
                              <span>{network.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Token Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select the token
                    </label>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger data-testid="select-withdraw-token">
                        <div className="flex items-center space-x-2">
                          {selectedToken === 'ckBTC' ? (
                            <Globe className="w-4 h-4 text-warning" />
                          ) : (
                            <Bitcoin className="w-4 h-4 text-warning" />
                          )}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">
                          <div className="flex items-center space-x-2">
                            <Bitcoin className="w-4 h-4 text-warning" />
                            <span>Bitcoin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ckBTC">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-warning" />
                            <span>Chain Key Bitcoin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destination Address */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Wallet address
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Destination Address"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        className="flex-1"
                        data-testid="input-destination-address"
                      />
                      <Button variant="outline" size="sm" data-testid="button-paste-address">
                        {selectedToken}
                      </Button>
                    </div>
                  </div>

                  {/* Withdraw Amount */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Withdraw Amount
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1"
                        data-testid="input-withdraw-amount"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setWithdrawAmount(currentBalance?.balance || '0')}
                        data-testid="button-max-amount"
                      >
                        All
                      </Button>
                    </div>
                  </div>

                  {/* Fee Information */}
                  <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Inter network fee</span>
                      <span className="text-sm font-medium text-foreground" data-testid="text-inter-fee">
                        {networkFee ? `${networkFee.fee} ${networkFee.feeToken}` : '0.00000100 BTC'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{selectedNetwork} network fee</span>
                      <span className="text-sm font-medium text-foreground" data-testid="text-network-fee">
                        {networkFee ? `${networkFee.fee} ${networkFee.feeToken}` : '0.00000703 BTC'}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Receive amount</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-warning" data-testid="text-receive-amount">
                            {withdrawAmount || '0.00000000'} {selectedToken}
                          </div>
                          <div className="text-xs text-muted-foreground">≈ $0.01 USD</div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Minimum amount</span>
                        <span className="text-sm font-medium text-warning" data-testid="text-minimum-amount">
                          0.0005 {selectedToken}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  <Button 
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || !destinationAddress || withdrawMutation.isPending}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3"
                    data-testid="button-withdraw"
                  >
                    {withdrawMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Withdraw'
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Transaction Logs</h3>
                  <p className="text-sm text-muted-foreground">
                    Your transaction history will appear here once you make deposits or withdrawals.
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}