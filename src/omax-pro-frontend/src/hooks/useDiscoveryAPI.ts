import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type {
  CryptoAsset,
  StockAsset,
  SportsEvent,
  WeatherData,
  DiscoveryAsset,
} from "@shared/schema";

// API Response types
export interface DiscoveryAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TrendingAsset extends DiscoveryAsset {}

export interface CategoryStats {
  category: string;
  total: number;
  trending?: number;
  lastUpdated: string;
}

// Hook for fetching top cryptocurrency data directly from CoinGecko
export const useCryptoData = (limit: number = 100) => {
  return useQuery({
    queryKey: ["crypto", limit],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
      );
      if (!response.ok) throw new Error("Failed to fetch crypto data from CoinGecko");
      
      const data = await response.json();
      
      // Transform CoinGecko data to CryptoAsset format
      const cryptoAssets: CryptoAsset[] = data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        currentPrice: coin.current_price || 0,
        marketCap: coin.market_cap || 0,
        marketCapRank: coin.market_cap_rank || 0,
        fullyDilutedValuation: coin.fully_diluted_valuation,
        totalVolume: coin.total_volume || 0,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercentage24h: coin.price_change_percentage_24h || 0,
        marketCapChange24h: coin.market_cap_change_24h,
        marketCapChangePercentage24h: coin.market_cap_change_percentage_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath,
        athChangePercentage: coin.ath_change_percentage,
        athDate: coin.ath_date,
        atl: coin.atl,
        atlChangePercentage: coin.atl_change_percentage,
        atlDate: coin.atl_date,
        lastUpdated: coin.last_updated || new Date().toISOString()
      }));
      
      return cryptoAssets;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Hook for fetching top stock data
export const useStockData = (symbols?: string[]) => {
  return useQuery({
    queryKey: ["stocks", symbols?.join(",") || "all"],
    queryFn: async () => {
      const url = symbols?.length
        ? `/api/discovery/stocks?symbols=${symbols.join(",")}`
        : `/api/discovery/stocks`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch stock data");
      const result: DiscoveryAPIResponse<StockAsset[]> = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch stock data");
      return result.data || [];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Hook for fetching trending stocks
export const useTrendingStocks = () => {
  return useQuery({
    queryKey: ["stocks", "trending"],
    queryFn: async () => {
      const response = await fetch("/api/discovery/stocks/trending");
      if (!response.ok) throw new Error("Failed to fetch trending stocks");
      const result: DiscoveryAPIResponse<StockAsset[]> = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch trending stocks");
      return result.data || [];
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 900000, // Refetch every 15 minutes
  });
};

// Hook for fetching sports events
export const useSportsEvents = (sport?: string, league?: string) => {
  return useQuery({
    queryKey: ["sports", sport || "all", league || "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sport) params.append("sport", sport);
      if (league) params.append("league", league);

      const response = await fetch(`/api/discovery/sports?${params}`);
      if (!response.ok) throw new Error("Failed to fetch sports events");
      const result: DiscoveryAPIResponse<SportsEvent[]> = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch sports events");
      return result.data || [];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 180000, // Refetch every 3 minutes
  });
};

// Hook for fetching weather data by location
export const useWeatherData = (
  latitude: number,
  longitude: number,
  location: string,
) => {
  return useQuery({
    queryKey: ["weather", `${latitude},${longitude}`],
    queryFn: async () => {
      const response = await fetch(
        `/api/discovery/weather?lat=${latitude}&lon=${longitude}&location=${encodeURIComponent(location)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch weather data");
      const result: DiscoveryAPIResponse<WeatherData> = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch weather data");
      return result.data;
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  });
};

// Hook for fetching popular locations weather
export const usePopularWeather = () => {
  return useQuery({
    queryKey: ["weather", "popular"],
    queryFn: async () => {
      const response = await fetch("/api/discovery/weather/popular");
      if (!response.ok) throw new Error("Failed to fetch popular weather");
      const result: DiscoveryAPIResponse<WeatherData[]> = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch popular weather");
      return result.data || [];
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  });
};

// Hook for searching assets across all categories
export const useDiscoverySearch = (query: string, category?: string) => {
  return useQuery({
    queryKey: ["search", query, category || "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("q", query);
      if (category) params.append("category", category);

      const response = await fetch(`/api/discovery/search?${params}`);
      if (!response.ok) throw new Error("Failed to search");
      const result: DiscoveryAPIResponse<TrendingAsset[]> =
        await response.json();
      if (!result.success) throw new Error(result.error || "Failed to search");
      return result.data || [];
    },
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 60000, // 1 minute
  });
};

// Hook for getting asset details by ID and category
export const useAssetDetails = (id: string, category: string) => {
  return useQuery({
    queryKey: ["asset", category, id],
    queryFn: async () => {
      const response = await fetch(`/api/discovery/${category}/${id}`);
      if (!response.ok) throw new Error("Failed to fetch asset details");
      const result: DiscoveryAPIResponse<TrendingAsset> = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch asset details");
      return result.data;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Hook for refreshing data from external APIs
export const useRefreshDiscoveryData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest(
        "POST",
        `/api/discovery/refresh/${category}`,
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (_, category) => {
      // Invalidate specific category queries
      queryClient.invalidateQueries({ queryKey: [category] });
      queryClient.invalidateQueries({ queryKey: ["trending"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};

// Hook for trending assets across all categories
export const useTrendingAssets = () => {
  return useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const response = await fetch("/api/discovery/trending");
      if (!response.ok) throw new Error("Failed to fetch trending assets");
      const result: DiscoveryAPIResponse<TrendingAsset[]> =
        await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch trending assets");
      return result.data || [];
    },
    staleTime: 180000, // 3 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Hook for category stats and summaries
export const useCategoryStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await fetch("/api/discovery/stats");
      if (!response.ok) throw new Error("Failed to fetch category stats");
      const result: DiscoveryAPIResponse<CategoryStats[]> =
        await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch category stats");
      return result.data || [];
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  });
};
