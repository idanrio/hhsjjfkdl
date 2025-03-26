import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false),
  level: integer("level").default(1),
  expiryDate: timestamp("expiry_date").defaultNow(),
  bio: text("bio"),
  riskTolerance: text("risk_tolerance"),
});

export const tradeStatusEnum = pgEnum("trade_status", ["active", "completed"]);
export const tradeTypeEnum = pgEnum("trade_type", ["long", "short"]);

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  pair: text("pair").notNull(),
  amount: numeric("amount").notNull(),
  entryPrice: numeric("entry_price").notNull(),
  exitPrice: numeric("exit_price"),
  strategy: text("strategy"),
  notes: text("notes"),
  entryScreenshot: text("entry_screenshot"),
  exitScreenshot: text("exit_screenshot"),
  status: text("status").default("active"),
  tradeType: text("trade_type").notNull(),
});

export const tradingPairs = pgTable("trading_pairs", {
  id: serial("id").primaryKey(),
  pair: text("pair").notNull(),
});

export const strategyTypes = pgTable("strategy_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  userId: true,
  pair: true,
  amount: true,
  entryPrice: true,
  exitPrice: true,
  strategy: true,
  notes: true,
  tradeType: true,
}).extend({
  // Convert string to number for numeric fields
  amount: z.string().transform(val => parseFloat(val)),
  entryPrice: z.string().transform(val => parseFloat(val)),
  exitPrice: z.string().optional().transform(val => val ? parseFloat(val) : null),
});

export const insertTradingPairSchema = createInsertSchema(tradingPairs).pick({
  pair: true,
});

export const insertStrategyTypeSchema = createInsertSchema(strategyTypes).pick({
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export type InsertTradingPair = z.infer<typeof insertTradingPairSchema>;
export type TradingPair = typeof tradingPairs.$inferSelect;

export type InsertStrategyType = z.infer<typeof insertStrategyTypeSchema>;
export type StrategyType = typeof strategyTypes.$inferSelect;
