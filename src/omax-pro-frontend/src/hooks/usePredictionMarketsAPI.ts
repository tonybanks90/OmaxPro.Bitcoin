// src/hooks/usePredictionMarketsAPI.ts
import { useQuery } from '@tanstack/react-query';
import { icService } from '../services/ic-service';
import type { MarketInfo, Category, Tag } from '../../../declarations/TFactory/TFactory.did'; // Adjust path as needed

// Define your frontend-specific types
interface PredictionMarketFrontend {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string; // URL or a placeholder
  isActive: boolean;
  endDate: string; // ISO string for easy parsing
  totalVolumeUSD: string; // Formatted string
  totalVolumeSats: string; // Formatted string
  participants: number;
  marketType: string; // e.g., "binary", "multiple_choice"
  options: {
    id: string;
    label: string;
    percentage: number;
    odds: number;
    color: string;
  }[];
  tags: string[];
}

interface PredictionCategoryFrontend {
  id: string; // Lowercase category name
  name: string; // Capitalized category name
  count: number;
}

// Helper to map IC's Category to a string
const mapCategoryToString = (category: Category): string => {
  return Object.keys(category)[0];
};

// Helper to map IC's Tag to a string
const mapTagToString = (tag: Tag): string => {
  return Object.keys(tag)[0];
};

// Helper to map IC's MarketInfo to your frontend type
const mapMarketInfoToFrontend = (market: MarketInfo): PredictionMarketFrontend => {
  // This is a placeholder for actual data mapping.
  // You'll need to extract actual data from market.metadata, market.tokens, etc.
  // and potentially fetch more details like volume and participants from other canisters
  // if they are not directly available in MarketInfo.

  const marketIdString = market.id.toString();
  const categoryName = mapCategoryToString(market.metadata.category);
  const marketTypeString = Object.keys(market.marketType)[0];

  // Placeholder values - you'll need to implement logic to get these
  const totalVolumeUSD = '$0';
  const totalVolumeSats = '0 Sats';
  const participants = 0;

  const options: PredictionMarketFrontend['options'] = [];
  // Logic to map marketType and market.tokens to frontend options
  if ('Binary' in market.marketType) {
    // Assuming market.tokens contains { Binary: { yesLedger: Principal, noLedger: Principal } }
    // You'd need to fetch percentages and odds from these ledgers.
    options.push(
      { id: 'yes', label: 'Yes', percentage: 50, odds: 2.0, color: '#34d399' },
      { id: 'no', label: 'No', percentage: 50, odds: 2.0, color: '#ef4444' }
    );
  } else if ('MultipleChoice' in market.marketType) {
    // Similar logic for multiple choice markets
    market.marketType.MultipleChoice.outcomes.forEach((outcome, index) => {
      options.push({
        id: `option-${index}`,
        label: outcome,
        percentage: 100 / market.marketType.MultipleChoice.outcomes.length, // Placeholder
        odds: 1.0, // Placeholder
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color placeholder
      });
    });
  } else if ('Compound' in market.marketType) {
    // Logic for compound markets
    market.marketType.Compound.subjects.forEach((subject, index) => {
      options.push({
        id: `subject-${index}`,
        label: subject,
        percentage: 100 / market.marketType.Compound.subjects.length, // Placeholder
        odds: 1.0, // Placeholder
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color placeholder
      });
    });
  }

  const tags = market.metadata.tags.map(mapTagToString);

  // Image handling: You'll need to check if market.metadata.image is ImageUrl or ImageBlob
  // and construct the appropriate URL or handle the blob.
  const image = 'ImageUrl' in market.metadata.image ? market.metadata.image.ImageUrl : '/placeholder-image.svg'; // Default placeholder

  return {
    id: marketIdString,
    title: market.metadata.title,
    description: market.metadata.description,
    category: categoryName,
    image: image,
    isActive: Number(market.metadata.expirationTime) > Date.now() * 1_000_000, // Basic check, may need refinement
    endDate: new Date(Number(market.metadata.expirationTime) / 1_000_000).toISOString(),
    totalVolumeUSD: totalVolumeUSD,
    totalVolumeSats: totalVolumeSats,
    participants: participants,
    marketType: marketTypeString,
    options: options,
    tags: tags,
  };
};

// Fetch all prediction markets
export function usePredictionMarkets() {
  return useQuery<PredictionMarketFrontend[], Error>({ // Specify return type
    queryKey: ['prediction-markets'],
    queryFn: async (): Promise<PredictionMarketFrontend[]> => {
      await icService.initialize(); // Ensure service is initialized
      const rawMarkets = await icService.getAllMarkets();
      // Map the raw MarketInfo from the canister to your frontend's PredictionMarket type
      const mappedMarkets = rawMarkets.map(mapMarketInfoToFrontend);
      return mappedMarkets;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    // The previous APIResponse structure is no longer needed as icService handles errors
  });
}

// Fetch prediction categories
export function usePredictionCategories() {
  return useQuery<PredictionCategoryFrontend[], Error>({ // Specify return type
    queryKey: ['prediction-categories'],
    queryFn: async (): Promise<PredictionCategoryFrontend[]> => {
      await icService.initialize(); // Ensure service is initialized
      const rawCategories = await icService.getMarketCountByCategory();

      // Map the raw categories to your frontend type
      const formattedCategories: PredictionCategoryFrontend[] = rawCategories.map(([category, count]) => ({
        id: mapCategoryToString(category).toLowerCase(),
        name: mapCategoryToString(category),
        count: Number(count), // Ensure count is a number
      }));

      // Add an 'all' category for the UI
      const totalCount = formattedCategories.reduce((sum, cat) => sum + cat.count, 0);
      return [{ id: 'all', name: 'All', count: totalCount }, ...formattedCategories];
    },
    staleTime: 300000, // 5 minutes
  });
}

// Fetch a specific prediction market
export function usePredictionMarket(id: string) {
  return useQuery<PredictionMarketFrontend, Error>({ // Specify return type
    queryKey: ['prediction-market', id],
    queryFn: async (): Promise<PredictionMarketFrontend> => {
      if (!id) {
        throw new Error('Market ID is required');
      }
      await icService.initialize(); // Ensure service is initialized

      // The IC service returns MarketInfo, which needs to be mapped
      const marketInfo = await icService.getMarketInfo(BigInt(id)); // IC expects bigint for ID

      if (!marketInfo) {
        throw new Error('Prediction market not found');
      }

      // Map the fetched MarketInfo to your frontend type
      return mapMarketInfoToFrontend(marketInfo);
    },
    staleTime: 30000, // 30 seconds
    enabled: !!id, // Only run query if id is provided
  });
}