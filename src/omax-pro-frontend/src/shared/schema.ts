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

// Discovery Assets Schema
export const discoveryAssets = pgTable("discovery_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: text("external_id").notNull(), // ID from external API
  category: text("category").notNull(), // 'crypto', 'stocks', 'sports', 'weather'
  name: text("name").notNull(),
  symbol: text("symbol"),
  description: text("description"),
  imageUrl: text("image_url"),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }),
  change24h: decimal("change_24h", { precision: 18, scale: 8 }), // Wider precision for large price changes
  volume: decimal("volume", { precision: 18, scale: 2 }),
  marketCap: decimal("market_cap", { precision: 18, scale: 2 }),
  rank: integer("rank"),
  additionalData: text("additional_data"), // JSON string for category-specific data
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint for external ID + category to support upserts
  externalIdCategoryIdx: sql`UNIQUE (external_id, category)`,
}));

// Crypto Data Schema (from CoinGecko)
export const cryptoAssets = pgTable("crypto_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coinGeckoId: text("coingecko_id").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  image: text("image"),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }),
  marketCap: decimal("market_cap", { precision: 18, scale: 2 }),
  marketCapRank: integer("market_cap_rank"),
  totalVolume: decimal("total_volume", { precision: 18, scale: 2 }),
  high24h: decimal("high_24h", { precision: 18, scale: 8 }),
  low24h: decimal("low_24h", { precision: 18, scale: 8 }),
  priceChange24h: decimal("price_change_24h", { precision: 18, scale: 8 }),
  priceChangePercentage24h: decimal("price_change_percentage_24h", { precision: 5, scale: 2 }),
  circulatingSupply: decimal("circulating_supply", { precision: 18, scale: 0 }),
  totalSupply: decimal("total_supply", { precision: 18, scale: 0 }),
  maxSupply: decimal("max_supply", { precision: 18, scale: 0 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock Data Schema (from Alpha Vantage/Finnhub)
export const stockAssets = pgTable("stock_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  exchange: text("exchange"),
  sector: text("sector"),
  industry: text("industry"),
  currentPrice: decimal("current_price", { precision: 18, scale: 2 }),
  open: decimal("open", { precision: 18, scale: 2 }),
  high: decimal("high", { precision: 18, scale: 2 }),
  low: decimal("low", { precision: 18, scale: 2 }),
  volume: decimal("volume", { precision: 18, scale: 0 }),
  change: decimal("change", { precision: 18, scale: 2 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  marketCap: decimal("market_cap", { precision: 18, scale: 2 }),
  peRatio: decimal("pe_ratio", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sports Events Schema (from API-Sports)
export const sportsEvents = pgTable("sports_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: text("external_id").notNull(),
  sport: text("sport").notNull(), // 'football', 'basketball', 'soccer', etc.
  league: text("league").notNull(),
  season: text("season"),
  eventName: text("event_name").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull(), // 'scheduled', 'live', 'finished', 'postponed'
  eventDate: timestamp("event_date").notNull(),
  venue: text("venue"),
  odds: text("odds"), // JSON string with betting odds
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weather Data Schema (from Open-Meteo)
export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  humidity: integer("humidity"),
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }),
  windDirection: integer("wind_direction"),
  pressure: decimal("pressure", { precision: 7, scale: 2 }),
  visibility: decimal("visibility", { precision: 10, scale: 2 }), // Wider precision for visibility in meters
  uvIndex: decimal("uv_index", { precision: 3, scale: 1 }),
  condition: text("condition"),
  conditionCode: integer("condition_code"),
  forecast: text("forecast"), // JSON string with forecast data
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint for location coordinates to support upserts
  locationIdx: sql`UNIQUE (latitude, longitude)`,
}));

// Insert Schemas
export const insertDiscoveryAssetSchema = createInsertSchema(discoveryAssets).omit({
  id: true,
  createdAt: true,
});

export const insertCryptoAssetSchema = createInsertSchema(cryptoAssets).omit({
  id: true,
  createdAt: true,
});

export const insertStockAssetSchema = createInsertSchema(stockAssets).omit({
  id: true,
  createdAt: true,
});

export const insertSportsEventSchema = createInsertSchema(sportsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({
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

// Discovery Types
export type InsertDiscoveryAsset = z.infer<typeof insertDiscoveryAssetSchema>;
export type DiscoveryAsset = typeof discoveryAssets.$inferSelect;
export type InsertCryptoAsset = z.infer<typeof insertCryptoAssetSchema>;
export type CryptoAsset = typeof cryptoAssets.$inferSelect;
export type InsertStockAsset = z.infer<typeof insertStockAssetSchema>;
export type StockAsset = typeof stockAssets.$inferSelect;
export type InsertSportsEvent = z.infer<typeof insertSportsEventSchema>;
export type SportsEvent = typeof sportsEvents.$inferSelect;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type WeatherData = typeof weatherData.$inferSelect;
