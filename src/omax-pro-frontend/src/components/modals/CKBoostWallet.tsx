import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider'; // Assuming your auth hook is in a separate file
import { 
  ckTESTBTCClient, 
  BoostStatus,
  CKBoostErrorType, // Corrected: Imported as a value
  type BoostRequest,
  type DepositAddress,
  type TokenConfig
} from '@ckboost/client';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';

const CKBoostWallet = () => {
const { identity, isAuthenticated, principalId, login } = useAuth();
  
  // Client instance
  const [client] = useState(() => new ckTESTBTCClient({
    host: 'https://icp-api.io',
    timeout: 30000
  }));

  // State management
  const [activeTab, setActiveTab] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [maxFee, setMaxFee] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Deposit state
  const [depositInfo, setDepositInfo] = useState<DepositAddress | null>(null);
  const [activeRequests, setActiveRequests] = useState<BoostRequest[]>([]);
  const [monitoringIntervals, setMonitoringIntervals] = useState(new Map<string, NodeJS.Timeout>());

  // Token configuration
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);

  useEffect(() => {
    // Get token configuration on mount
    const config = client.getTokenConfig();
    setTokenConfig(config);
    
    // Load active requests on mount
    if (isAuthenticated) {
      loadActiveRequests();
    }

    return () => {
      // Cleanup monitoring intervals
      monitoringIntervals.forEach(interval => clearInterval(interval));
    };
  }, [isAuthenticated]);

  const loadActiveRequests = async () => {
    try {
      const result = await client.getPendingBoostRequests();
      if (result.success) {
        setActiveRequests(result.data);
        // Start monitoring each pending request
        result.data.forEach(request => {
          if (request.status === BoostStatus.PENDING || request.status === BoostStatus.ACTIVE) {
            startMonitoring(request.id);
          }
        });
      }
    } catch (err) {
      console.error('Failed to load active requests:', err);
    }
  };

  const startMonitoring = (requestId: string) => {
    // Don't start if already monitoring
    if (monitoringIntervals.has(requestId)) return;

    const interval = setInterval(async () => {
      const result = await client.getBoostRequest(requestId);
      if (result.success) {
        const request = result.data;
        
        // Update the request in our list
        setActiveRequests(prev => 
          prev.map(r => r.id === requestId ? request : r)
        );

        // Stop monitoring if completed
        if (request.status === BoostStatus.COMPLETED || request.status === BoostStatus.CANCELLED) {
          clearInterval(interval);
          setMonitoringIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(requestId);
            return newMap;
          });
        }
      }
    }, 10000); // Poll every 10 seconds

    setMonitoringIntervals(prev => new Map(prev.set(requestId, interval)));
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!tokenConfig) {
      setError('Token configuration not loaded');
      return;
    }

    const amount = parseFloat(depositAmount);
    const minAmount = parseFloat(tokenConfig.minimumAmount);
    const maxAmount = parseFloat(tokenConfig.maximumAmount);

    if (amount < minAmount || amount > maxAmount) {
      setError(`Amount must be between ${minAmount} and ${maxAmount} ckTESTBTC`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await client.generateDepositAddress({
        amount: depositAmount,
        maxFeePercentage: maxFee
      });

      if (result.success) {
        setDepositInfo(result.data);
        setSuccess('Deposit address generated successfully!');
        
        // Add to active requests and start monitoring
        const newRequest: BoostRequest = {
          id: result.data.requestId,
          status: BoostStatus.PENDING,
          amount: result.data.amount,
          receivedAmount: '0',
          maxFeePercentage: maxFee,
          confirmationsRequired: result.data.confirmationsRequired || 2,
          depositAddress: result.data.address,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          amountRaw: result.data.amountRaw,
          owner: principalId ?? '',
          explorerUrl: result.data.explorerUrl
        };
        
        setActiveRequests(prev => [newRequest, ...prev]);
        startMonitoring(result.data.requestId);
        
        // Clear form
        setDepositAmount('');
      } else {
        setError(getErrorMessage(result.error));
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: { type: CKBoostErrorType; message: string }) => {
    switch (error.type) {
      case CKBoostErrorType.INVALID_AMOUNT:
        return 'Invalid amount. Please check the minimum and maximum limits.';
      case CKBoostErrorType.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case CKBoostErrorType.CANISTER_ERROR:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getStatusColor = (status: BoostStatus) => {
    switch (status) {
      case BoostStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case BoostStatus.ACTIVE:
        return 'text-blue-600 bg-blue-100';
      case BoostStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case BoostStatus.CANCELLED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: BoostStatus) => {
    switch (status) {
      case BoostStatus.PENDING:
      case BoostStatus.ACTIVE:
        return <Clock className="w-4 h-4" />;
      case BoostStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      case BoostStatus.CANCELLED:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-4">CKBTC Fast Deposit</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to start using CKBTC-Fast-Depo acceleration services
          </p>
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">CKTESTBTC-Deposit</h1>
              <p className="text-gray-600">Fast ckTESTBTC conversions under 10mins</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Connected as</p>
            <p className="font-mono text-sm text-gray-800 truncate max-w-[200px]">{principalId}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Actions */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'deposit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'withdraw'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Create Deposit Request
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (ckTESTBTC)
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      min={tokenConfig?.minimumAmount || "0"}
                      max={tokenConfig?.maximumAmount || "1"}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.01"
                    />
                    {tokenConfig && (
                      <p className="text-xs text-gray-500 mt-1">
                        Min: {tokenConfig.minimumAmount}, Max: {tokenConfig.maximumAmount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Fee ({maxFee}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={maxFee}
                      onChange={(e) => setMaxFee(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.1%</span>
                      <span>2.0%</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={loading || !depositAmount}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Creating Request...' : 'Generate Deposit Address'}
                  </button>
                </div>
              </div>

              {/* Deposit Info */}
              {depositInfo && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800">Deposit Information</h4>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bitcoin Address:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                          {depositInfo.address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(depositInfo.address)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Amount (Satoshis):</label>
                      <p className="font-mono text-sm">{depositInfo.amountRaw}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Request ID:</label>
                      <p className="font-mono text-sm">{depositInfo.requestId}</p>
                    </div>

                    <a
                      href={depositInfo.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <span>View on Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              <div className="text-center py-12 text-gray-500">
                <ArrowUpRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Withdrawal Feature</h3>
                <p>Standard ckTESTBTC withdrawals can be done through your wallet interface.</p>
                <p className="text-sm mt-2">CKBTC-Deposit focuses on accelerating deposits (Bitcoin → ckTESTBTC).</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Active Requests */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Requests</h3>
          
          {activeRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span>{request.status}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-mono">{request.amount} ckTESTBTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Received:</span>
                      <span className="font-mono">{request.receivedAmount} ckTESTBTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="text-xs">
                        {((parseFloat(request.receivedAmount) / parseFloat(request.amount)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {request.depositAddress && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 mb-1">Deposit Address:</p>
                      <div className="flex items-center space-x-1">
                        <code className="text-xs font-mono bg-gray-50 px-1 rounded flex-1 truncate">
                          {request.depositAddress}
                        </code>
                        <button
  onClick={() => request.depositAddress && copyToClipboard(request.depositAddress)}
  className="text-blue-600 hover:text-blue-700"
>
    <Copy className="w-3 h-3" />
</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CKBoostWallet;