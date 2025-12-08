// src/services/odin-service.ts
import { Actor, HttpAgent } from '@dfinity/agent';

// Odin Trading Canister IDs by environment
export const ODIN_CANISTER_IDS = {
    development: 'w5cxm-6iaaa-aaaaj-az4jq-cai',
    staging: 'z2vm5-gaaaa-aaaaj-azw6q-cai',
    production: 'z2vm5-gaaaa-aaaaj-azw6q-cai',
} as const;

// Use DEVELOPMENT canister ID for testing
export const ODIN_CANISTER_ID = process.env.VITE_ODIN_CANISTER_ID || ODIN_CANISTER_IDS.development;

// Host configuration - FORCE Mainnet to access live Odin canister
const DEFAULT_IC_HOST = 'https://ic0.app';

// Type Definitions
// Documentation: https://docs.odin.fun/quickstart/quickstart-05-token-trading#update-type-definitions
export type TradeType = { buy: null } | { sell: null };
export type TradeAmount = { btc: bigint } | { token: bigint };
export type TradeSettings = {
    slippage: [] | [[bigint, bigint]]; // [expectedPrice, allowedSlippageBasisPoints]
};

export interface TradeRequest {
    tokenid: string;
    typeof: TradeType;
    amount: TradeAmount;
    settings: [] | [TradeSettings];
}

export type TradeResponse =
    | { ok: null }
    | { err: string };

export interface DepositResult {
    newBalance: bigint;
}

// IDL Factory for Odin Canister
const idlFactory = ({ IDL }: { IDL: any }) => {
    const TradeType = IDL.Variant({ buy: IDL.Null, sell: IDL.Null });
    const TradeAmount = IDL.Variant({ btc: IDL.Nat, token: IDL.Nat });
    const TradeSettings = IDL.Record({
        slippage: IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Nat)),
    });
    const TradeRequest = IDL.Record({
        tokenid: IDL.Text,
        typeof: TradeType,
        amount: TradeAmount,
        settings: IDL.Opt(TradeSettings),
    });

    // Deposit result
    const DepositResult = IDL.Record({
        newBalance: IDL.Nat
    });

    const TradeResponse = IDL.Variant({
        ok: IDL.Null,
        err: IDL.Text,
    });

    return IDL.Service({
        token_trade: IDL.Func([TradeRequest], [TradeResponse], []),
        token_deposit: IDL.Func([IDL.Text, IDL.Nat], [DepositResult], []),
    });
};

// Actor Interface
interface OdinActor {
    token_trade: (request: TradeRequest) => Promise<TradeResponse>;
    token_deposit: (tokenId: string, amount: bigint) => Promise<DepositResult>;
}

class OdinService {
    private actor: OdinActor | null = null;
    private agent: HttpAgent | null = null;
    private isInitialized = false;

    async initialize(identity?: any): Promise<void> {
        if (this.isInitialized && this.actor) {
            console.log('[OdinService] Already initialized');
            return;
        }

        try {
            console.log('[OdinService] Initializing...');
            console.log('[OdinService] Canister ID:', ODIN_CANISTER_ID);
            console.log('[OdinService] Host:', DEFAULT_IC_HOST);
            if (identity) {
                console.log('[OdinService] Identity Principal:', identity.getPrincipal().toString());
            } else {
                console.log('[OdinService] No identity provided (anonymous)');
            }

            this.agent = new HttpAgent({
                host: DEFAULT_IC_HOST,
                identity,
            });

            // No root key fetching needed for mainnet (ic0.app)

            this.actor = Actor.createActor<OdinActor>(idlFactory, {
                agent: this.agent,
                canisterId: ODIN_CANISTER_ID,
            }) as unknown as OdinActor; // Explicit cast to help TS

            this.isInitialized = true;
            console.log('[OdinService] Initialized successfully');
        } catch (error) {
            console.error('[OdinService] Failed to initialize:', error);
            throw error;
        }
    }

    private ensureInitialized(): OdinActor {
        if (!this.isInitialized || !this.actor) {
            console.error('[OdinService] Error: Service not initialized');
            throw new Error('Odin Service not initialized. Call initialize() first.');
        }
        return this.actor;
    }

    /**
     * Deposit BTC to the canister for trading
     */
    async depositBTC(tokenId: string, amount: number): Promise<DepositResult> {
        console.group('[OdinService] depositBTC');
        console.log('Input:', { tokenId, amount });

        const actor = this.ensureInitialized();
        // Convert BTC to base units: divisibility (8) + decimals (3) = 10^11
        // See: https://docs.odin.fun/quickstart/quickstart-05-token-trading
        const amountBigInt = BigInt(Math.floor(amount * 100_000_000_000));
        console.log('Converted Amount (base units):', amountBigInt.toString());

        try {
            console.time('deposit_call');
            const result = await actor.token_deposit(tokenId, amountBigInt);
            console.timeEnd('deposit_call');
            console.log('Result:', result);
            console.groupEnd();
            return result;
        } catch (error) {
            console.error('Error executing deposit:', error);
            console.groupEnd();
            throw error;
        }
    }

    /**
     * Buy tokens using BTC
     */
    async buyToken(
        tokenId: string,
        amountBTC: number,
        slippageSettings?: { expectedPrice: number, userSlippage: number, priceImpact: number }
    ): Promise<TradeResponse> {
        console.group('[OdinService] buyToken');
        console.log('Input:', { tokenId, amountBTC, slippageSettings });

        const actor = this.ensureInitialized();
        // Convert BTC to base units: divisibility (8) + decimals (3) = 10^11
        // See: https://docs.odin.fun/quickstart/quickstart-05-token-trading
        const amountBigInt = BigInt(Math.floor(amountBTC * 100_000_000_000));
        console.log('Converted Amount (base units):', amountBigInt.toString());

        // Slippage Calculation
        // https://docs.odin.fun/quickstart/quickstart-05-token-trading#how-slippage-protection-works
        let settings: [] | [TradeSettings] = [];

        if (slippageSettings) {
            const { expectedPrice, userSlippage, priceImpact } = slippageSettings;
            const allowedSlippage = (priceImpact || 0) + userSlippage;

            // Format: [expectedPrice, BigInt(Math.floor(allowedSlippage * 100000))]
            const slippageParam: [bigint, bigint] = [
                BigInt(Math.floor(expectedPrice)), // Assuming price is scaled or just raw? Docs say "expectedPrice".
                // Usually prices on IC are scaled. We pass what we get.
                BigInt(Math.floor(allowedSlippage * 100000))
            ];

            settings = [{ slippage: [slippageParam] }];
            console.log('Slippage Settings Calculated:', {
                allowedSlippage,
                slippageParam: `[${slippageParam[0]}, ${slippageParam[1]}]`
            });
        }

        const request: TradeRequest = {
            tokenid: tokenId,
            typeof: { buy: null },
            amount: { btc: amountBigInt },
            settings: settings,
        };

        console.log('Constructed TradeRequest:', JSON.stringify(request, (_, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value
            , 2));

        try {
            console.time('trade_call');
            const result = await actor.token_trade(request);
            console.timeEnd('trade_call');

            console.log('Trade Result:', result);

            if ('err' in result) {
                console.error('Trade returned error:', result.err);
                if (result.err.includes('No token exists')) {
                    console.warn('[OdinService] TIP: The token ID might differ between the API/UI and the Canister in Development environment. Ensure you are using a token ID that has been created on the dev canister.');
                }
            } else {
                console.log('Trade Successful!');
            }

            console.groupEnd();
            return result;
        } catch (error) {
            console.error('CRITICAL Error executing buy trade:', error);
            console.groupEnd();
            throw error;
        }
    }

    /**
     * Sell tokens for BTC
     */
    async sellToken(
        tokenId: string,
        amountToken: number,
        slippageSettings?: { expectedPrice: number, userSlippage: number, priceImpact: number }
    ): Promise<TradeResponse> {
        console.group('[OdinService] sellToken');
        console.log('Input:', { tokenId, amountToken, slippageSettings });

        const actor = this.ensureInitialized();
        // Convert token amount to base units: divisibility (8) + decimals (3) = 10^11
        // See: https://docs.odin.fun/quickstart/quickstart-05-token-trading
        const amountBigInt = BigInt(Math.floor(amountToken * 100_000_000_000));
        console.log('Converted Amount (base units):', amountBigInt.toString());

        // Slippage Logic (Same as buy)
        let settings: [] | [TradeSettings] = [];
        if (slippageSettings) {
            const { expectedPrice, userSlippage, priceImpact } = slippageSettings;
            const allowedSlippage = (priceImpact || 0) + userSlippage;
            const slippageParam: [bigint, bigint] = [
                BigInt(Math.floor(expectedPrice)),
                BigInt(Math.floor(allowedSlippage * 100000))
            ];
            settings = [{ slippage: [slippageParam] }];
            console.log('Slippage Settings Calculated:', {
                allowedSlippage,
                slippageParam: `[${slippageParam[0]}, ${slippageParam[1]}]`
            });
        }

        const request: TradeRequest = {
            tokenid: tokenId,
            typeof: { sell: null },
            amount: { token: amountBigInt },
            settings: settings,
        };

        console.log('Constructed TradeRequest:', JSON.stringify(request, (_, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value
            , 2));

        try {
            console.time('trade_call');
            const result = await actor.token_trade(request);
            console.timeEnd('trade_call');

            console.log('Trade Result:', result);

            if ('err' in result) {
                console.error('Trade returned error:', result.err);
                if (result.err.includes('No token exists')) {
                    console.warn('[OdinService] TIP: The token ID might differ between the API/UI and the Canister in Development environment. Ensure you are using a token ID that has been created on the dev canister.');
                }
            } else {
                console.log('Trade Successful!');
            }

            console.groupEnd();
            return result;
        } catch (error) {
            console.error('CRITICAL Error executing sell trade:', error);
            console.groupEnd();
            throw error;
        }
    }
}

// Create singleton instance
export const odinService = new OdinService();

// React hook for using Odin service
export const useOdinService = () => {
    return {
        service: odinService,
        initialize: (identity?: any) => odinService.initialize(identity),
    };
};
