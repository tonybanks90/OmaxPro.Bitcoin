import { useQuery } from '@tanstack/react-query';
import type { PredictionMarket, PredictionCategory, APIResponse } from '../types';

const API_BASE = '/api';

// Fetch all prediction markets
export function usePredictionMarkets() {
  return useQuery({
    queryKey: ['prediction-markets'],
    queryFn: async (): Promise<PredictionMarket[]> => {
      const response = await fetch(`${API_BASE}/prediction-markets`);
      if (!response.ok) {
        throw new Error('Failed to fetch prediction markets');
      }
      const data: APIResponse<PredictionMarket[]> = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prediction markets');
      }
      return data.data || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Fetch prediction categories
export function usePredictionCategories() {
  return useQuery({
    queryKey: ['prediction-categories'],
    queryFn: async (): Promise<PredictionCategory[]> => {
      const response = await fetch(`${API_BASE}/prediction-categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch prediction categories');
      }
      const data: APIResponse<PredictionCategory[]> = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prediction categories');
      }
      return data.data || [];
    },
    staleTime: 300000, // 5 minutes
  });
}

// Fetch a specific prediction market
export function usePredictionMarket(id: string) {
  return useQuery({
    queryKey: ['prediction-market', id],
    queryFn: async (): Promise<PredictionMarket> => {
      const response = await fetch(`${API_BASE}/prediction-market/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch prediction market');
      }
      const data: APIResponse<PredictionMarket> = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prediction market');
      }
      if (!data.data) {
        throw new Error('Prediction market not found');
      }
      return data.data;
    },
    staleTime: 30000, // 30 seconds
    enabled: !!id, // Only run query if id is provided
  });
}