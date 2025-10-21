// src/services/ic-service.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
// Try different import patterns - uncomment the one that works for your setup

// Option 1: Direct import from .did.js file
// import { idlFactory } from '../../../declarations/TFactory/TFactory.did.js';

// Option 2: Import from index file
// import { idlFactory } from '../../../declarations/TFactory/index.js';

// Option 3: Import from the main declaration (most common)
import { idlFactory, canisterId } from '../../../declarations/TFactory';

// Option 4: If you have a custom setup
// import { TFactory } from '../../../declarations/TFactory';
// const idlFactory = TFactory.idlFactory;

import type { _SERVICE } from '../../../declarations/TFactory/TFactory.did';
import type {
  CreateBinaryMarketArgs,
  CreateMultipleChoiceMarketArgs,
  CreateCompoundMarketArgs,
  Category,
  Tag,
  ImageData,
  MarketInfo,
  MarketId
} from '../../../declarations/TFactory/TFactory.did';

// Configure your canister ID here
const CANISTER_ID = process.env.VITE_PREDICTION_MARKET_FACTORY_CANISTER_ID || canisterId || 'fevvw-ryaaa-aaaai-atl6q-cai';

// Configure network
const HOST = process.env.NODE_ENV === 'production' 
  ? 'https://ic0.app' 
  : 'http://localhost:4943';

// Service state interface
interface ServiceState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
}

class ICService {
  private actor: _SERVICE | null = null;
  private agent: HttpAgent | null = null;
  private state: ServiceState = {
    isInitialized: false,
    isInitializing: false,
    error: null
  };

  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      console.log('IC Service already initialized');
      return;
    }

    if (this.state.isInitializing) {
      console.log('IC Service initialization in progress');
      return;
    }

    this.state.isInitializing = true;
    this.state.error = null;

    try {
      console.log('Initializing IC Service...');
      console.log('Canister ID:', CANISTER_ID);
      console.log('Host:', HOST);

      this.agent = new HttpAgent({ 
        host: HOST,
        // Only fetch root key in development
        ...(process.env.NODE_ENV === 'development' && { fetchRootKey: true })
      });

      // Fetch root key for local development
      if (process.env.NODE_ENV === 'development') {
        await this.agent.fetchRootKey();
        console.log('Root key fetched for local development');
      }

      this.actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent: this.agent,
        canisterId: CANISTER_ID,
      });

      // Test connection by calling a simple method
      await this.actor.hasWasm();

      this.state.isInitialized = true;
      this.state.isInitializing = false;
      console.log('IC Service initialized successfully');
    } catch (error) {
      this.state.isInitializing = false;
      this.state.error = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('Failed to initialize IC Service:', error);
      throw error;
    }
  }

  getState(): ServiceState {
    return { ...this.state };
  }

  private ensureInitialized(): _SERVICE {
    if (!this.state.isInitialized || !this.actor) {
      throw new Error('IC Service not initialized. Call initialize() first.');
    }
    return this.actor;
  }

  // Map UI category to canister Category
  private mapCategory(category: string): Category {
    const categoryMap: Record<string, Category> = {
      'sports': { 'Sports': null },
      'politics': { 'Political': null },
      'crypto': { 'Crypto': null },
      'tech': { 'Technology': null },
      'technology': { 'Technology': null },
      'entertainment': { 'Entertainment': null },
      'ai': { 'AI': null },
      'runes': { 'Runes': null },
    };
    
    const mapped = categoryMap[category.toLowerCase()];
    if (!mapped) {
      console.warn(`Unknown category: ${category}, defaulting to Technology`);
      return { 'Technology': null };
    }
    return mapped;
  }

  // Map UI tags to canister Tags
  private mapTags(tags: string[]): Tag[] {
    const tagMap: Record<string, Tag> = {
      'sports': { 'Sports': null },
      'political': { 'Political': null },
      'politics': { 'Political': null },
      'crypto': { 'Crypto': null },
      'tech': { 'Technology': null },
      'technology': { 'Technology': null },
      'entertainment': { 'Entertainment': null },
      'ai': { 'AI': null },
      'runes': { 'Runes': null },
      'web2': { 'web2': null },
    };
    
    return tags.map(tag => {
      const mapped = tagMap[tag.toLowerCase()];
      if (!mapped) {
        console.warn(`Unknown tag: ${tag}, defaulting to Technology`);
        return { 'Technology': null };
      }
      return mapped;
    });
  }

  // Convert image URL to ImageData
  private mapImageData(imageUrl?: string): ImageData {
    if (!imageUrl) {
      return { 'ImageUrl': '' };
    }
    
    // If it's a data URL (base64), convert to blob
    if (imageUrl.startsWith('data:')) {
      try {
        const base64 = imageUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        console.log(`Converting image to blob: ${bytes.length} bytes`);
        return { 'ImageBlob': Array.from(bytes) };
      } catch (error) {
        console.warn('Failed to convert base64 image:', error);
        return { 'ImageUrl': '' };
      }
    }
    
    return { 'ImageUrl': imageUrl };
  }

  // Convert date string to nanosecond timestamp
  private dateToNanoseconds(dateString: string): bigint {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    return BigInt(date.getTime() * 1_000_000); // Convert ms to ns
  }

  // Validate market creation data
  private validateMarketData(data: {
    title: string;
    description: string;
    category: string;
    endDate: string;
    expirationTime: string;
    resolutionLink: string;
  }): void {
    if (!data.title.trim()) throw new Error('Title is required');
    if (!data.description.trim()) throw new Error('Description is required');
    if (!data.category.trim()) throw new Error('Category is required');
    if (!data.endDate) throw new Error('End date is required');
    if (!data.expirationTime) throw new Error('Expiration time is required');
    if (!data.resolutionLink) throw new Error('Resolution link is required');

    // Validate dates
    const endDate = new Date(data.endDate);
    const expirationDate = new Date(data.expirationTime);
    const now = new Date();

    if (endDate <= now) {
      throw new Error('End date must be in the future');
    }
    if (expirationDate <= endDate) {
      throw new Error('Expiration time must be after end date');
    }

    // Validate URL
    try {
      new URL(data.resolutionLink);
    } catch {
      throw new Error('Resolution link must be a valid URL');
    }
  }

  async createBinaryMarket(data: {
    title: string;
    description: string;
    category: string;
    endDate: string;
    expirationTime: string;
    resolutionLink: string;
    resolutionDescription: string;
    tags: string[];
    imageUrl?: string;
  }): Promise<MarketId> {
    const actor = this.ensureInitialized();
    this.validateMarketData(data);

    console.log('Creating binary market:', data.title);

    const args: CreateBinaryMarketArgs = {
      title: data.title,
      description: data.description,
      category: this.mapCategory(data.category),
      bettingCloseTime: this.dateToNanoseconds(data.endDate),
      expirationTime: this.dateToNanoseconds(data.expirationTime),
      resolutionLink: data.resolutionLink,
      resolutionDescription: data.resolutionDescription || '',
      tags: this.mapTags(data.tags),
      image: this.mapImageData(data.imageUrl),
    };

    console.log('Binary market args:', args);

    try {
      const result = await actor.createBinaryMarket(args);
      
      if ('err' in result) {
        throw new Error(`Failed to create binary market: ${result.err}`);
      }
      
      console.log('Binary market created with ID:', result.ok.toString());
      return result.ok;
    } catch (error) {
      console.error('Error creating binary market:', error);
      throw error;
    }
  }

  async createMultipleChoiceMarket(data: {
    title: string;
    description: string;
    category: string;
    endDate: string;
    expirationTime: string;
    resolutionLink: string;
    resolutionDescription: string;
    outcomes: string[];
    tags: string[];
    imageUrl?: string;
  }): Promise<MarketId> {
    const actor = this.ensureInitialized();
    this.validateMarketData(data);

    if (!data.outcomes || data.outcomes.length < 2) {
      throw new Error('At least 2 outcomes are required for multiple choice market');
    }

    console.log('Creating multiple choice market:', data.title);

    const args: CreateMultipleChoiceMarketArgs = {
      title: data.title,
      description: data.description,
      category: this.mapCategory(data.category),
      bettingCloseTime: this.dateToNanoseconds(data.endDate),
      expirationTime: this.dateToNanoseconds(data.expirationTime),
      resolutionLink: data.resolutionLink,
      resolutionDescription: data.resolutionDescription || '',
      outcomes: data.outcomes,
      tags: this.mapTags(data.tags),
      image: this.mapImageData(data.imageUrl),
    };

    console.log('Multiple choice market args:', args);

    try {
      const result = await actor.createMultipleChoiceMarket(args);
      
      if ('err' in result) {
        throw new Error(`Failed to create multiple choice market: ${result.err}`);
      }
      
      console.log('Multiple choice market created with ID:', result.ok.toString());
      return result.ok;
    } catch (error) {
      console.error('Error creating multiple choice market:', error);
      throw error;
    }
  }

  async createCompoundMarket(data: {
    title: string;
    description: string;
    category: string;
    endDate: string;
    expirationTime: string;
    resolutionLink: string;
    resolutionDescription: string;
    subjects: string[];
    tags: string[];
    imageUrl?: string;
  }): Promise<MarketId> {
    const actor = this.ensureInitialized();
    this.validateMarketData(data);

    if (!data.subjects || data.subjects.length < 2) {
      throw new Error('At least 2 subjects are required for compound market');
    }

    console.log('Creating compound market:', data.title);

    const args: CreateCompoundMarketArgs = {
      title: data.title,
      description: data.description,
      category: this.mapCategory(data.category),
      bettingCloseTime: this.dateToNanoseconds(data.endDate),
      expirationTime: this.dateToNanoseconds(data.expirationTime),
      resolutionLink: data.resolutionLink,
      resolutionDescription: data.resolutionDescription || '',
      subjects: data.subjects,
      tags: this.mapTags(data.tags),
      image: this.mapImageData(data.imageUrl),
    };

    console.log('Compound market args:', args);

    try {
      const result = await actor.createCompoundMarket(args);
      
      if ('err' in result) {
        throw new Error(`Failed to create compound market: ${result.err}`);
      }
      
      console.log('Compound market created with ID:', result.ok.toString());
      return result.ok;
    } catch (error) {
      console.error('Error creating compound market:', error);
      throw error;
    }
  }

  // Market query methods
  async getAllMarkets(): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    try {
      const markets = await actor.getAllMarkets();
      console.log(`Retrieved ${markets.length} markets`);
      return markets;
    } catch (error) {
      console.error('Error getting all markets:', error);
      throw error;
    }
  }

  async getActiveMarkets(): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    try {
      const markets = await actor.getActiveMarkets();
      console.log(`Retrieved ${markets.length} active markets`);
      return markets;
    } catch (error) {
      console.error('Error getting active markets:', error);
      throw error;
    }
  }

  async getMarketInfo(marketId: MarketId): Promise<MarketInfo | null> {
    const actor = this.ensureInitialized();
    try {
      const result = await actor.getMarketInfo(marketId);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting market info:', error);
      throw error;
    }
  }

  async getMarketsByCreator(creator: Principal): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getMarketsByCreator(creator);
    } catch (error) {
      console.error('Error getting markets by creator:', error);
      throw error;
    }
  }

  async getMarketsByCategory(category: string): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getMarketsByCategory(this.mapCategory(category));
    } catch (error) {
      console.error('Error getting markets by category:', error);
      throw error;
    }
  }

  async getMarketCount(): Promise<bigint> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getMarketCount();
    } catch (error) {
      console.error('Error getting market count:', error);
      throw error;
    }
  }

  async getMarketCountByCategory(): Promise<Array<[Category, bigint]>> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getMarketCountByCategory();
    } catch (error) {
      console.error('Error getting market count by category:', error);
      throw error;
    }
  }

  async getMarketCountByType(): Promise<{ binary: bigint, compound: bigint, multipleChoice: bigint }> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getMarketCountByType();
    } catch (error) {
      console.error('Error getting market count by type:', error);
      throw error;
    }
  }

  async getExpiredMarkets(): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getExpiredMarkets();
    } catch (error) {
      console.error('Error getting expired markets:', error);
      throw error;
    }
  }

  async getMarketsByTag(tag: string): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    try {
      const tagMap: Record<string, Tag> = {
        'sports': { 'Sports': null },
        'political': { 'Political': null },
        'politics': { 'Political': null },
        'crypto': { 'Crypto': null },
        'tech': { 'Technology': null },
        'technology': { 'Technology': null },
        'entertainment': { 'Entertainment': null },
        'ai': { 'AI': null },
        'runes': { 'Runes': null },
        'web2': { 'web2': null },
      };
      
      const mappedTag = tagMap[tag.toLowerCase()] || { 'Technology': null };
      return await actor.getMarketsByTag(mappedTag);
    } catch (error) {
      console.error('Error getting markets by tag:', error);
      throw error;
    }
  }

  async getAllTokenMetadata(): Promise<Array<[Principal, any]>> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getAllTokenMetadata();
    } catch (error) {
      console.error('Error getting all token metadata:', error);
      throw error;
    }
  }

  async getTokenMetadata(tokenId: Principal): Promise<any | null> {
    const actor = this.ensureInitialized();
    try {
      const result = await actor.getTokenMetadata(tokenId);
      return result ?? null;
    } catch (error) {
      console.error('Error getting token metadata:', error);
      throw error;
    }
  }

  // Factory info methods
  async getFactoryPrincipal(): Promise<Principal> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getFactoryPrincipal();
    } catch (error) {
      console.error('Error getting factory principal:', error);
      throw error;
    }
  }

  async hasWasm(): Promise<boolean> {
    const actor = this.ensureInitialized();
    try {
      return await actor.hasWasm();
    } catch (error) {
      console.error('Error checking WASM:', error);
      throw error;
    }
  }

  async uploadWasm(wasmBytes: Uint8Array): Promise<void> {
    const actor = this.ensureInitialized();
    try {
      const result = await actor.uploadWasm(Array.from(wasmBytes));
      
      if ('err' in result) {
        throw new Error(`Failed to upload WASM: ${result.err}`);
      }
      
      console.log('WASM uploaded successfully');
    } catch (error) {
      console.error('Error uploading WASM:', error);
      throw error;
    }
  }

  // Utility methods
  async canCreateMarket(requiredCycles: bigint = BigInt(0)): Promise<{
    currentBalance: bigint;
    requiredCycles: bigint;
    canCreate: boolean;
  }> {
    const actor = this.ensureInitialized();
    try {
      return await actor.canCreateMarket(requiredCycles);
    } catch (error) {
      console.error('Error checking if can create market:', error);
      throw error;
    }
  }

  async getCycleBalance(): Promise<bigint> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getCycleBalance();
    } catch (error) {
      console.error('Error getting cycle balance:', error);
      throw error;
    }
  }

  async getCreatedCanisters(): Promise<Principal[]> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getCreatedCanisters();
    } catch (error) {
      console.error('Error getting created canisters:', error);
      throw error;
    }
  }

  async getCreatedTokens(): Promise<Principal[]> {
    const actor = this.ensureInitialized();
    try {
      return await actor.getCreatedTokens();
    } catch (error) {
      console.error('Error getting created tokens:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const icService = new ICService();

// React hook for using IC service
export const useICService = () => {
  return {
    service: icService,
    initialize: () => icService.initialize(),
    getState: () => icService.getState()
  };
};