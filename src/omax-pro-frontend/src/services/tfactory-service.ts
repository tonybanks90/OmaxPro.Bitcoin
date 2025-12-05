// src/services/tfactory-service.ts
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
import { TFactoryActorService } from '../hooks/useTFactoryActor';
import { Principal } from '@dfinity/principal';

export class TFactoryService {
  // Map UI category to canister Category
  private static mapCategory(category: string): Category {
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
  private static mapTags(tags: string[]): Tag[] {
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
  private static mapImageData(imageUrl?: string): ImageData {
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
  private static dateToNanoseconds(dateString: string): bigint {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    return BigInt(date.getTime() * 1_000_000); // Convert ms to ns
  }

  // Validate market creation data
  private static validateMarketData(data: {
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

  // Ensure actor is ready before operations
  private static async ensureActor() {
    await TFactoryActorService.ensureReady();

    const actor = TFactoryActorService.getActor();
    if (!actor) {
      throw new Error('TFactory actor not available');
    }

    return actor;
  }

  static async createBinaryMarket(data: {
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
    const actor = await this.ensureActor();
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
      resolver: Principal.anonymous(),
      liquidityParameter: 100.0,
      totalSupply: BigInt(1_000_000_000),
    };

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

  static async createMultipleChoiceMarket(data: {
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
    const actor = await this.ensureActor();
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
      resolver: Principal.anonymous(),
      liquidityParameter: 100.0,
      totalSupply: BigInt(1_000_000_000),
    };

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

  static async createCompoundMarket(data: {
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
    const actor = await this.ensureActor();
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
      resolver: Principal.anonymous(),
      liquidityParameter: 100.0,
      totalSupply: BigInt(1_000_000_000),
    };

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
  static async getAllMarkets(): Promise<MarketInfo[]> {
    const actor = await this.ensureActor();
    try {
      const markets = await actor.getAllMarkets();
      console.log(`Retrieved ${markets.length} markets`);
      return markets;
    } catch (error) {
      console.error('Error getting all markets:', error);
      throw error;
    }
  }

  static async getActiveMarkets(): Promise<MarketInfo[]> {
    const actor = await this.ensureActor();
    try {
      const markets = await actor.getActiveMarkets();
      console.log(`Retrieved ${markets.length} active markets`);
      return markets;
    } catch (error) {
      console.error('Error getting active markets:', error);
      throw error;
    }
  }

  static async getMarketInfo(marketId: MarketId): Promise<MarketInfo | null> {
    const actor = await this.ensureActor();
    try {
      const result = await actor.getMarketInfo(marketId);
      return result.length > 0 ? result[0] ?? null : null;
    } catch (error) {
      console.error('Error getting market info:', error);
      throw error;
    }
  }

  static async getMarketsByCreator(creator: Principal): Promise<MarketInfo[]> {
    const actor = await this.ensureActor();
    try {
      return await actor.getMarketsByCreator(creator);
    } catch (error) {
      console.error('Error getting markets by creator:', error);
      throw error;
    }
  }

  static async getMarketsByCategory(category: string): Promise<MarketInfo[]> {
    const actor = await this.ensureActor();
    try {
      return await actor.getMarketsByCategory(this.mapCategory(category));
    } catch (error) {
      console.error('Error getting markets by category:', error);
      throw error;
    }
  }

  static async getMarketCount(): Promise<bigint> {
    const actor = await this.ensureActor();
    try {
      return await actor.getMarketCount();
    } catch (error) {
      console.error('Error getting market count:', error);
      throw error;
    }
  }

  static async hasWasm(): Promise<boolean> {
    const actor = await this.ensureActor();
    try {
      return await actor.hasWasm();
    } catch (error) {
      console.error('Error checking WASM:', error);
      throw error;
    }
  }

  // Add more methods as needed...
}