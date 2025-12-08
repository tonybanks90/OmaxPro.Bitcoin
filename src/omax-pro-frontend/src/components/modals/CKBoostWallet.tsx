import { useTheme } from '../../contexts/ThemeContext';
import React, { useCallback } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useCkBoost, BoostStatus } from '../../hooks/useCkBoost';
import {
  getStatusLabel,
  getStatusColor,
  calculateProgress,
  getEstimatedTimeRemaining
} from '../../hooks/useBoostHistory';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Sun,
  Moon,
  RefreshCw,
  Loader2,
  Trash2,
  Zap
} from 'lucide-react';

// =====================
// Progress Bar Component
// =====================

interface ProgressBarProps {
  progress: number;
  status: BoostStatus;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status }) => {
  const getProgressColor = () => {
    switch (status) {
      case BoostStatus.COMPLETED:
        return 'bg-success';
      case BoostStatus.CANCELLED:
        return 'bg-destructive';
      case BoostStatus.ACTIVE:
        return 'bg-accent';
      default:
        return 'bg-warning';
    }
  };

  return (
    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ease-out ${getProgressColor()}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// =====================
// Status Timeline Component
// =====================

interface StatusTimelineProps {
  status: BoostStatus;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  const stages = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'accepted', label: 'Boosted', icon: Zap },
    { key: 'completed', label: 'Complete', icon: CheckCircle }
  ];

  const getStageStatus = (stageKey: string) => {
    if (status === BoostStatus.CANCELLED) return 'cancelled';

    switch (stageKey) {
      case 'pending':
        return status === BoostStatus.PENDING ? 'active' : 'complete';
      case 'accepted':
        return status === BoostStatus.ACTIVE ? 'active' :
          status === BoostStatus.COMPLETED ? 'complete' : 'pending';
      case 'completed':
        return status === BoostStatus.COMPLETED ? 'complete' : 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="flex items-center justify-between w-full mt-3">
      {stages.map((stage, index) => {
        const stageStatus = getStageStatus(stage.key);
        const Icon = stage.icon;

        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all
                ${stageStatus === 'complete' ? 'bg-success text-success-foreground' : ''}
                ${stageStatus === 'active' ? 'bg-accent text-accent-foreground animate-pulse' : ''}
                ${stageStatus === 'pending' ? 'bg-secondary text-muted-foreground' : ''}
                ${stageStatus === 'cancelled' ? 'bg-destructive/50 text-destructive-foreground' : ''}
              `}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs mt-1 ${stageStatus === 'active' ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${stageStatus === 'complete' ? 'bg-success' : 'bg-secondary'
                }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// =====================
// Main Component
// =====================

const CKBoostWallet = () => {
  const { isAuthenticated, login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Use the new ckBoost hook
  const {
    tokenConfig,
    isLoading,
    error,
    depositInfo,
    activeRequests,
    generateDepositAddress,
    refreshActiveRequests,
    clearError,
    clearHistory
  } = useCkBoost();

  // Local state for form
  const [activeTab, setActiveTab] = React.useState('deposit');
  const [depositAmount, setDepositAmount] = React.useState('');
  const [maxFee, setMaxFee] = React.useState(1.5);
  const [success, setSuccess] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleDeposit = useCallback(async () => {
    clearError();
    setSuccess('');

    const result = await generateDepositAddress(depositAmount, maxFee);

    if (result) {
      setSuccess('Deposit address generated successfully!');
      setDepositAmount('');
      setTimeout(() => setSuccess(''), 5000);
    }
  }, [depositAmount, maxFee, generateDepositAddress, clearError]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshActiveRequests();
    setIsRefreshing(false);
  }, [refreshActiveRequests]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  const getStatusIcon = (status: BoostStatus) => {
    switch (status) {
      case BoostStatus.PENDING:
        return <Clock className="w-4 h-4" />;
      case BoostStatus.ACTIVE:
        return <Zap className="w-4 h-4" />;
      case BoostStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      case BoostStatus.CANCELLED:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-card rounded-lg shadow-lg animate-fade-in">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-card-foreground mb-4">CKBTC Fast Deposit</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to start using CKBTC-Fast-Depo acceleration services
          </p>
          <button
            onClick={login}
            className="w-full bg-accent text-accent-foreground py-2 px-4 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Wallet className="w-8 h-8 text-accent" />
              <Zap className="w-4 h-4 text-warning absolute -bottom-1 -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">CKTESTBTC-Deposit</h1>
              <p className="text-muted-foreground">Fast ckTESTBTC conversions under 10 mins</p>
              {isAuthenticated && (
                <p className="text-xs text-muted-foreground mt-1 font-mono bg-secondary/50 px-2 py-0.5 rounded inline-block">
                  User ID: {useAuth().principalId}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
              title="Refresh requests"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg animate-slide-up flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-destructive hover:text-destructive/80">×</button>
        </div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg animate-slide-up">
          {success}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Actions */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-lg p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'deposit'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-surface-light'
                }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'history'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-surface-light'
                }`}
            >
              <Clock className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>

          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">
                  Create Deposit Request
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount (ckTESTBTC)
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      min={tokenConfig?.minimumAmount || "0"}
                      max={tokenConfig?.maximumAmount || "1"}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-secondary border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-accent"
                      placeholder="0.01"
                    />
                    {tokenConfig && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Min: {tokenConfig.minimumAmount}, Max: {tokenConfig.maximumAmount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Maximum Fee ({maxFee}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={maxFee}
                      onChange={(e) => setMaxFee(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1%</span>
                      <span>2.0%</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={isLoading || !depositAmount}
                    className="w-full bg-accent text-accent-foreground py-3 px-4 rounded-lg hover:bg-accent/90 disabled:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating Request...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Generate Deposit Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Deposit Info */}
              {depositInfo && (
                <div className="border border-border rounded-lg p-4 space-y-3 animate-slide-up bg-secondary/30">
                  <h4 className="font-semibold text-card-foreground flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Deposit Information</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bitcoin Address:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all flex-1">
                          {depositInfo.address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(depositInfo.address)}
                          className="text-accent hover:text-accent/90 p-2"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Amount (Satoshis):</label>
                        <p className="font-mono text-sm">{depositInfo.amountRaw}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Request ID:</label>
                        <p className="font-mono text-sm truncate">{depositInfo.requestId}</p>
                      </div>
                    </div>

                    <a
                      href={depositInfo.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-accent hover:text-accent/90 text-sm"
                    >
                      <span>View on Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Transaction History
                </h3>
                {activeRequests.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-muted-foreground hover:text-destructive flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {activeRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transaction history</p>
                  <p className="text-sm mt-1">Your deposit requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-border rounded-lg p-4 bg-secondary/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{getStatusLabel(request.status)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground flex flex-col items-end">
                          <span>{new Date(request.createdAt).toLocaleString()}</span>
                          <span className="font-mono text-[10px] opacity-70">ID: {request.id}</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <ProgressBar progress={calculateProgress(request.status)} status={request.status} />

                      {/* Status Timeline */}
                      <StatusTimeline status={request.status} />

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-mono ml-2">{request.amount} ckTESTBTC</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Fee:</span>
                          <span className="ml-2">{request.maxFeePercentage}%</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Est. Time:</span>
                          <span className="ml-2 text-accent">{getEstimatedTimeRemaining(request.status)}</span>
                        </div>
                      </div>

                      {request.depositAddress && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <code className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                              {request.depositAddress}
                            </code>
                            <button
                              onClick={() => request.depositAddress && copyToClipboard(request.depositAddress)}
                              className="text-accent hover:text-accent/90"
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
          )}
        </div>

        {/* Right Panel - Active Requests Summary */}
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-accent" />
            <span>Active Requests</span>
          </h3>

          {activeRequests.filter(r => r.status === BoostStatus.PENDING || r.status === BoostStatus.ACTIVE).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRequests
                .filter(r => r.status === BoostStatus.PENDING || r.status === BoostStatus.ACTIVE)
                .map((request) => (
                  <div key={request.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span>{getStatusLabel(request.status)}</span>
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground mr-1">#{request.id}</span>
                    </div>

                    <ProgressBar progress={calculateProgress(request.status)} status={request.status} />

                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-mono">{request.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ETA:</span>
                        <span className="text-accent text-xs">{getEstimatedTimeRemaining(request.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Requests:</span>
                <span>{activeRequests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span className="text-success">
                  {activeRequests.filter(r => r.status === BoostStatus.COMPLETED).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Progress:</span>
                <span className="text-accent">
                  {activeRequests.filter(r => r.status === BoostStatus.PENDING || r.status === BoostStatus.ACTIVE).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CKBoostWallet;