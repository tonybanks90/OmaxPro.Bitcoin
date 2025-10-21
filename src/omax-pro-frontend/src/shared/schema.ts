import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  isConnected: boolean("is_connected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  contractAddress: text("contract_address").notNull().unique(),
  price: decimal("price", { precision: 18, scale: 8 }),
  marketCap: decimal("market_cap", { precision: 18, scale: 2 }),
  volume24h: decimal("volume_24h", { precision: 18, scale: 2 }),
  change5m: decimal("change_5m", { precision: 5, scale: 2 }),
  change1h: decimal("change_1h", { precision: 5, scale: 2 }),
  change6h: decimal("change_6h", { precision: 5, scale: 2 }),
  change24h: decimal("change_24h", { precision: 5, scale: 2 }),
  holders: integer("holders").default(0),
  liquidity: decimal("liquidity", { precision: 18, scale: 2 }),
  age: text("age"),
  isBundled: boolean("is_bundled").default(false),
  isVerified: boolean("is_verified").default(false),
  category: text("category"), // 'newly_created', 'about_to_graduate', 'graduated'
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  address: text("address").notNull(),
  name: text("name"),
  isTracked: boolean("is_tracked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").references(() => tokens.id),
  walletId: varchar("wallet_id").references(() => wallets.id),
  type: text("type").notNull(), // 'buy', 'sell'
  amount: decimal("amount", { precision: 18, scale: 8 }),
  price: decimal("price", { precision: 18, scale: 8 }),
  value: decimal("value", { precision: 18, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  timestamp: true,
});

export const predictionMarkets = pgTable("prediction_markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  category: text("category").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalVolume: decimal("total_volume", { precision: 18, scale: 2 }).default("0"),
  totalVolumeUSD: decimal("total_volume_usd", { precision: 18, scale: 2 }).default("0"),
  totalVolumeSats: decimal("total_volume_sats", { precision: 18, scale: 0 }).default("0"),
  participants: integer("participants").default(0),
  isActive: boolean("is_active").default(true),
  creator: text("creator").notNull(),
  featured: boolean("featured").default(false),
  tags: text("tags").array().default([]),
  resolutionLink: text("resolution_link"),
  marketType: text("market_type").notNull(), // 'binary', 'multiple_choice', 'compound'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const predictionOptions = pgTable("prediction_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  label: text("label").notNull(),
  odds: decimal("odds", { precision: 10, scale: 2 }).default("1.0"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).default("0"),
  volume: decimal("volume", { precision: 18, scale: 2 }).default("0"),
  color: text("color").default("#10b981"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPredictionMarketSchema = createInsertSchema(predictionMarkets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPredictionOptionSchema = createInsertSchema(predictionOptions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertPredictionMarket = z.infer<typeof insertPredictionMarketSchema>;
export type PredictionMarket = typeof predictionMarkets.$inferSelect;
export type InsertPredictionOption = z.infer<typeof insertPredictionOptionSchema>;
export type PredictionOption = typeof predictionOptions.$inferSelect;

// Discovery Asset Types
export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  fullyDilutedValuation?: number | null;
  totalVolume: number;
  high24h?: number | null;
  low24h?: number | null;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCapChange24h?: number | null;
  marketCapChangePercentage24h?: number | null;
  circulatingSupply?: number | null;
  totalSupply?: number | null;
  maxSupply?: number | null;
  ath?: number | null;
  athChangePercentage?: number | null;
  athDate?: string | null;
  atl?: number | null;
  atlChangePercentage?: number | null;
  atlDate?: string | null;
  lastUpdated: string;
}

export interface StockAsset {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume?: number;
  marketCap?: number;
  peRatio?: number | null;
  weekHigh52?: number | null;
  weekLow52?: number | null;
  logoUrl?: string;
  lastUpdated: string;
}

export interface SportsEvent {
  id: string;
  sport: string;
  league: string;
  eventName: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  eventDate: string;
  venue?: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  odds?: {
    homeWin?: number;
    awayWin?: number;
    draw?: number;
  } | null;
  lastUpdated: string;
}

export interface WeatherData {
  id: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection?: number;
  description: string;
  icon: string;
  clouds?: number;
  visibility?: number;
  sunrise?: string;
  sunset?: string;
  lastUpdated: string;
}

export interface DiscoveryAsset {
  id: string;
  externalId: string;
  category: 'crypto' | 'stocks' | 'sports' | 'weather';
  name: string;
  symbol?: string;
  imageUrl?: string;
  currentPrice?: number;
  change24h?: number;
  metadata?: Record<string, any>;
  lastUpdated: string;
}
