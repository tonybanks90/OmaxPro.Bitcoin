import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Principal } from '@dfinity/principal';





// Cryptocurrency balance queries with real API calls (removed ICP)
const LEDGER_CANISTER_IDS = {
  ckBTC: 'mxzaz-hqaaa-aaaar-qaada-cai',
  ckETH: 'ss2fx-dyaaa-aaaar-qacoq-cai',
  ckTESTBTC: 'mc6ru-gyaaa-aaaar-qaaaq-cai',
  cksepoliaETH: 'apia6-jaaaa-aaaar-qabma-cai',
};

interface ICRCAccount {
  owner: Principal;
  subaccount: [] | [Uint8Array];
}

interface CryptoBalance {
  balance: number;
  error?: string;
}

interface CryptoBalances {
  ckBTC: CryptoBalance;
  ckETH: CryptoBalance;
  ckTESTBTC: CryptoBalance;
  cksepoliaETH: CryptoBalance;
}

async function fetchTokenBalance(
  tokenName: string,
  canisterId: string, 
  account: ICRCAccount
): Promise<CryptoBalance> {
  console.log(`[${tokenName}] Starting balance fetch for canister: ${canisterId}, principal: ${account.owner.toString()}`);
  
  try {
    const agent = new (await import('@dfinity/agent')).HttpAgent({
      host: 'https://ic0.app',
    });

    console.log(`[${tokenName}] Created HTTP agent for IC network`);

    const actor = await import('@dfinity/agent').then(({ Actor }) =>
      Actor.createActor(
        ({ IDL }) => {
          return IDL.Service({
            icrc1_balance_of: IDL.Func([
              IDL.Record({
                owner: IDL.Principal,
                subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
              }),
            ], [IDL.Nat], ['query']),
            icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
          });
        },
        {
          agent,
          canisterId,
        }
      )
    );

    console.log(`[${tokenName}] Created actor for canister interaction`);

    // Prepare the account parameter with proper subaccount handling
    const accountParam = {
      owner: account.owner,
      subaccount: account.subaccount.length > 0 ? [account.subaccount[0]] : [],
    };

    console.log(`[${tokenName}] Account parameter:`, {
      owner: accountParam.owner.toString(),
      subaccount: accountParam.subaccount.length > 0 ? 'provided' : 'empty array',
    });

    const [balance, decimals] = await Promise.all([
      (actor as any).icrc1_balance_of(accountParam),
      (actor as any).icrc1_decimals(),
    ]);

    console.log(`[${tokenName}] Raw balance: ${balance}, decimals: ${decimals}`);

    // Convert balance from smallest unit to token units
    const balanceNumber = Number(balance) / Math.pow(10, Number(decimals));
    
    console.log(`[${tokenName}] Converted balance: ${balanceNumber}`);
    
    return { balance: balanceNumber };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${tokenName}] Failed to fetch balance for canister ${canisterId}:`, error);
    console.error(`[${tokenName}] Error details:`, {
      canisterId,
      principal: account.owner.toString(),
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
    });
    
    return { 
      balance: 0, 
      error: `Failed to fetch ${tokenName} balance: ${errorMessage}` 
    };
  }
}

export function useCryptoBalances(principalId: string) {
  return useQuery<CryptoBalances>({
    queryKey: ['cryptoBalances', principalId],
    queryFn: async () => {
      if (!principalId) {
        console.warn('[CryptoBalances] No principal ID provided');
        throw new Error('Principal ID is required');
      }

      console.log(`[CryptoBalances] Starting balance fetch for all cryptocurrencies, principal: ${principalId}`);

      let principal: Principal;
      try {
        principal = Principal.fromText(principalId);
        console.log(`[CryptoBalances] Successfully parsed principal: ${principal.toString()}`);
      } catch (error) {
        console.error(`[CryptoBalances] Invalid principal ID: ${principalId}`, error);
        throw new Error(`Invalid principal ID: ${principalId}`);
      }

      // Create ICRC account with empty subaccount array (required by canister interface)
      const account: ICRCAccount = { 
        owner: principal, 
        subaccount: [] // Always provide empty array when no subaccount is specified
      };

      console.log(`[CryptoBalances] Created ICRC account with empty subaccount array`);

      try {
        console.log(`[CryptoBalances] Fetching balances for all tokens...`);
        
        const [ckBTC, ckETH, ckTESTBTC, cksepoliaETH] = await Promise.allSettled([
          fetchTokenBalance('ckBTC', LEDGER_CANISTER_IDS.ckBTC, account),
          fetchTokenBalance('ckETH', LEDGER_CANISTER_IDS.ckETH, account),
          fetchTokenBalance('ckTESTBTC', LEDGER_CANISTER_IDS.ckTESTBTC, account),
          fetchTokenBalance('cksepoliaETH', LEDGER_CANISTER_IDS.cksepoliaETH, account),
        ]);

        const results: CryptoBalances = {
          ckBTC: ckBTC.status === 'fulfilled' ? ckBTC.value : { 
            balance: 0, 
            error: `Failed to fetch ckBTC balance: ${ckBTC.status === 'rejected' ? ckBTC.reason : 'Unknown error'}` 
          },
          ckETH: ckETH.status === 'fulfilled' ? ckETH.value : { 
            balance: 0, 
            error: `Failed to fetch ckETH balance: ${ckETH.status === 'rejected' ? ckETH.reason : 'Unknown error'}` 
          },
          ckTESTBTC: ckTESTBTC.status === 'fulfilled' ? ckTESTBTC.value : { 
            balance: 0, 
            error: `Failed to fetch ckTESTBTC balance: ${ckTESTBTC.status === 'rejected' ? ckTESTBTC.reason : 'Unknown error'}` 
          },
          cksepoliaETH: cksepoliaETH.status === 'fulfilled' ? cksepoliaETH.value : { 
            balance: 0, 
            error: `Failed to fetch cksepoliaETH balance: ${cksepoliaETH.status === 'rejected' ? cksepoliaETH.reason : 'Unknown error'}` 
          },
        };

        // Log detailed results for debugging
        Object.entries(results).forEach(([token, result]) => {
          if (result.error) {
            console.error(`[CryptoBalances] ${token} fetch failed:`, result.error);
          } else {
            console.log(`[CryptoBalances] ${token} balance: ${result.balance}`);
          }
        });

        const successCount = Object.values(results).filter(result => !result.error).length;
        const failureCount = Object.values(results).filter(result => result.error).length;
        
        console.log(`[CryptoBalances] Balance fetch completed: ${successCount} successful, ${failureCount} failed`);

        if (failureCount > 0) {
          const failedTokens = Object.entries(results)
            .filter(([_, result]) => result.error)
            .map(([token, result]) => `${token}: ${result.error}`);
          console.warn(`[CryptoBalances] Failed token fetches:`, failedTokens);
        }

        return results;
      } catch (error) {
        console.error('[CryptoBalances] Unexpected error during balance fetching:', error);
        console.error('[CryptoBalances] Error details:', {
          principal: principalId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
        });
        throw new Error(`Balance fetching failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    enabled: !!principalId,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      console.log(`[CryptoBalances] Retry attempt ${failureCount} for error:`, error);
      return failureCount < 2; // Retry up to 2 times
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000); // Exponential backoff, max 30s
      console.log(`[CryptoBalances] Retrying in ${delay}ms`);
      return delay;
    },
  });
}

// Custom ICRC-2 token balance and metadata query
interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

interface CustomTokenBalance {
  balance: number;
  rawBalance: string;
  decimals: number;
}

interface CustomTokenData {
  metadata: TokenMetadata;
  balance: CustomTokenBalance;
}

export function useCustomTokenBalance(principalId: string, canisterId: string) {
  return useQuery<CustomTokenData>({
    queryKey: ['customTokenBalance', principalId, canisterId],
    queryFn: async () => {
      if (!principalId || !canisterId) {
        throw new Error('Principal ID and canister ID are required');
      }

      console.log(`[CustomToken] Starting token information fetch for canister: ${canisterId}, principal: ${principalId}`);

      let principal: Principal;
      try {
        principal = Principal.fromText(principalId);
      } catch (error) {
        throw new Error(`Invalid principal ID: ${principalId}`);
      }

      try {
        const agent = new (await import('@dfinity/agent')).HttpAgent({
          host: 'https://ic0.app',
        });

        const actor = await import('@dfinity/agent').then(({ Actor }) =>
          Actor.createActor(
            ({ IDL }) => {
              return IDL.Service({
                icrc1_balance_of: IDL.Func([
                  IDL.Record({
                    owner: IDL.Principal,
                    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
                  }),
                ], [IDL.Nat], ['query']),
                icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
                icrc1_name: IDL.Func([], [IDL.Text], ['query']),
                icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
              });
            },
            {
              agent,
              canisterId,
            }
          )
        );

        const account = {
          owner: principal,
          subaccount: [],
        };

        console.log(`[CustomToken] Fetching token metadata and balance...`);

        const [balance, decimals, name, symbol] = await Promise.all([
          (actor as any).icrc1_balance_of(account),
          (actor as any).icrc1_decimals(),
          (actor as any).icrc1_name(),
          (actor as any).icrc1_symbol(),
        ]);

        const balanceNumber = Number(balance) / Math.pow(10, Number(decimals));
        
        console.log(`[CustomToken] Token information fetched successfully:`, {
          name,
          symbol,
          decimals: Number(decimals),
          balance: balanceNumber,
        });
        
        return {
          metadata: {
            name,
            symbol,
            decimals: Number(decimals),
          },
          balance: {
            balance: balanceNumber,
            rawBalance: balance.toString(),
            decimals: Number(decimals),
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[CustomToken] Failed to fetch token information:`, error);
        throw new Error(`Failed to fetch token information: ${errorMessage}`);
      }
    },
    enabled: !!principalId && !!canisterId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
