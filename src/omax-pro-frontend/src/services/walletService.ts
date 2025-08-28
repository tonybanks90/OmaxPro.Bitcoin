// src/services/walletService.ts
import { createWalletTrackerActor } from './actor';

export interface WalletEntry {
  address: string;
  name: string;
}

export class WalletService {
  /**
   * Add a new wallet to the tracker
   */
  static async addWallet(address: string, name: string): Promise<void> {
    try {
      const actor = createWalletTrackerActor();
      await actor.addEntry(address, name);
    } catch (error) {
      console.error('Failed to add wallet:', error);
      throw new Error('Failed to add wallet');
    }
  }

  /**
   * Get all tracked wallets
   */
  static async getAllWallets(): Promise<WalletEntry[]> {
    try {
      const actor = createWalletTrackerActor();
      const entries = await actor.getAllEntries();
      return entries.map(([address, name]: [string, string]) => ({ address, name }));
    } catch (error) {
      console.error('Failed to get wallets:', error);
      throw new Error('Failed to retrieve wallets');
    }
  }

  /**
   * Search wallets by query string
   */
  static async searchWallets(query: string): Promise<WalletEntry[]> {
    try {
      const actor = createWalletTrackerActor();
      const entries = await actor.searchEntries(query);
      return entries.map(([address, name]: [string, string]) => ({ address, name }));
    } catch (error) {
      console.error('Failed to search wallets:', error);
      throw new Error('Failed to search wallets');
    }
  }

  /**
   * Validate wallet address format
   */
  static validateWalletAddress(address: string): boolean {
    // Basic validation - you can enhance this based on your specific blockchain
    const trimmed = address.trim();
    
    // Check minimum length
    if (trimmed.length < 10) return false;
    
    // Check if it's a valid format (this is a basic check - customize as needed)
    const isValid = /^[a-zA-Z0-9]+$/.test(trimmed);
    
    return isValid;
  }

  /**
   * Format wallet address for display (truncate)
   */
  static formatAddress(address: string, startChars = 6, endChars = 6): string {
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Export wallets to JSON
   */
  static exportWallets(wallets: WalletEntry[]): void {
    const dataStr = JSON.stringify(wallets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `wallets_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  /**
   * Import wallets from file
   */
  static async importWallets(file: File): Promise<WalletEntry[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const wallets = JSON.parse(content) as WalletEntry[];
          
          // Validate the imported data
          if (!Array.isArray(wallets)) {
            throw new Error('Invalid file format: expected array of wallets');
          }
          
          const validWallets = wallets.filter(wallet => 
            wallet.address && 
            wallet.name && 
            typeof wallet.address === 'string' && 
            typeof wallet.name === 'string'
          );
          
          if (validWallets.length !== wallets.length) {
            console.warn(`${wallets.length - validWallets.length} invalid wallet entries were skipped`);
          }
          
          resolve(validWallets);
        } catch (error) {
          reject(new Error('Failed to parse wallet file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read wallet file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Batch add wallets to the backend
   */
  static async batchAddWallets(wallets: WalletEntry[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const wallet of wallets) {
      try {
        await this.addWallet(wallet.address, wallet.name);
        successful++;
      } catch (error) {
        failed++;
        errors.push(`Failed to add wallet ${wallet.name} (${wallet.address}): ${error}`);
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Check if wallet address already exists
   */
  static async walletExists(address: string): Promise<boolean> {
    try {
      const allWallets = await this.getAllWallets();
      return allWallets.some(wallet => wallet.address === address);
    } catch (error) {
      console.error('Failed to check wallet existence:', error);
      return false;
    }
  }
}