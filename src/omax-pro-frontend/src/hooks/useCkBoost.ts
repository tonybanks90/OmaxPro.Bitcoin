import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import {
  ckTESTBTCClient,
  BoostStatus,
  CKBoostErrorType,
  type BoostRequest,
  type DepositAddress,
  type TokenConfig
} from '@ckboost/client';

// =====================
// Type Definitions
// =====================

export interface CkBoostConfig {
  host?: string;
  timeout?: number;
  pollingIntervalMs?: number;
}

export interface BoostRequestWithMeta extends BoostRequest {
  createdAtLocal?: number;
  updatedAtLocal?: number;
}

export interface UseCkBoostReturn {
  // State
  client: ckTESTBTCClient;
  tokenConfig: TokenConfig | null;
  isLoading: boolean;
  error: string | null;

  // Current deposit flow
  depositInfo: DepositAddress | null;
  activeRequests: BoostRequestWithMeta[];

  // Methods
  generateDepositAddress: (amount: string, maxFeePercentage?: number) => Promise<DepositAddress | null>;
  getBoostRequest: (requestId: string) => Promise<BoostRequest | null>;
  getUserRequests: () => Promise<BoostRequest[]>;

  // Monitoring
  startMonitoring: (requestId: string) => void;
  stopMonitoring: (requestId: string) => void;
  stopAllMonitoring: () => void;

  // History
  getRequestHistory: () => BoostRequestWithMeta[];
  clearHistory: () => void;

  // Utility
  clearError: () => void;
  refreshActiveRequests: () => Promise<void>;
}

// =====================
// Local Storage Keys
// =====================

const STORAGE_KEY_PREFIX = 'ckboost_history_';
const CKBOOST_BACKEND_CANISTER_ID = '75egi-7qaaa-aaaao-qj6ma-cai';

function getStorageKey(principalId: string): string {
  return `${STORAGE_KEY_PREFIX}${principalId}`;
}

function loadFromStorage(principalId: string): BoostRequestWithMeta[] {
  if (!principalId) return [];
  try {
    const data = localStorage.getItem(getStorageKey(principalId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(principalId: string, requests: BoostRequestWithMeta[]): void {
  if (!principalId) return;
  try {
    localStorage.setItem(getStorageKey(principalId), JSON.stringify(requests));
  } catch (e) {
    console.warn('Failed to save ckBoost history to localStorage:', e);
  }
}

// =====================
// Error Helpers
// =====================

function getErrorMessage(error: { type: CKBoostErrorType; message: string }): string {
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
}

// =====================
// IDL Factory for Backend Canister
// =====================
const backendIdlFactory = ({ IDL }: { IDL: any }) => {
  const BoostId = IDL.Nat;
  const BoostStatusVariant = IDL.Variant({
    'active': IDL.Null,
    'cancelled': IDL.Null,
    'pending': IDL.Null,
    'completed': IDL.Null
  });
  const Amount = IDL.Nat;
  const Timestamp = IDL.Int;
  const Subaccount = IDL.Vec(IDL.Nat8);
  const BoostRequestRecord = IDL.Record({
    'id': BoostId,
    'status': BoostStatusVariant,
    'receivedBTC': Amount,
    'confirmationsRequired': IDL.Nat,
    'owner': IDL.Principal,
    'maxFeePercentage': IDL.Float64,
    'createdAt': Timestamp,
    'subaccount': Subaccount,
    'booster': IDL.Opt(IDL.Principal),
    'updatedAt': Timestamp,
    'btcAddress': IDL.Opt(IDL.Text),
    'amount': Amount,
    'preferredBooster': IDL.Opt(IDL.Principal)
  });
  const Result = IDL.Variant({ 'ok': BoostRequestRecord, 'err': IDL.Text });
  const Result_2 = IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text });

  return IDL.Service({
    'registerBoostRequest': IDL.Func(
      [Amount, IDL.Float64, IDL.Nat, IDL.Opt(IDL.Principal)],
      [Result],
      []
    ),
    'getBoostRequestBTCAddress': IDL.Func([BoostId], [Result_2], []),
    'getBoostRequest': IDL.Func([BoostId], [IDL.Opt(BoostRequestRecord)], ['query']),
  });
};

// =====================
// Main Hook
// =====================

export function useCkBoost(config: CkBoostConfig = {}): UseCkBoostReturn {
  const { principalId, isAuthenticated, identity } = useAuth();

  // Config defaults
  const pollingIntervalMs = config.pollingIntervalMs ?? 10000;
  const host = config.host ?? 'https://icp-api.io';

  // Anonymous client for read operations
  const [client] = useState(() => new ckTESTBTCClient({
    host,
    timeout: config.timeout ?? 30000
  }));

  // Authenticated agent and actor for write operations
  const authenticatedBackend = useMemo(() => {
    if (!identity) return null;

    const agent = new HttpAgent({ host, identity });
    // Fetch root key for non-mainnet
    agent.fetchRootKey().catch(console.warn);

    return Actor.createActor(backendIdlFactory, {
      agent,
      canisterId: Principal.fromText(CKBOOST_BACKEND_CANISTER_ID)
    });
  }, [identity, host]);

  // State
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositInfo, setDepositInfo] = useState<DepositAddress | null>(null);
  const [activeRequests, setActiveRequests] = useState<BoostRequestWithMeta[]>([]);

  // Monitoring intervals map
  const monitoringIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load token config on mount
  useEffect(() => {
    const cfg = client.getTokenConfig();
    setTokenConfig(cfg);
  }, [client]);

  // Load history from localStorage when authenticated
  useEffect(() => {
    if (isAuthenticated && principalId) {
      const history = loadFromStorage(principalId);
      if (history.length > 0) {
        setActiveRequests(history);
      }
    }
  }, [isAuthenticated, principalId]);

  // Save to localStorage whenever activeRequests changes
  useEffect(() => {
    if (principalId && activeRequests.length > 0) {
      saveToStorage(principalId, activeRequests);
    }
  }, [activeRequests, principalId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      monitoringIntervalsRef.current.forEach(interval => clearInterval(interval));
      monitoringIntervalsRef.current.clear();
    };
  }, []);

  // =====================
  // Core Methods
  // =====================

  const generateDepositAddress = useCallback(async (
    amount: string,
    maxFeePercentage: number = 1.5
  ): Promise<DepositAddress | null> => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return null;
    }

    if (!tokenConfig) {
      setError('Token configuration not loaded');
      return null;
    }

    if (!authenticatedBackend) {
      setError('Please sign in to create a deposit request');
      return null;
    }

    const numAmount = parseFloat(amount);
    const minAmount = parseFloat(tokenConfig.minimumAmount);
    const maxAmount = parseFloat(tokenConfig.maximumAmount);

    if (numAmount < minAmount || numAmount > maxAmount) {
      setError(`Amount must be between ${minAmount} and ${maxAmount} ckTESTBTC`);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert amount to satoshis (8 decimals)
      const amountSatoshis = BigInt(Math.round(numAmount * 1e8));
      const confirmations = 2;

      // Register boost request with authenticated identity
      const registerResult = await (authenticatedBackend as any).registerBoostRequest(
        amountSatoshis,
        maxFeePercentage,
        BigInt(confirmations),
        [] // no preferred booster
      );

      if ('err' in registerResult) {
        setError(registerResult.err);
        return null;
      }

      const boostRequest = registerResult.ok;
      const boostId = boostRequest.id;

      // Get BTC address
      const addressResult = await (authenticatedBackend as any).getBoostRequestBTCAddress(boostId);

      if ('err' in addressResult) {
        setError(addressResult.err);
        return null;
      }

      const btcAddress = addressResult.ok;
      const blockExplorerUrl = tokenConfig.blockExplorerUrl || 'https://mempool.space/testnet4';

      const depositData: DepositAddress = {
        requestId: boostId.toString(),
        address: btcAddress,
        amount: amount,
        amountRaw: amountSatoshis.toString(),
        explorerUrl: `${blockExplorerUrl}/address/${btcAddress}`,
        confirmationsRequired: confirmations
      };

      setDepositInfo(depositData);

      // Create new request entry
      const newRequest: BoostRequestWithMeta = {
        id: depositData.requestId,
        status: BoostStatus.PENDING,
        amount: depositData.amount,
        receivedAmount: '0',
        maxFeePercentage,
        confirmationsRequired: depositData.confirmationsRequired || 2,
        depositAddress: depositData.address,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdAtLocal: Date.now(),
        updatedAtLocal: Date.now(),
        amountRaw: depositData.amountRaw,
        owner: principalId ?? '',
        explorerUrl: depositData.explorerUrl
      };

      // Add to active requests (prepend)
      setActiveRequests(prev => [newRequest, ...prev]);

      // Start monitoring this request
      startMonitoring(depositData.requestId);

      return depositData;
    } catch (err) {
      console.error('Deposit error:', err);
      setError('Network error. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedBackend, tokenConfig, principalId]);

  const getBoostRequest = useCallback(async (requestId: string): Promise<BoostRequest | null> => {
    try {
      const result = await client.getBoostRequest(requestId);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [client]);

  const getUserRequests = useCallback(async (): Promise<BoostRequest[]> => {
    if (!principalId) return [];

    try {
      const result = await client.getPendingBoostRequests();
      if (result.success) {
        // Filter to only user's requests
        return result.data.filter((req: BoostRequest) => req.owner === principalId);
      }
      return [];
    } catch {
      return [];
    }
  }, [client, principalId]);

  const refreshActiveRequests = useCallback(async (): Promise<void> => {
    if (!principalId) return;

    setIsLoading(true);
    try {
      const userRequests = await getUserRequests();

      // Merge with existing local requests (keep local metadata)
      setActiveRequests(prev => {
        const updated = [...prev];
        for (const req of userRequests) {
          const existingIndex = updated.findIndex(r => r.id === req.id);
          if (existingIndex >= 0) {
            // Update existing request
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...req,
              updatedAtLocal: Date.now()
            };
          } else {
            // Add new request
            updated.unshift({
              ...req,
              createdAtLocal: Date.now(),
              updatedAtLocal: Date.now()
            });
          }
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [principalId, getUserRequests]);

  // =====================
  // Monitoring
  // =====================

  const startMonitoring = useCallback((requestId: string): void => {
    // Don't start if already monitoring
    if (monitoringIntervalsRef.current.has(requestId)) return;

    const interval = setInterval(async () => {
      const result = await client.getBoostRequest(requestId);
      if (result.success) {
        const request = result.data;

        // Update the request in our list
        setActiveRequests(prev =>
          prev.map(r => r.id === requestId ? {
            ...r,
            ...request,
            updatedAtLocal: Date.now()
          } : r)
        );

        // Stop monitoring if completed or cancelled
        if (request.status === BoostStatus.COMPLETED || request.status === BoostStatus.CANCELLED) {
          clearInterval(interval);
          monitoringIntervalsRef.current.delete(requestId);
        }
      }
    }, pollingIntervalMs);

    monitoringIntervalsRef.current.set(requestId, interval);
  }, [client, pollingIntervalMs]);

  const stopMonitoring = useCallback((requestId: string): void => {
    const interval = monitoringIntervalsRef.current.get(requestId);
    if (interval) {
      clearInterval(interval);
      monitoringIntervalsRef.current.delete(requestId);
    }
  }, []);

  const stopAllMonitoring = useCallback((): void => {
    monitoringIntervalsRef.current.forEach(interval => clearInterval(interval));
    monitoringIntervalsRef.current.clear();
  }, []);

  // =====================
  // History
  // =====================

  const getRequestHistory = useCallback((): BoostRequestWithMeta[] => {
    return activeRequests;
  }, [activeRequests]);

  const clearHistory = useCallback((): void => {
    setActiveRequests([]);
    if (principalId) {
      localStorage.removeItem(getStorageKey(principalId));
    }
  }, [principalId]);

  // =====================
  // Utility
  // =====================

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    client,
    tokenConfig,
    isLoading,
    error,
    depositInfo,
    activeRequests,
    generateDepositAddress,
    getBoostRequest,
    getUserRequests,
    startMonitoring,
    stopMonitoring,
    stopAllMonitoring,
    getRequestHistory,
    clearHistory,
    clearError,
    refreshActiveRequests
  };
}

// Re-export types for convenience
export { BoostStatus, CKBoostErrorType } from '@ckboost/client';
export type { BoostRequest, DepositAddress, TokenConfig } from '@ckboost/client';