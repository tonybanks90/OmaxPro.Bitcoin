import { AutomatedBooster } from './services/boosterService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // Validate environment variables
  const mnemonics = process.env.BOOSTER_MNEMONIC;

  if (!mnemonics) {
    console.error('❌ Error: BOOSTER_MNEMONIC environment variable is required');
    console.error('💡 Create a .env file with: BOOSTER_MNEMONIC="your twelve word phrase here"');
    process.exit(1);
  }

  // Configure the booster
  const config = {
    mnemonics,
    host: process.env.ICP_HOST || 'https://icp0.io',
    maxAmountBTC: parseFloat(process.env.MAX_AMOUNT_BTC || '0.1'),
    minFeePercentage: parseFloat(process.env.MIN_FEE_PERCENTAGE || '0.5'),
    checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '30000'),
    initialDepositAmount: process.env.INITIAL_DEPOSIT || '0.05',
    // Platform-specific filtering: set to true to only boost platform requests
    platformOnly: process.env.PLATFORM_ONLY === 'true',
    // Optional: comma-separated list of initial platform user principals  
    platformUsers: process.env.PLATFORM_USERS?.split(',').filter(Boolean) || []
  };

  console.log('⚙️  Configuration:');
  console.log(`   Max Amount: ${config.maxAmountBTC} ckTESTBTC`);
  console.log(`   Min Fee: ${config.minFeePercentage}%`);
  console.log(`   Check Interval: ${config.checkIntervalMs / 1000}s`);
  console.log(`   Initial Deposit: ${config.initialDepositAmount} ckTESTBTC\n`);

  // Create and start the booster
  const booster = new AutomatedBooster(config);

  try {
    await booster.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      booster.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      booster.stop();
      process.exit(0);
    });

    // Print stats every 5 minutes
    setInterval(() => {
      const stats = booster.getStats();
      if (stats.isRunning) {
        console.log('\n📊 Status Update:');
        console.log(`   Requests Processed: ${stats.requestsProcessed}`);
        console.log(`   Requests Accepted: ${stats.requestsAccepted}`);
        console.log(`   Total Fees: ${stats.totalFeesEarned.toString()} satoshis\n`);
      }
    }, 300000); // 5 minutes

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the booster
main().catch(console.error);