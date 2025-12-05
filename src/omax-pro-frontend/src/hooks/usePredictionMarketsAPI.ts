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

  // Debug logging
  console.log('Mapping market:', market.id.toString(), market.metadata.title);

  // Safely extract category and tags
  const marketIdString = market.id.toString();
  // Ensure category matches frontend expectations (capitalized for display, but component logic uses IDs usually?)
  // PredictionMarketsPage uses market.category for matching activeCategory (which is lowercase ID).
  // We should probably normalize this. 
  // Let's keep the display name (Capitalized) but maybe we need an ID field?
  // PredictionMarketsPage lines 33: market.category === activeCategory.
  // Active category is from categories array IDs (lowercase).
  // So market.category MUST be lowercase for filtering to work with specific tabs.
  // But wait, the categories array also has 'name' which is capitalized. 
  // Let's store category ID in 'category' for filtering, or fix the page.
  // Current Page logic: market.category is displayed in Badge (wants Capitalized) AND used for filter (wants lowercase). 
  // This is a conflict in the Page logic. 
  // I will make market.category match the ID (lowercase) and assume Badge capitalizes or we add a 'categoryLabel' field?
  // Easier: keep Capitalized, but fix the Page filter. 
  // BUT the user issue is "No markets displayed" which implies ALL markets hidden.
  // 'all' filter bypasses category check. So this isn't the root cause for 'all'.

  const categoryName = mapCategoryToString(market.metadata.category);

  // Safely extract market types
  const keys = Object.keys(market.marketType);
  const marketTypeString = keys.length > 0 ? keys[0].toLowerCase() : 'unknown'; // Normalize to lowercase

  // Placeholder values
  const totalVolumeUSD = '$0';
  const totalVolumeSats = '0 Sats';
  const participants = 0;

  const options: PredictionMarketFrontend['options'] = [];

  // Robust options mapping
  const mt = market.marketType as any; // Cast to bypass strict type checking if definition is lagging

  if (mt.Binary || 'Binary' in mt || keys.includes('Binary')) {
    options.push(
      { id: 'yes', label: 'Yes', percentage: 50, odds: 2.0, color: '#34d399' },
      { id: 'no', label: 'No', percentage: 50, odds: 2.0, color: '#ef4444' }
    );
  } else if (mt.MultipleChoice || 'MultipleChoice' in mt || keys.includes('MultipleChoice')) {
    const outcomes = mt.MultipleChoice?.outcomes || mt.MultipleChoice || [];
    outcomes.forEach((outcome: string, index: number) => {
      options.push({
        id: `option-${index}`,
        label: outcome,
        percentage: 100 / (outcomes.length || 1),
        odds: 1.0,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      });
    });
  } else if (mt.Compound || 'Compound' in mt || keys.includes('Compound')) {
    const subjects = mt.Compound?.subjects || mt.Compound || [];
    subjects.forEach((subject: string, index: number) => {
      options.push({
        id: `subject-${index}`,
        label: subject,
        percentage: 100 / (subjects.length || 1),
        odds: 1.0,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      });
    });
  }

  const tags = market.metadata.tags.map(mapTagToString);

  // Image handling with detailed logging
  console.log('Image data structure:', Object.keys(market.metadata.image), market.metadata.image);

  let image = ''; // Empty string so PredictionCard's fallback logic works

  if ('ImageUrl' in market.metadata.image && (market.metadata.image as any).ImageUrl) {
    image = (market.metadata.image as any).ImageUrl;
    console.log('Using ImageUrl:', image);
  } else if ('ImageBlob' in market.metadata.image) {
    try {
      const blob = (market.metadata.image as any).ImageBlob;
      console.log('ImageBlob found, length:', blob?.length || 0);

      if (blob && blob.length > 0) {
        const bytes = new Uint8Array(blob);

        // Process in chunks to avoid "Maximum call stack size exceeded"
        const chunkSize = 8192;
        let binary = '';
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }

        const base64 = btoa(binary);
        image = `data:image/jpeg;base64,${base64}`;
        console.log('Successfully converted blob to base64, original size:', blob.length, 'base64 length:', base64.length);
      } else {
        console.warn('ImageBlob is empty or invalid');
      }
    } catch (e) {
      console.error('Error converting image blob:', e);
    }
  } else {
    console.log('No valid image data found, using empty string for category fallback');
  }

  return {
    id: marketIdString,
    title: market.metadata.title,
    description: market.metadata.description,
    category: categoryName, // Kept Capitalized
    image: image,
    isActive: Number(market.metadata.expirationTime) > Date.now() * 1_000_000,
    endDate: new Date(Number(market.metadata.expirationTime) / 1_000_000).toISOString(),
    totalVolumeUSD: totalVolumeUSD,
    totalVolumeSats: totalVolumeSats,
    participants: participants,
    marketType: marketTypeString, // Now lowercase 'binary', 'multiplechoice' (fix spelling below)
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