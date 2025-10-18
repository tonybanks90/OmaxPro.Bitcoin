// src/services/actor.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../declarations/WalletTracker';

// Create the actor for interacting with the WalletTracker canister
let walletTrackerActor: any = null;

// Get environment variables with fallbacks
const getEnvVars = () => {
  const network = import.meta.env.VITE_DFX_NETWORK || 'local';
  const canisterId = import.meta.env.VITE_CANISTER_ID_WALLET_TRACKER;
  
  if (!canisterId) {
    console.error('VITE_CANISTER_ID_WALLET_TRACKER is not set in environment variables');
    throw new Error('Canister ID not configured');
  }
  
  return {
    network,
    canisterId,
    host: network === 'local' ? 'http://localhost:4943' : 'https://ic0.app'
  };
};

export const createWalletTrackerActor = () => {
  if (walletTrackerActor) {
    return walletTrackerActor;
  }

  try {
    const { network, canisterId, host } = getEnvVars();

    // Create an agent for talking to the IC
    const agent = new HttpAgent({ host });

    // Only fetch root key when working locally
    if (network === 'local') {
      agent.fetchRootKey().catch(err => {
        console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
        console.error(err);
      });
    }

    // Create the actor
    walletTrackerActor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });

    return walletTrackerActor;
  } catch (error) {
    console.error('Failed to create WalletTracker actor:', error);
    throw error;
  }
};

// Reset actor (useful for testing or switching networks)
export const resetActor = () => {
  walletTrackerActor = null;
};