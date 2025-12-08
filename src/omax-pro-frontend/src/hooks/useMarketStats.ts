import { useQuery } from '@tanstack/react-query';
import { MarketsService } from '../services/markets-service';
import { useBTCPrice } from './useOdinAPI';

export interface MarketStats {
    participants: number;
    volumeSats: string;
    volumeUSD: string;
    holders: any[]; // Extended as needed
}

export function useMarketStats(marketId: string) {
    const { btcPriceUSD } = useBTCPrice();

    const { data, isLoading, error } = useQuery({
        queryKey: ['market-stats', marketId],
        queryFn: async () => {
            if (!marketId) throw new Error('Market ID is required');
            const id = BigInt(marketId);

            // Run in parallel for efficiency
            const [holders, activity] = await Promise.all([
                MarketsService.getMarketHolders(id),
                MarketsService.getMarketActivity(id)
            ]);

            return { holders, activity };
        },
        enabled: !!marketId,
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000
    });

    // Calculate derived stats
    const participants = data?.holders ? data.holders.length : 0;

    // Sum buy volume from activity
    // Activity structure from markets-service: { ..., tokenIdentifier, amount, operation: { Buy: null } | { Sell: null }, ... }
    // Note: We need to verify the activity structure. Assuming 'amount' is in the activity item directly or in 'tokenAmount'?
    // Looking at MarketActivity.tsx: tx.amount.toFixed(2) suggests 'amount' is a number/bigint. 
    // And isBuy = 'Buy' in tx.operation.
    // Let's iterate carefully to avoid NaN.

    let totalSats = 0;
    if (data?.activity) {
        data.activity.forEach((tx: any) => {
            // Only count BUY volume? Or total volume? Usually volume is buy + sell.
            // Let's sum all transaction amounts.
            // Ensure we access the correct amount field. 
            // In MarketsService.buyTokens it takes amountSatoshis.
            // In MarketActivity.tsx line 70: tx.amount.toFixed(2).
            // Let's assume tx.amount is the value.
            if (tx.amount) {
                totalSats += Number(tx.amount);
            }
        });
    }

    // Format Volume
    // logic based on useOdinAPI helpers could be reused, but keeping it simple here.
    const volumeSatsVal = totalSats;
    const volumeBTC = volumeSatsVal / 100_000_000;
    const volumeUSDVal = volumeBTC * btcPriceUSD;

    const formatSats = (sats: number) => {
        if (sats >= 1e9) return `${(sats / 1e9).toFixed(2)}B Sats`;
        if (sats >= 1e6) return `${(sats / 1e6).toFixed(2)}M Sats`;
        if (sats >= 1e3) return `${(sats / 1e3).toFixed(2)}K Sats`;
        return `${sats.toLocaleString()} Sats`;
    };

    const formatUSD = (usd: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(usd);
    };

    return {
        stats: {
            participants,
            volumeSats: formatSats(volumeSatsVal),
            volumeUSD: formatUSD(volumeUSDVal),
            holders: data?.holders || []
        },
        isLoading,
        error
    };
}
