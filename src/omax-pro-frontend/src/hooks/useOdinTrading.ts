import { useState } from 'react';
import { odinService } from '../services/odin-service';
import type { TradeResponse, DepositResult } from '../services/odin-service';

export function useOdinTrading() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initialize = async (identity?: any) => {
        setIsLoading(true);
        setError(null);
        try {
            await odinService.initialize(identity);
        } catch (e: any) {
            setError(e.message || 'Failed to initialize');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const depositBTC = async (tokenId: string, amount: number): Promise<DepositResult | null> => {
        setIsLoading(true);
        setError(null);
        try {
            return await odinService.depositBTC(tokenId, amount);
        } catch (e: any) {
            setError(e.message || 'Deposit failed');
            console.error(e);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const buyToken = async (
        tokenId: string,
        amountBTC: number,
        slippageSettings?: { expectedPrice: number, userSlippage: number, priceImpact: number }
    ): Promise<TradeResponse | null> => {
        setIsLoading(true);
        setError(null);
        try {
            return await odinService.buyToken(tokenId, amountBTC, slippageSettings);
        } catch (e: any) {
            setError(e.message || 'Buy failed');
            console.error(e);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const sellToken = async (
        tokenId: string,
        amountToken: number,
        slippageSettings?: { expectedPrice: number, userSlippage: number, priceImpact: number }
    ): Promise<TradeResponse | null> => {
        setIsLoading(true);
        setError(null);
        try {
            return await odinService.sellToken(tokenId, amountToken, slippageSettings);
        } catch (e: any) {
            setError(e.message || 'Sell failed');
            console.error(e);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        depositBTC,
        buyToken,
        sellToken,
        initialize,
        isLoading,
        error
    };
}
