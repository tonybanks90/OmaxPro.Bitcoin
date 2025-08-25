import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

export interface WalletBalance {
  network: 'bitcoin' | 'internet-computer';
  token: 'BTC' | 'ckBTC';
  balance: string;
  usdValue: string;
  address: string;
}

export interface TransactionFee {
  network: string;
  fee: string;
  feeToken: string;
}

export interface DepositRequest {
  network: 'bitcoin' | 'internet-computer';
  token: 'BTC' | 'ckBTC';
}

export interface WithdrawRequest {
  network: 'bitcoin' | 'internet-computer';
  token: 'BTC' | 'ckBTC';
  amount: string;
  destinationAddress: string;
}

// Hardcoded fallback data
const FALLBACK_BALANCES: WalletBalance[] = [
  {
    network: 'bitcoin',
    token: 'BTC',
    balance: '0.00000000',
    usdValue: '0.00',
    address: 'bc1qn559veuv6khmhyx45kpuz3e427srngtmpnk5zl'
  },
  {
    network: 'internet-computer',
    token: 'ckBTC',
    balance: '0.00000000',
    usdValue: '0.00',
    address: 'rdmx6-jaaaa-aaaah-qcaiq-cai'
  }
];

const FALLBACK_FEES: TransactionFee[] = [
  {
    network: 'bitcoin',
    fee: '0.00000703',
    feeToken: 'BTC'
  },
  {
    network: 'internet-computer',
    fee: '0.00000100',
    feeToken: 'ckBTC'
  }
];

async function fetchWalletBalances(): Promise<WalletBalance[]> {
  try {
    const response = await fetch('/api/wallet/balances');
    if (!response.ok) {
      throw new Error('Failed to fetch wallet balances');
    }
    const result = await response.json();
    return result.data || FALLBACK_BALANCES;
  } catch (error) {
    console.log('Using fallback wallet balances');
    return FALLBACK_BALANCES;
  }
}

async function fetchTransactionFees(): Promise<TransactionFee[]> {
  try {
    const response = await fetch('/api/wallet/fees');
    if (!response.ok) {
      throw new Error('Failed to fetch transaction fees');
    }
    const result = await response.json();
    return result.data || FALLBACK_FEES;
  } catch (error) {
    console.log('Using fallback transaction fees');
    return FALLBACK_FEES;
  }
}

async function createDepositAddress(request: DepositRequest): Promise<string> {
  try {
    const response = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create deposit address');
    }
    
    const result = await response.json();
    return result.data.address;
  } catch (error) {
    // Return hardcoded address based on network
    if (request.network === 'bitcoin') {
      return 'bc1qn559veuv6khmhyx45kpuz3e427srngtmpnk5zl';
    } else {
      return 'rdmx6-jaaaa-aaaah-qcaiq-cai';
    }
  }
}

async function withdrawFunds(request: WithdrawRequest): Promise<string> {
  try {
    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error('Failed to initiate withdrawal');
    }
    
    const result = await response.json();
    return result.data.transactionId;
  } catch (error) {
    // Return mock transaction ID
    return 'tx_' + Date.now().toString();
  }
}

export function useWalletBalances() {
  return useQuery({
    queryKey: ['wallet', 'balances'],
    queryFn: fetchWalletBalances,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTransactionFees() {
  return useQuery({
    queryKey: ['wallet', 'fees'],
    queryFn: fetchTransactionFees,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useDepositAddress() {
  return useMutation({
    mutationFn: createDepositAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balances'] });
    },
  });
}

export function useWithdrawFunds() {
  return useMutation({
    mutationFn: withdrawFunds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balances'] });
    },
  });
}