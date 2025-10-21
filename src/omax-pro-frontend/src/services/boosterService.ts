import { ckTestBTCBooster, ckTESTBTC_CANISTER_IDS } from '@ckboost/booster';
import Big from 'big.js';

interface BoosterConfig {
  mnemonics: string;
  host?: string;
  maxAmountBTC: number;
  minFeePercentage: number;
  checkIntervalMs: number;
  initialDepositAmount: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface BoosterStats {
  requestsProcessed: number;
  requestsAccepted: number;
  requestsRejected: number;
  totalFeesEarned: bigint;
  startTime: number;
  isRunning: boolean;
}

// Utility functions for BTC formatting (since they don't exist on the class)
const SATOSHIS_PER_BTC = BigInt(100_000_000);

function formatBTC(satoshis: bigint): string {
  const big = new Big(satoshis.toString());
  return big.div(SATOSHIS_PER_BTC.toString()).toFixed(8);
}

function parseBTC(btc: string): bigint {
  const big = new Big(btc);
  return BigInt(big.mul(SATOSHIS_PER_BTC.toString()).toFixed(0));
}

export class AutomatedBooster {
  private booster: ckTestBTCBooster;
  private config: BoosterConfig;
  private isRunning: boolean = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private stats: BoosterStats = {
    requestsProcessed: 0,
    requestsAccepted: 0,
    requestsRejected: 0,
    totalFeesEarned: BigInt(0),
    startTime: 0,
    isRunning: false
  };

  constructor(config: BoosterConfig) {
    this.config = {
      maxRetries: 3,
      retryDelayMs: 5000,
      ...config
    };
    this.booster = new ckTestBTCBooster(
      config.mnemonics,
      config.host || 'https://ic0.app'
    );
  }

  /**
   * Retry helper function
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a network error
        const isNetworkError = 
          error.message?.includes('fetch failed') ||
          error.message?.includes('EAI_AGAIN') ||
          error.message?.includes('ENOTFOUND') ||
          error.message?.includes('ETIMEDOUT');
        
        if (isNetworkError && attempt < (this.config.maxRetries || 3)) {
          console.log(`⚠️  ${operationName} failed (attempt ${attempt}/${this.config.maxRetries})`);
          console.log(`   Retrying in ${(this.config.retryDelayMs || 5000) / 1000}s...`);
          await this.sleep(this.config.retryDelayMs || 5000);
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize and start the booster
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Booster is already running');
      return;
    }

    console.log('🚀 Starting Automated Booster...');
    console.log(`🌐 Connecting to: ${this.config.host || 'https://ic0.app'}`);

    try {
      // Step 1: Initialize connection with retry
      await this.retryOperation(
        async () => {
          await this.booster.initialize();
          console.log('✅ Connected to ICP network');
          const principal = this.booster.getPrincipal();
          console.log('📍 Principal:', principal.toString());
        },
        'Connection initialization'
      );

      // Step 2: Check/Register booster account
      await this.ensureRegistered();

      // Step 3: Setup liquidity
      await this.setupLiquidity();

      // Step 4: Start monitoring loop
      this.isRunning = true;
      this.stats.isRunning = true;
      this.stats.startTime = Date.now();
      
      console.log('✅ Booster is now running!');
      console.log(`🔍 Checking for requests every ${this.config.checkIntervalMs / 1000}s`);
      
      this.runMonitoringLoop();
    } catch (error) {
      console.error('❌ Failed to start booster:', error);
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Check your internet connection');
      console.error('   2. Try changing ICP_HOST in .env to "https://ic0.app"');
      console.error('   3. If using WSL, fix DNS with Google DNS (8.8.8.8)');
      console.error('   4. Verify the ckboost network is accessible\n');
      throw error;
    }
  }

  /**
   * Stop the booster
   */
  stop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.isRunning = false;
    this.stats.isRunning = false;
    console.log('🛑 Booster stopped');
    this.printStats();
  }

  /**
   * Ensure booster account is registered
   */
  private async ensureRegistered(): Promise<void> {
    console.log('🔍 Checking registration status...');
    
    const account = await this.retryOperation(
      async () => {
        let acc = await this.booster.getBoosterAccount();
        
        // Handle Candid optional type: [] | [BoosterAccount]
        if (!acc || acc.length === 0) {
          console.log('📝 Registering as booster...');
          await this.booster.registerBoosterAccount();
          acc = await this.booster.getBoosterAccount();
          console.log('✅ Registration successful!');
        } else {
          console.log('✅ Already registered');
        }
        
        return acc;
      },
      'Registration check'
    );

    // Extract account from optional array
    if (account && account.length > 0) {
      const acc = account[0] as any;
      console.log(`💰 Current deposit: ${formatBTC(acc.depositAmount || BigInt(0))} ckTESTBTC`);
      console.log(`📊 Status: ${acc.isActive ? 'Active' : 'Inactive'}`);
    }
  }

  /**
   * Setup initial liquidity
   */
  private async setupLiquidity(): Promise<void> {
    console.log('💰 Setting up liquidity...');

    // Check balance using the actor directly
    const balance = await this.retryOperation(
      async () => {
        const bal = await (this.booster as any).getBalance();
        return bal as bigint;
      },
      'Balance check'
    );
    console.log(`💵 Current balance: ${formatBTC(balance)} ckTESTBTC`);

    const depositAmount = parseBTC(this.config.initialDepositAmount);

    if (balance < depositAmount) {
      throw new Error(
        `Insufficient balance. Need ${this.config.initialDepositAmount} ckTESTBTC, have ${formatBTC(balance)} ckTESTBTC`
      );
    }

    // Check current deposit
    const account = await this.booster.getBoosterAccount();
    const currentDeposit = (account && account.length > 0) ? (account[0] as any).depositAmount || BigInt(0) : BigInt(0);
    if (currentDeposit >= depositAmount) {
      console.log('✅ Sufficient liquidity already deposited');
      return;
    }

    console.log(`📤 Depositing ${this.config.initialDepositAmount} ckTESTBTC...`);

    // Approve backend to spend tokens
    await this.retryOperation(
      async () => {
        await (this.booster as any).approve(
          ckTESTBTC_CANISTER_IDS.CKBOOST_BACKEND,
          depositAmount
        );
      },
      'Token approval'
    );
    console.log('✅ Approval granted');

    // Update deposit - using the account principal and amount
    await this.retryOperation(
      async () => {
        const principal = this.booster.getPrincipal();
        await (this.booster as any).updateBoosterDeposit(principal, depositAmount);
      },
      'Deposit update'
    );
    console.log('✅ Liquidity deposited successfully!');
  }

  /**
   * Main monitoring loop
   */
  private runMonitoringLoop(): void {
    this.loopInterval = setInterval(async () => {
      try {
        await this.processRequests();
      } catch (error) {
        console.error('❌ Error in monitoring loop:', error);
        // Continue running despite errors
      }
    }, this.config.checkIntervalMs);
  }

  /**
   * Process pending boost requests
   */
  private async processRequests(): Promise<void> {
    try {
      const requests = await this.retryOperation(
        () => this.booster.getPendingBoostRequests(),
        'Fetch pending requests'
      );
      
      if (requests.length === 0) {
        console.log('⏳ No pending requests');
        return;
      }

      console.log(`\n📋 Found ${requests.length} pending request(s)`);

      for (const request of requests) {
        this.stats.requestsProcessed++;
        
        const amountBTC = parseFloat(formatBTC(request.amount));
        const feePercentage = request.maxFeePercentage;

        console.log(`\n🔍 Evaluating Request ${request.id}`);
        console.log(`   Amount: ${amountBTC} ckTESTBTC`);
        console.log(`   Max Fee: ${feePercentage}%`);
        // userPrincipal may not exist in the actual type
        console.log(`   User: ${(request as any).userPrincipal?.toString() || 'N/A'}`);

        // Risk evaluation
        if (this.shouldAcceptRequest(request)) {
          await this.acceptRequest(request);
        } else {
          this.stats.requestsRejected++;
          console.log('   ❌ Rejected - Does not meet criteria');
        }
      }
    } catch (error) {
      console.error('Error processing requests:', error);
    }
  }

  /**
   * Risk evaluation logic
   */
  private shouldAcceptRequest(request: any): boolean {
    const amountBTC = parseFloat(formatBTC(request.amount));
    const feePercentage = request.maxFeePercentage;

    // Check amount limit
    if (amountBTC > this.config.maxAmountBTC) {
      console.log(`   ⚠️ Amount too large (max: ${this.config.maxAmountBTC} ckTESTBTC)`);
      return false;
    }

    // Check fee percentage
    if (feePercentage < this.config.minFeePercentage) {
      console.log(`   ⚠️ Fee too low (min: ${this.config.minFeePercentage}%)`);
      return false;
    }

    return true;
  }

  /**
   * Accept a boost request
   */
  private async acceptRequest(request: any): Promise<void> {
    try {
      await this.retryOperation(
        () => this.booster.acceptBoostRequest(request.id),
        'Accept request'
      );
      
      const feeAmount = request.amount * BigInt(request.maxFeePercentage) / BigInt(100);
      this.stats.totalFeesEarned += feeAmount;
      this.stats.requestsAccepted++;

      console.log('   ✅ Request ACCEPTED!');
      console.log(`   💰 Expected fee: ${formatBTC(feeAmount)} ckTESTBTC`);
    } catch (error: any) {
      if (error.message?.includes('already accepted')) {
        console.log('   ⚠️ Already accepted by another booster');
      } else {
        console.error('   ❌ Failed to accept request:', error);
      }
    }
  }

  /**
   * Get current statistics
   */
  getStats(): BoosterStats {
    return { ...this.stats };
  }

  /**
   * Print statistics
   */
  private printStats(): void {
    const runTime = Date.now() - this.stats.startTime;
    const hours = Math.floor(runTime / 3600000);
    const minutes = Math.floor((runTime % 3600000) / 60000);

    console.log('\n📊 ===== Booster Statistics =====');
    console.log(`⏱️  Runtime: ${hours}h ${minutes}m`);
    console.log(`📋 Requests Processed: ${this.stats.requestsProcessed}`);
    console.log(`✅ Requests Accepted: ${this.stats.requestsAccepted}`);
    console.log(`❌ Requests Rejected: ${this.stats.requestsRejected}`);
    console.log(`💰 Total Fees Earned: ${formatBTC(this.stats.totalFeesEarned)} ckTESTBTC`);
    console.log('================================\n');
  }

  /**
   * Get balance information
   */
  async getBalanceInfo(): Promise<{
    available: string;
    deposited: string;
    total: string;
  }> {
    const balance = await (this.booster as any).getBalance() as bigint;
    const account = await this.booster.getBoosterAccount();
    const deposited = (account && account.length > 0) ? ((account[0] as any).depositAmount || BigInt(0)) : BigInt(0);

    return {
      available: formatBTC(balance),
      deposited: formatBTC(deposited),
      total: formatBTC(balance + deposited)
    };
  }
}

// Export convenience function
export async function createAndStartBooster(config: BoosterConfig): Promise<AutomatedBooster> {
  const booster = new AutomatedBooster(config);
  await booster.start();
  return booster;
}