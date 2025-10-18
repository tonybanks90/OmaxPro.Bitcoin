// src/services/walletService.ts - Corrected version matching canister interface
import { WalletActorService } from '../hooks/useWalletActor';
import { Principal } from '@dfinity/principal';

export interface WalletEntry {
  address: string;
  name: string;
}

export class WalletService {
  // Ensure actor is ready before operations
  private static async ensureActor() {
    await WalletActorService.ensureReady();
    
    const actor = WalletActorService.getActor();
    if (!actor) {
      throw new Error('Wallet actor not available');
    }
    
    return actor;
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
      address,
      name,
    }));
  }

  /**
   * Get all wallets for a user
   */
  static async getUserWallets(userPrincipal: string): Promise<WalletEntry[]> {
    const actor = await this.ensureActor();
    const principal = this.toPrincipal(userPrincipal);

    try {
      const entries = await actor.getUserWallets(principal);
      return this.transformWalletEntries(entries);
    } catch (error) {
      console.error('Error getting user wallets:', error);
      throw error;
    }
  }

  /**
   * Search wallets for a user
   */
  static async searchWallets(userPrincipal: string, searchTerm: string): Promise<WalletEntry[]> {
    const actor = await this.ensureActor();
    const principal = this.toPrincipal(userPrincipal);

    try {
      const entries = await actor.searchUserWallets(principal, searchTerm);
      return this.transformWalletEntries(entries);
    } catch (error) {
      console.error('Error searching wallets:', error);
      throw error;
    }
  }

  /**
   * Add a new wallet for a user
   */
  static async addWallet(userPrincipal: string, address: string, name: string): Promise<void> {
    const actor = await this.ensureActor();
    const principal = this.toPrincipal(userPrincipal);

    try {
      await actor.addWalletEntry(principal, address.trim(), name.trim());
      console.log(`Successfully added wallet: ${name} (${address})`);
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  }

  /**
   * Remove a wallet for a user
   */
  static async removeWallet(userPrincipal: string, address: string): Promise<boolean> {
    const actor = await this.ensureActor();
    const principal = this.toPrincipal(userPrincipal);

    try {
      const result = await actor.removeWalletEntry(principal, address);
      console.log(`Wallet removal ${result ? 'successful' : 'failed'}: ${address}`);
      return result;
    } catch (error) {
      console.error('Error removing wallet:', error);
      throw error;
    }
  }

  /**
   * Update wallet name
   */
  static async updateWalletName(userPrincipal: string, address: string, newName: string): Promise<boolean> {
    const actor = await this.ensureActor();
    const principal = this.toPrincipal(userPrincipal);

    try {
      const result = await actor.updateWalletName(principal, address, newName.trim());
      console.log(`Wallet name update ${result ? 'successful' : 'failed'}: ${address} -> ${newName}`);
      return result;
    } catch (error) {
      console.error('Error updating wallet name:', error);
      throw error;
    }
  }

  /**
   * Get a specific wallet entry
   */
  static async getWalletEntry(userPrincipal: string, address: string): Promise<string | null> {
    const actor = await this.ensureActor();
    const principal = this.toPrincipal(userPrincipal);

    try {
      const result = await actor.getWalletEntry(principal, address);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting wallet entry:', error);
      throw error;
    }
  }

  /**
   * Get wallet count for a user
   */
  static async getUserWalletCount(userPrincipal: string): Promise<number> {
    const actor = await this.ensureActor();
    const principal = this.toPrincipal(userPrincipal);

    try {
      const count = await actor.getUserWalletCount(principal);
      return Number(count);
    } catch (error) {
      console.error('Error getting wallet count:', error);
      throw error;
    }
  }

  /**
   * Validate wallet address format (basic validation)
   */
  static validateWalletAddress(address: string): boolean {
    if (!address || address.trim().length === 0) {
      return false;
    }
    
    // Add your specific wallet address validation logic here
    const trimmed = address.trim();
    
    // Basic length checks for common address formats
    if (trimmed.length < 10 || trimmed.length > 150) {
      return false;
    }
    
    return true;
  }

  /**
   * Validate wallet name
   */
  static validateWalletName(name: string): boolean {
    if (!name || name.trim().length === 0) {
      return false;
    }
    
    const trimmed = name.trim();
    return trimmed.length >= 1 && trimmed.length <= 50;
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
  static async batchAddWallets(userPrincipal: string, wallets: WalletEntry[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const wallet of wallets) {
      try {
        await this.addWallet(userPrincipal, wallet.address, wallet.name);
        successful++;
      } catch (error) {
        failed++;
        errors.push(`Failed to add wallet ${wallet.name} (${wallet.address}): ${error}`);
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Check if wallet address already exists for a user
   */
  static async walletExists(userPrincipal: string, address: string): Promise<boolean> {
    try {
      const entry = await this.getWalletEntry(userPrincipal, address);
      return entry !== null;
    } catch (error) {
      console.error('Failed to check wallet existence:', error);
      return false;
    }
  }
}