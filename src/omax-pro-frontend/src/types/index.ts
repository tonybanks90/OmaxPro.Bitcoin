export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  price: string;
  marketCap: string;
  volume24h: string;
  change5m: string;
  change1h: string;
  change6h: string;
  change24h: string;
  holders: number;
  liquidity: string;
  age: string;
  isBundled: boolean;
  isVerified: boolean;
  category: 'newly_created' | 'about_to_graduate' | 'graduated';
  avatar: string;
}

export interface WalletData {
  id: string;
  address: string;
  name: string;
  isConnected: boolean;
  balance: string;
}

export interface TradeData {
  id: string;
  tokenId: string;
  walletId: string;
  type: 'buy' | 'sell';
  amount: string;
  price: string;
  value: string;
  timestamp: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Theme = 'dark' | 'bitcoin';
export type Language = 'en' | 'zh';
