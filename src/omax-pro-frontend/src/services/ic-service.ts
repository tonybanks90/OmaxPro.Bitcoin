// src/services/ic-service.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import type { idlFactory, _SERVICE } from '../../../declarations/TFactory/TFactory.did';
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
const CANISTER_ID = process.env.VITE_PREDICTION_MARKET_FACTORY_CANISTER_ID || 'your-canister-id';

// Configure network
const HOST = process.env.NODE_ENV === 'production' 
  ? 'https://ic0.app' 
  : 'http://localhost:4943';

class ICService {
  private actor: _SERVICE | null = null;
  private agent: HttpAgent | null = null;

  async initialize(): Promise<void> {
    try {
      this.agent = new HttpAgent({ 
        host: HOST,
        // Only fetch root key in development
        ...(process.env.NODE_ENV === 'development' && { fetchRootKey: true })
      });

      this.actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent: this.agent,
        canisterId: CANISTER_ID,
      });

      console.log('IC Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IC Service:', error);
      throw error;
    }
  }

  private ensureInitialized(): _SERVICE {
    if (!this.actor) {
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
    
    return categoryMap[category.toLowerCase()] || { 'Technology': null };
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
    
    return tags.map(tag => tagMap[tag.toLowerCase()] || { 'Technology': null });
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
    return BigInt(date.getTime() * 1_000_000); // Convert ms to ns
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

    const result = await actor.createBinaryMarket(args);
    
    if ('err' in result) {
      throw new Error(result.err);
    }
    
    return result.ok;
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

    const result = await actor.createMultipleChoiceMarket(args);
    
    if ('err' in result) {
      throw new Error(result.err);
    }
    
    return result.ok;
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

    const result = await actor.createCompoundMarket(args);
    
    if ('err' in result) {
      throw new Error(result.err);
    }
    
    return result.ok;
  }

  // Market query methods
  async getAllMarkets(): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    return await actor.getAllMarkets();
  }

  async getActiveMarkets(): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    return await actor.getActiveMarkets();
  }

  async getMarketInfo(marketId: MarketId): Promise<MarketInfo | null> {
    const actor = this.ensureInitialized();
    const result = await actor.getMarketInfo(marketId);
    return result.length > 0 ? result[0] : null;
  }

  async getMarketsByCreator(creator: Principal): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    return await actor.getMarketsByCreator(creator);
  }

  async getMarketsByCategory(category: string): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    return await actor.getMarketsByCategory(this.mapCategory(category));
  }

  async getMarketCount(): Promise<bigint> {
    const actor = this.ensureInitialized();
    return await actor.getMarketCount();
  }

  async getMarketCountByCategory(): Promise<Array<[Category, bigint]>> {
    const actor = this.ensureInitialized();
    return await actor.getMarketCountByCategory();
  }

  async getMarketCountByType(): Promise<{ binary: bigint, compound: bigint, multipleChoice: bigint }> {
    const actor = this.ensureInitialized();
    return await actor.getMarketCountByType();
  }

  async getExpiredMarkets(): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
    return await actor.getExpiredMarkets();
  }

  async getMarketsByTag(tag: string): Promise<MarketInfo[]> {
    const actor = this.ensureInitialized();
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
  }

  async getAllTokenMetadata(): Promise<Array<[Principal, any]>> {
    const actor = this.ensureInitialized();
    return await actor.getAllTokenMetadata();
  }

  async getTokenMetadata(tokenId: Principal): Promise<any | null> {
    const actor = this.ensureInitialized();
    const result = await actor.getTokenMetadata(tokenId);
    return result ?? null;
  }

  // Factory info methods
  async getFactoryPrincipal(): Promise<Principal> {
    const actor = this.ensureInitialized();
    return await actor.getFactoryPrincipal();
  }

  async hasWasm(): Promise<boolean> {
    const actor = this.ensureInitialized();
    return await actor.hasWasm();
  }

  async uploadWasm(wasmBytes: Uint8Array): Promise<void> {
    const actor = this.ensureInitialized();
    const result = await actor.uploadWasm(Array.from(wasmBytes));
    
    if ('err' in result) {
      throw new Error(result.err);
    }
  }
}

// Create singleton instance
export const icService = new ICService();

// React hook for using IC service
export const useICService = () => {
  return icService;
};