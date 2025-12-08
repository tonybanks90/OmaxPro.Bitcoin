// src/services/markets-service.ts
import { MarketsActorService } from '../hooks/useMarketsActor';

export class MarketsService {
    // Ensure actor is ready before operations
    private static async ensureActor(identity?: any) {
        if (identity) {
            MarketsActorService.authenticate(identity);
        }

        await MarketsActorService.ensureReady();

        const actor = MarketsActorService.getActor();
        if (!actor) {
            throw new Error('Markets actor not available');
        }

        return actor;
    }

    // Buy tokens in a market
    static async buyTokens(
        marketId: bigint,
        tokenIdentifier: any, // TokenIdentifier from declarations
        amountSatoshis: bigint,
        maxSlippage: number,
        identity?: any // Optional: Pass identity directly to avoid agent extraction issues
    ): Promise<any> {
        const actor = await this.ensureActor(identity);

        console.log('Buying tokens:', {
            marketId: marketId.toString(),
            tokenIdentifier,
            amountSatoshis: amountSatoshis.toString(),
            maxSlippage
        });

        // Just-in-Time Approval: Check allowance and approve if needed
        try {
            await this.ensureVaultApproved(amountSatoshis, identity);
        } catch (approvalError) {
            console.error('Failed to ensure Vault approval:', approvalError);
            throw new Error(`Approval failed: ${approvalError}`);
        }

        try {
            const result = await actor.buyTokens(
                marketId,
                tokenIdentifier,
                amountSatoshis,
                maxSlippage
            );

            if ('err' in result) {
                throw new Error(`Failed to buy tokens: ${result.err}`);
            }

            console.log('Tokens purchased successfully:', result.ok);
            return result.ok;
        } catch (error) {
            console.error('Error buying tokens:', error);
            throw error;
        }
    }

    private static async ensureVaultApproved(amount: bigint, providedIdentity?: any) {
        const { LedgerActorService } = await import('../hooks/useLedgerActor');
        const { Principal } = await import('@dfinity/principal');
        const { Actor } = await import('@dfinity/agent');

        // Ensure Markets actor is ready (which means user is authenticated there)
        const marketsActor = await this.ensureActor();

        let identity = providedIdentity;

        if (!identity) {
            // Fallback: Extract identity from Markets actor to use for Ledger
            const agent = Actor.agentOf(marketsActor);
            // Cast to any because Agent type definition might not expose getIdentity directly in this version
            identity = (agent as any)?.getIdentity();

            if (!identity) {
                throw new Error('Could not derive identity from Markets actor');
            }
        }

        // Initialize Ledger Service with this identity
        // We must authenticate it so it acts as the USER
        LedgerActorService.authenticate(identity);
        await LedgerActorService.ensureReady();

        const ledger = LedgerActorService.getActor();

        if (!ledger) {
            console.warn('Ledger actor not available for approval check');
            return;
        }

        const VAULT_CANISTER_ID = 'umunu-kh777-77774-qaaca-cai';
        const vaultPrincipal = Principal.fromText(VAULT_CANISTER_ID);

        console.log(`Approving Vault (${VAULT_CANISTER_ID}) to spend ${amount} ckBTC...`);

        // Approve slightly more than needed to cover ICRC transfer fees (typically 10 sats)
        const approvalAmount = amount + BigInt(100); // Add 100 sat buffer for fees

        const result = await ledger.icrc2_approve({
            amount: approvalAmount,
            spender: { owner: vaultPrincipal, subaccount: [] },
            fee: [],
            memo: [],
            from_subaccount: [],
            created_at_time: [],
            expected_allowance: [],
            expires_at: []
        });

        if ('Err' in result) {
            const errorString = JSON.stringify(result.Err, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
            );
            throw new Error(`Ledger approval failed: ${errorString}`);
        }

        console.log('Approval successful:', result.Ok);
    }

    // Sell tokens in a market
    static async sellTokens(
        marketId: bigint,
        tokenIdentifier: any,
        tokenAmount: bigint,
        minReceived: bigint
    ): Promise<any> {
        const actor = await this.ensureActor();

        console.log('Selling tokens:', {
            marketId: marketId.toString(),
            tokenIdentifier,
            tokenAmount: tokenAmount.toString(),
            minReceived: minReceived.toString()
        });

        try {
            const result = await actor.sellTokens(
                marketId,
                tokenIdentifier,
                tokenAmount,
                minReceived
            );

            if ('err' in result) {
                throw new Error(`Failed to sell tokens: ${result.err}`);
            }

            console.log('Tokens sold successfully:', result.ok);
            return result.ok;
        } catch (error) {
            console.error('Error selling tokens:', error);
            throw error;
        }
    }

    // Get market price for a token
    static async getMarketPrice(
        marketId: bigint,
        tokenIdentifier: any
    ): Promise<number> {
        const actor = await this.ensureActor();

        try {
            const result = await actor.getMarketPrice(marketId, tokenIdentifier);

            if ('err' in result) {
                throw new Error(`Failed to get market price: ${result.err}`);
            }

            return result.ok;
        } catch (error) {
            console.error('Error getting market price:', error);
            throw error;
        }
    }

    // Note: getUserBalance is not implemented in Markets canister
    // Token balances should be queried directly from the token ledger using icrc1_balance_of
    // static async getUserBalance(
    //     marketId: bigint,
    //     tokenIdentifier: any,
    //     user: Principal
    // ): Promise<bigint> {
    //     const actor = await this.ensureActor();
    //     try {
    //         const balance = await actor.getUserBalance(marketId, tokenIdentifier, user);
    //         return balance;
    //     } catch (error) {
    //         console.error('Error getting user balance:', error);
    //         throw error;
    //     }
    // }

    // Get market activity
    static async getMarketActivity(marketId: bigint): Promise<any[]> {
        const actor = await this.ensureActor();
        try {
            const result = await actor.getMarketActivity(marketId);

            if ('err' in result) {
                console.warn(`Failed to get activity: ${result.err}`);
                return [];
            }

            return result.ok;
        } catch (error) {
            console.error('Error getting market activity:', error);
            return [];
        }
    }

    // Get market holders
    static async getMarketHolders(marketId: bigint): Promise<any[]> {
        const actor = await this.ensureActor();
        try {
            const result = await actor.getMarketHolders(marketId);

            if ('err' in result) {
                console.warn(`Failed to get holders: ${result.err}`);
                return [];
            }

            return result.ok;
        } catch (error) {
            console.error('Error getting market holders:', error);
            return [];
        }
    }

    // Get market info (uses getMarket from Markets canister)
    static async getMarketInfo(marketId: bigint): Promise<any> {
        const actor = await this.ensureActor();

        try {
            const result = await actor.getMarket(marketId);

            if ('err' in result) {
                console.warn(`Failed to get market: ${result.err}`);
                return null;
            }

            return result.ok;
        } catch (error) {
            console.error('Error getting market info:', error);
            throw error;
        }
    }
}
