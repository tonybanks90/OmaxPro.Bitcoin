import { useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// ckBTC Minter canister interface
const ckBTCMinterIDL = ({ IDL }: any) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  
  const GetBtcAddressArgs = IDL.Record({
    owner: IDL.Opt(IDL.Principal),
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const UpdateBalanceArgs = IDL.Record({
    owner: IDL.Opt(IDL.Principal),
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const RetrieveBtcArgs = IDL.Record({
    address: IDL.Text,
    amount: IDL.Nat64,
  });

  const UpdateBalanceError = IDL.Variant({
    TemporarilyUnavailable: IDL.Text,
    AlreadyProcessing: IDL.Null,
    NoNewUtxos: IDL.Record({
      required_confirmations: IDL.Nat32,
      current_confirmations: IDL.Opt(IDL.Nat32),
    }),
  });

  return IDL.Service({
    get_btc_address: IDL.Func([GetBtcAddressArgs], [IDL.Text], ['query']),
    update_balance: IDL.Func(
      [UpdateBalanceArgs],
      [IDL.Variant({ Ok: IDL.Vec(IDL.Record({ block_index: IDL.Nat64, utxo: IDL.Record({ height: IDL.Nat32, value: IDL.Nat64, outpoint: IDL.Record({ txid: IDL.Vec(IDL.Nat8), vout: IDL.Nat32 }) }) })), Err: UpdateBalanceError })],
      []
    ),
    retrieve_btc: IDL.Func(
      [RetrieveBtcArgs],
      [IDL.Variant({ Ok: IDL.Nat64, Err: IDL.Text })],
      []
    ),
  });
};

interface CkBTCBalance {
  balance: string;
  address: string;
  network: string;
  token: string;
  usdValue: string;
}

interface UseCkBTCIntegrationReturn {
  generateDepositAddress: () => Promise<string>;
  updateBalance: () => Promise<void>;
  withdrawBTC: (address: string, amount: bigint) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  depositAddress: string | null;
}

export const useCkBTCIntegration = (): UseCkBTCIntegrationReturn => {
  const { identity, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);

  // ckBTC Minter canister ID (mainnet)
  const CKBTC_MINTER_CANISTER_ID = 'mqygn-kiaaa-aaaar-qaadq-cai';

  const createActor = useCallback(async () => {
    if (!identity || !isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const agent = new HttpAgent({ 
      identity,
      host: process.env.NODE_ENV === 'production' 
        ? 'https://ic0.app' 
        : 'http://localhost:4943'
    });

    // Fetch root key for local development
    if (process.env.NODE_ENV !== 'production') {
      await agent.fetchRootKey();
    }

    return Actor.createActor(ckBTCMinterIDL, {
      agent,
      canisterId: CKBTC_MINTER_CANISTER_ID,
    });
  }, [identity, isAuthenticated]);

  const generateDepositAddress = useCallback(async (): Promise<string> => {
    if (!isAuthenticated || !identity) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const actor = await createActor();
      const principal = identity.getPrincipal();
      
      const address = await actor.get_btc_address({
        owner: [principal],
        subaccount: [],
      });

      setDepositAddress(address);
      return address;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate deposit address';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createActor, identity, isAuthenticated]);

  const updateBalance = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !identity) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const actor = await createActor();
      const principal = identity.getPrincipal();
      
      const result = await actor.update_balance({
        owner: [principal],
        subaccount: [],
      });

      if ('Err' in result) {
        throw new Error(`Update balance failed: ${JSON.stringify(result.Err)}`);
      }

      // Successfully updated balance
      console.log('Balance updated:', result.Ok);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update balance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createActor, identity, isAuthenticated]);

  const withdrawBTC = useCallback(async (address: string, amount: bigint): Promise<void> => {
    if (!isAuthenticated || !identity) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const actor = await createActor();
      
      const result = await actor.retrieve_btc({
        address,
        amount: Number(amount), // Convert bigint to number for the interface
      });

      if ('Err' in result) {
        throw new Error(`Withdrawal failed: ${result.Err}`);
      }

      console.log('Withdrawal successful, block index:', result.Ok);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw BTC';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createActor, identity, isAuthenticated]);

  return {
    generateDepositAddress,
    updateBalance,
    withdrawBTC,
    isLoading,
    error,
    depositAddress,
  };
};

// Additional utility hook for ckBTC balance management
export const useCkBTCBalance = () => {
  const { identity, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<CkBTCBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ckBTC Ledger canister ID (for balance queries)
  const CKBTC_LEDGER_CANISTER_ID = 'mxzaz-hqaaa-aaaar-qaada-cai';

  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated || !identity) {
      setError('Authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would integrate with the ckBTC ledger canister
      // For now, we'll simulate the balance fetch
      const mockBalance: CkBTCBalance = {
        balance: '0.00123456',
        address: 'bc1q...',
        network: 'internet-computer',
        token: 'ckBTC',
        usdValue: '52.34'
      };

      setBalance(mockBalance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [identity, isAuthenticated]);

  return {
    balance,
    fetchBalance,
    isLoading,
    error,
  };
};