
import { useQuery } from '@tanstack/react-query';
import { usePredictionMarkets } from './usePredictionMarketsAPI';
import { MarketsService } from '../services/markets-service';
import { useBTCPrice } from './useOdinAPI';

export function useGlobalStats() {
    const { data: markets = [] } = usePredictionMarkets();
    const { btcPriceUSD } = useBTCPrice();

    return useQuery({
        queryKey: ['global-market-stats', markets.map(m => m.id).join(',')],
        queryFn: async () => {
            if (markets.length === 0) return {
                totalVolumeUSD: '$0',
                activeMarkets: 0,
                totalParticipants: 0,
                resolvingToday: 0
            };

            // Calculate simple stats from the list
            const activeMarkets = markets.filter(m => m.isActive).length;

            const today = new Date();
            const resolvingToday = markets.filter(m => {
                const endDate = new Date(m.endDate);
                return endDate.getDate() === today.getDate() &&
                    endDate.getMonth() === today.getMonth() &&
                    endDate.getFullYear() === today.getFullYear();
            }).length;

            // Fetch heavy stats (volume & participants) for ALL markets
            // We use Promise.allSettled to avoid failing everything if one market fails
            const statsPromises = markets.map(async (market) => {
                try {
                    const id = BigInt(market.id);
                    const [holders, activity] = await Promise.all([
                        MarketsService.getMarketHolders(id),
                        MarketsService.getMarketActivity(id)
                    ]);

                    // Calculate volume (sum of amounts in activity)
                    let marketVolumeSats = 0;
                    activity.forEach((tx: any) => {
                        if (tx.amount) marketVolumeSats += Number(tx.amount);
                    });

                    // Count participants
                    const participantCount = holders.length;

                    return { volumeSats: marketVolumeSats, participants: participantCount };

                } catch (e) {
                    console.error(`Failed to fetch stats for market ${market.id}`, e);
                    return { volumeSats: 0, participants: 0 };
                }
            });

            const results = await Promise.all(statsPromises);

            // Aggregate
            let totalSats = 0;
            let totalParticipants = 0;

            results.forEach(r => {
                totalSats += r.volumeSats;
                totalParticipants += r.participants;
            });

            // Format
            const totalBTC = totalSats / 100_000_000;
            const totalUSD = totalBTC * btcPriceUSD;

            const formatUSD = (val: number) => {
                if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
                if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
                return `$${val.toFixed(2)}`;
            };

            return {
                totalVolumeUSD: formatUSD(totalUSD),
                activeMarkets,
                totalParticipants,
                resolvingToday
            };
        },
        enabled: markets.length > 0 && btcPriceUSD > 0,
        staleTime: 60000,
    });
}
