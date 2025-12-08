// src/services/factory-service.ts
// Wrapper service for TFactory that provides category counts and market queries
import { TFactoryActorService } from '../hooks/useTFactoryActor';

// Category icon mapping
export const CATEGORY_MAP: Record<string, { name: string; icon: string; color: string }> = {
    'Runes': { name: 'Runes', icon: '🪨', color: '#FF6B35' },
    'Stocks': { name: 'Stocks', icon: '📈', color: '#4CAF50' },
    'Political': { name: 'Political', icon: '🏛', color: '#3F51B5' },
    'Sports': { name: 'Sports', icon: '⚽', color: '#FF9800' },
    'Entertainment': { name: 'Entertainment', icon: '🎬', color: '#E91E63' },
    'Technology': { name: 'Technology', icon: '💻', color: '#00BCD4' },
    'Crypto': { name: 'Crypto', icon: '₿', color: '#F7931A' },
    'AI': { name: 'AI', icon: '🤖', color: '#9C27B0' },
};

export class FactoryService {
    // Ensure actor is ready before operations
    private static async ensureActor() {
        await TFactoryActorService.ensureReady();
        const actor = TFactoryActorService.getActor();
        if (!actor) {
            throw new Error('TFactory actor not available');
        }
        return actor;
    }

    // Get all markets
    static async getAllMarkets(): Promise<any[]> {
        try {
            const actor = await this.ensureActor();
            return await actor.getAllMarkets();
        } catch (error) {
            console.error('Error fetching all markets:', error);
            return [];
        }
    }

    // Get active markets only
    static async getActiveMarkets(): Promise<any[]> {
        try {
            const actor = await this.ensureActor();
            return await actor.getActiveMarkets();
        } catch (error) {
            console.error('Error fetching active markets:', error);
            return [];
        }
    }

    // Get markets by category
    static async getMarketsByCategory(category: string): Promise<any[]> {
        try {
            const actor = await this.ensureActor();
            // Convert string to variant - use type assertion to avoid TS errors
            const categoryVariant = { [category]: null } as any;
            return await actor.getMarketsByCategory(categoryVariant);
        } catch (error) {
            console.error('Error fetching markets by category:', error);
            return [];
        }
    }

    // Get category counts
    static async getCategoryCounts(): Promise<{ category: string; count: number }[]> {
        try {
            const actor = await this.ensureActor();
            const counts = await actor.getMarketCountByCategory();

            return counts.map(([category, count]: [any, bigint]) => {
                // Extract category name from variant
                const categoryName = Object.keys(category)[0];
                return {
                    category: categoryName,
                    count: Number(count)
                };
            });
        } catch (error) {
            console.error('Error fetching category counts:', error);
            // Return default categories with 0 count on error
            return Object.keys(CATEGORY_MAP).map(cat => ({ category: cat, count: 0 }));
        }
    }

    // Get market info by ID
    static async getMarketInfo(marketId: bigint): Promise<any | null> {
        try {
            const actor = await this.ensureActor();
            const result = await actor.getMarketInfo(marketId);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('Error fetching market info:', error);
            return null;
        }
    }

    // Get market count
    static async getMarketCount(): Promise<number> {
        try {
            const actor = await this.ensureActor();
            const count = await actor.getMarketCount();
            return Number(count);
        } catch (error) {
            console.error('Error fetching market count:', error);
            return 0;
        }
    }

    // Search markets by title/description
    static async searchMarkets(query: string): Promise<any[]> {
        try {
            const markets = await this.getAllMarkets();
            const lowerQuery = query.toLowerCase();
            return markets.filter((market: any) =>
                market.metadata?.title?.toLowerCase().includes(lowerQuery) ||
                market.metadata?.description?.toLowerCase().includes(lowerQuery)
            );
        } catch (error) {
            console.error('Error searching markets:', error);
            return [];
        }
    }
}
