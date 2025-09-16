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


// Prediction Markets Types
export interface PredictionOption {
  id: string;
  label: string;
  odds: number;
  percentage: number;
  volume: string;
  color: string;
}

export interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  endDate: Date | string;
  totalVolume: string;
  totalVolumeUSD: string;
  totalVolumeSats: string;
  participants: number;
  options: PredictionOption[];
  isActive: boolean;
  creator: string;
  featured: boolean;
  tags: string[];
  marketType: 'binary' | 'multiple_choice' | 'compound';
  resolutionLink?: string;
}

export interface PredictionBet {
  id: string;
  marketId: string;
  optionId: string;
  userId: string;
  amount: string;
  odds: number;
  timestamp: Date;
  status: 'pending' | 'settled' | 'cancelled';
}

export interface MarketActivity {
  id: string;
  marketId: string;
  userId: string;
  type: 'bet' | 'comment' | 'share';
  content: string;
  amount?: string;
  optionId?: string;
  timestamp: Date;
}

export interface PredictionCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}
