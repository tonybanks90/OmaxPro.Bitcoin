// Updated WalletService with better error handling
import { Principal } from '@dfinity/principal';
import type { _SERVICE } from '../hooks/useWalletActor';

export interface WalletEntry {
  address: string;
  name: string;
}

// Global reference to the actor - will be set by the useWalletActor hook
let globalActor: _SERVICE | null = null;
let globalIsAuthenticated = false;

// Function to set the global actor reference
export const setGlobalActor = (actor: _SERVICE | null, isAuthenticated: boolean) => {
  console.log('🔄 Setting global actor:', { hasActor: !!actor, isAuthenticated });
  globalActor = actor;
  globalIsAuthenticated = isAuthenticated;
};

export class WalletService {
  private static maxRetries = 3;
  private static retryDelay = 1000;

  // Get the current actor instance
  private static getActor(): _SERVICE {
    console.log('🔍 Getting actor...', { 
      hasGlobalActor: !!globalActor, 
      globalIsAuthenticated 
    });

    if (!globalActor) {
      throw new Error('Wallet actor not available. Please ensure you are authenticated.');
    }
    if (!globalIsAuthenticated) {
      throw new Error('Not authenticated - please connect your wallet');
    }
    return globalActor;
  }

  // Enhanced operation wrapper with retry logic
  private static async withRetry<T>(
    operation: () => Promise<T>, 
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📞 Calling ${operationName} (attempt ${attempt}/${this.maxRetries})...`);
        const result = await operation();
        console.log(`✅ ${operationName} succeeded`);
        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = new Error(errorMessage);
        console.error(`❌ ${operationName} attempt ${attempt} failed:`, errorMessage);
        
        // Handle signature verification errors specifically
        if (errorMessage?.includes('signature') || 
            errorMessage?.includes('certificate') || 
            errorMessage?.includes('delegation')) {
          
          if (attempt < this.maxRetries) {
            console.log(`🔄 Retrying ${operationName} due to signature error (${attempt}/${this.maxRetries})`);
            
            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error('Authentication session expired. Please reconnect your wallet and try again.');
          }
        }
        
        // For "actor not available" errors, don't retry
        if (errorMessage?.includes('not available') || errorMessage?.includes('Not authenticated')) {
          throw lastError;
        }
        
        // For non-signature errors, retry once
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          continue;
        }
        
        break;
      }
    }
    
    throw lastError!;
  }

  // Convert user principal string to Principal object
  private static toPrincipal(userPrincipal: string): Principal {
    try {
      return Principal.fromText(userPrincipal);
    } catch (error) {
      throw new Error(`Invalid principal format: ${userPrincipal}`);
    }
  }

  // Transform canister response to UI format
  private static transformWalletEntries(entries: Array<[string, string]>): WalletEntry[] {
    return entries.map(([address, name]) => ({
      address: address.trim(),
      name: name.trim(),
    }));
  }

  /**
   * Get all wallets for a user with enhanced error handling
   */
  static async getUserWallets(userPrincipal: string): Promise<WalletEntry[]> {
    return this.withRetry(async () => {
      const actor = this.getActor();
      const principal = this.toPrincipal(userPrincipal);
      
      const entries = await actor.getUserWallets(principal);
      return this.transformWalletEntries(entries);
    }, 'getUserWallets');
  }

  /**
   * Search wallets for a user with enhanced error handling
   */
  static async searchWallets(userPrincipal: string, searchTerm: string): Promise<WalletEntry[]> {
    return this.withRetry(async () => {
      const actor = this.getActor();
      const principal = this.toPrincipal(userPrincipal);
      
      const entries = await actor.searchUserWallets(principal, searchTerm.trim());
      return this.transformWalletEntries(entries);
    }, 'searchWallets');
  }

  /**
   * Add a new wallet for a user with enhanced error handling
   */
  static async addWallet(userPrincipal: string, address: string, name: string): Promise<void> {
    return this.withRetry(async () => {
      const actor = this.getActor();
      const principal = this.toPrincipal(userPrincipal);
      
      const trimmedAddress = address.trim();
      const trimmedName = name.trim();
      
      // Validate before sending to canister
      if (!this.validateWalletAddress(trimmedAddress)) {
        throw new Error('Invalid wallet address format');
      }
      if (!this.validateWalletName(trimmedName)) {
        throw new Error('Invalid wallet name');
      }
      
      console.log('📝 Adding wallet to canister:', { address: trimmedAddress, name: trimmedName });
      await actor.addWalletEntry(principal, trimmedAddress, trimmedName);
      console.log(`✅ Successfully added wallet: ${trimmedName} (${trimmedAddress})`);
    }, 'addWallet');
  }

  /**
   * Remove a wallet for a user with enhanced error handling
   */
  static async removeWallet(userPrincipal: string, address: string): Promise<boolean> {
    return this.withRetry(async () => {
      const actor = this.getActor();
      const principal = this.toPrincipal(userPrincipal);
      
      const result = await actor.removeWalletEntry(principal, address.trim());
      console.log(`Wallet removal ${result ? 'successful' : 'failed'}: ${address}`);
      return result;
    }, 'removeWallet');
  }

  /**
   * Update wallet name with enhanced error handling
   */
  static async updateWalletName(userPrincipal: string, address: string, newName: string): Promise<boolean> {
    return this.withRetry(async () => {
      const actor = this.getActor();
      const principal = this.toPrincipal(userPrincipal);
      
      const trimmedName = newName.trim();
      if (!this.validateWalletName(trimmedName)) {
        throw new Error('Invalid wallet name');
      }
      
      const result = await actor.updateWalletName(principal, address.trim(), trimmedName);
      console.log(`Wallet name update ${result ? 'successful' : 'failed'}: ${address} -> ${trimmedName}`);
      return result;
    }, 'updateWalletName');
  }

  /**
   * Get a specific wallet entry with enhanced error handling
   */
  static async getWalletEntry(userPrincipal: string, address: string): Promise<string | null> {
    return this.withRetry(async () => {
      const actor = this.getActor();
      const principal = this.toPrincipal(userPrincipal);
      
      const result = await actor.getWalletEntry(principal, address.trim());
      return result.length > 0 ? result[0] : null;
    }, 'getWalletEntry');
  }

  /**
   * Get wallet count for a user with enhanced error handling
   */
  static async getUserWalletCount(userPrincipal: string): Promise<number> {
    return this.withRetry(async () => {
      const actor = this.getActor();
      const principal = this.toPrincipal(userPrincipal);
      
      const count = await actor.getUserWalletCount(principal);
      return Number(count);
    }, 'getUserWalletCount');
  }

  /**
   * Enhanced wallet address validation
   */
  static validateWalletAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    const trimmed = address.trim();
    
    // Basic validation
    if (trimmed.length === 0 || trimmed.length > 200) {
      return false;
    }
    
    // Check for common patterns that might indicate invalid addresses
    if (trimmed.includes(' ') || trimmed.includes('\t') || trimmed.includes('\n')) {
      return false;
    }
    
    return true;
  }

  /**
   * Enhanced wallet name validation
   */
  static validateWalletName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    const trimmed = name.trim();
    
    // Length validation
    if (trimmed.length < 1 || trimmed.length > 50) {
      return false;
    }
    
    // Check for prohibited characters or patterns
    const prohibitedPatterns = [
      /^\s*$/, // Only whitespace
      /[<>\"'&]/g, // HTML/script characters
      /[\x00-\x1f\x7f]/g, // Control characters
    ];
    
    return !prohibitedPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Format wallet address for display (truncate)
   */
  static formatAddress(address: string, startChars = 6, endChars = 6): string {
    if (!address || address.length <= startChars + endChars + 3) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Check if wallet address already exists for a user with enhanced error handling
   */
  static async walletExists(userPrincipal: string, address: string): Promise<boolean> {
    try {
      const entry = await this.getWalletEntry(userPrincipal, address);
      return entry !== null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to check wallet existence:', errorMessage);
      
      // For signature errors, don't mask the error
      if (errorMessage?.includes('signature') || 
          errorMessage?.includes('certificate') || 
          errorMessage?.includes('delegation')) {
        throw error;
      }
      
      // For other errors, assume wallet doesn't exist
      return false;
    }
  }

  /**
   * Export wallets to JSON with enhanced error handling
   */
  static exportWallets(wallets: WalletEntry[]): void {
    try {
      if (!Array.isArray(wallets) || wallets.length === 0) {
        throw new Error('No wallets to export');
      }
      
      const dataStr = JSON.stringify(wallets, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `wallets_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      console.log(`Exported ${wallets.length} wallets to ${exportFileDefaultName}`);
    } catch (error) {
      console.error('Failed to export wallets:', error);
      throw new Error('Failed to export wallets. Please try again.');
    }
  }

  /**
   * Import wallets from file with enhanced validation
   */
  static async importWallets(file: File): Promise<WalletEntry[]> {
    return new Promise((resolve, reject) => {
      if (!file || file.type !== 'application/json') {
        reject(new Error('Please select a valid JSON file'));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('File too large. Maximum size is 5MB.'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const wallets = JSON.parse(content) as WalletEntry[];
          
          if (!Array.isArray(wallets)) {
            throw new Error('Invalid file format: expected array of wallets');
          }
          
          const validWallets = wallets.filter(wallet => {
            if (!wallet || typeof wallet !== 'object') return false;
            if (!wallet.address || !wallet.name) return false;
            if (typeof wallet.address !== 'string' || typeof wallet.name !== 'string') return false;
            if (!this.validateWalletAddress(wallet.address)) return false;
            if (!this.validateWalletName(wallet.name)) return false;
            return true;
          });
          
          if (validWallets.length === 0) {
            reject(new Error('No valid wallet entries found in file'));
            return;
          }
          
          if (validWallets.length !== wallets.length) {
            console.warn(`${wallets.length - validWallets.length} invalid wallet entries were skipped`);
          }
          
          resolve(validWallets);
        } catch (error) {
          reject(new Error('Failed to parse wallet file. Please ensure it\'s a valid JSON file.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read wallet file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Batch add wallets with enhanced error handling and progress tracking
   */
  static async batchAddWallets(
    userPrincipal: string, 
    wallets: WalletEntry[],
    onProgress?: (current: number, total: number, wallet: WalletEntry) => void
  ): Promise<{
    successful: number;
    failed: number;
    errors: string[];
    results: Array<{ wallet: WalletEntry; success: boolean; error?: string }>;
  }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    const results: Array<{ wallet: WalletEntry; success: boolean; error?: string }> = [];

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      
      try {
        // Check if wallet already exists
        const exists = await this.walletExists(userPrincipal, wallet.address);
        if (exists) {
          const error = `Wallet ${wallet.name} (${wallet.address}) already exists`;
          errors.push(error);
          results.push({ wallet, success: false, error });
          failed++;
          continue;
        }
        
        await this.addWallet(userPrincipal, wallet.address, wallet.name);
        successful++;
        results.push({ wallet, success: true });
        
        // Call progress callback if provided
        onProgress?.(i + 1, wallets.length, wallet);
        
        // Add small delay between operations to avoid overwhelming the canister
        if (i < wallets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const fullErrorMessage = `Failed to add wallet ${wallet.name} (${wallet.address}): ${errorMessage}`;
        failed++;
        errors.push(fullErrorMessage);
        results.push({ wallet, success: false, error: errorMessage });
        
        // If it's a signature error, break the loop as all subsequent operations will likely fail
        if (errorMessage?.includes('signature') || 
            errorMessage?.includes('certificate') || 
            errorMessage?.includes('delegation')) {
          console.error('Authentication error during batch operation, stopping...');
          
          // Mark remaining wallets as failed
          for (let j = i + 1; j < wallets.length; j++) {
            const remainingWallet = wallets[j];
            errors.push(`Skipped ${remainingWallet.name} due to authentication error`);
            results.push({ 
              wallet: remainingWallet, 
              success: false, 
              error: 'Authentication session expired' 
            });
            failed++;
          }
          break;
        }
      }
    }

    return { successful, failed, errors, results };
  }

  /**
   * Health check method to verify service connectivity
   */
  static async healthCheck(userPrincipal: string): Promise<{
    healthy: boolean;
    authenticated: boolean;
    canisterReachable: boolean;
    error?: string;
  }> {
    try {
      // Check if actor is available
      const isReady = globalActor !== null;
      const isAuthenticated = globalIsAuthenticated;
      
      console.log('🏥 Health check:', { isReady, isAuthenticated });
      
      if (!isReady || !isAuthenticated) {
        return {
          healthy: false,
          authenticated: isAuthenticated,
          canisterReachable: isReady,
          error: 'Service not ready or not authenticated'
        };
      }
      
      // Try a simple query operation
      await this.getUserWalletCount(userPrincipal);
      
      return {
        healthy: true,
        authenticated: true,
        canisterReachable: true
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        healthy: false,
        authenticated: globalIsAuthenticated,
        canisterReachable: globalActor !== null,
        error: errorMessage
      };
    }
  }
}