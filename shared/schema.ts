import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Paper trading account
export const paperTradingAccounts = pgTable("paper_trading_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  balance: numeric("balance").notNull().default("150000"),
  equity: numeric("equity").notNull().default("150000"),
  availableMargin: numeric("available_margin").notNull().default("150000"),
  usedMargin: numeric("used_margin").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Position status enum
export const positionStatusEnum = pgEnum("position_status", ["active", "closed"]);

// Position type enum
export const positionTypeEnum = pgEnum("position_type", ["long", "short"]);

// Positions table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => paperTradingAccounts.id),
  symbol: text("symbol").notNull(),
  type: positionTypeEnum("type").notNull(),
  entryPrice: numeric("entry_price").notNull(),
  amount: numeric("amount").notNull(),
  leverage: numeric("leverage").notNull().default("1"),
  stopLoss: numeric("stop_loss"),
  takeProfit: numeric("take_profit"),
  entryTime: timestamp("entry_time").notNull().defaultNow(),
  exitTime: timestamp("exit_time"),
  exitPrice: numeric("exit_price"),
  profitLoss: numeric("profit_loss").default("0"),
  status: positionStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
});

// Relations will be defined at the end of the file

// Order status enum
export const orderStatusEnum = pgEnum("order_status", ["pending", "filled", "cancelled", "rejected", "expired"]);

// Order type enum
export const orderTypeEnum = pgEnum("order_type", ["market", "limit", "stop", "stop_limit"]);

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => paperTradingAccounts.id),
  symbol: text("symbol").notNull(),
  type: orderTypeEnum("type").notNull(),
  side: positionTypeEnum("side").notNull(),
  amount: numeric("amount").notNull(),
  leverage: numeric("leverage").notNull().default("1"),
  limitPrice: numeric("limit_price"),
  stopPrice: numeric("stop_price"),
  stopLoss: numeric("stop_loss"),
  takeProfit: numeric("take_profit"),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  filledAt: timestamp("filled_at"),
  filledPrice: numeric("filled_price"),
  cancelledAt: timestamp("cancelled_at"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
});

// Relations will be defined at the end of the file

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
  profitLoss: numeric("profit_loss"),
  strategy: text("strategy"),
  notes: text("notes"),
  entryScreenshot: text("entry_screenshot"),
  exitScreenshot: text("exit_screenshot"),
  status: text("status").default("active"),
  tradeType: text("trade_type").notNull(),
});

// Relations will be defined at the end of the file

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
  isAdmin: true,
  level: true,
  bio: true,
  riskTolerance: true,
});

export const insertPaperTradingAccountSchema = createInsertSchema(paperTradingAccounts).pick({
  userId: true,
  balance: true,
  equity: true,
  availableMargin: true,
  usedMargin: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  userId: true,
  accountId: true,
  symbol: true,
  type: true,
  entryPrice: true,
  amount: true,
  leverage: true,
  stopLoss: true,
  takeProfit: true,
  notes: true,
}).extend({
  // Convert string to number for numeric fields
  entryPrice: z.string().transform(val => parseFloat(val)),
  amount: z.string().transform(val => parseFloat(val)),
  leverage: z.string().transform(val => parseFloat(val)),
  stopLoss: z.string().optional().transform(val => val ? parseFloat(val) : null),
  takeProfit: z.string().optional().transform(val => val ? parseFloat(val) : null),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  accountId: true,
  symbol: true,
  type: true,
  side: true,
  amount: true,
  leverage: true,
  limitPrice: true,
  stopPrice: true,
  stopLoss: true,
  takeProfit: true,
  notes: true,
}).extend({
  // Convert string to number for numeric fields
  amount: z.string().transform(val => parseFloat(val)),
  leverage: z.string().transform(val => parseFloat(val)),
  limitPrice: z.string().optional().transform(val => val ? parseFloat(val) : null),
  stopPrice: z.string().optional().transform(val => val ? parseFloat(val) : null),
  stopLoss: z.string().optional().transform(val => val ? parseFloat(val) : null),
  takeProfit: z.string().optional().transform(val => val ? parseFloat(val) : null),
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  userId: true,
  pair: true,
  amount: true,
  entryPrice: true,
  exitPrice: true,
  profitLoss: true,
  strategy: true,
  notes: true,
  tradeType: true,
}).extend({
  // Convert string to number for numeric fields
  amount: z.string().transform(val => parseFloat(val)),
  entryPrice: z.string().transform(val => parseFloat(val)),
  exitPrice: z.string().optional().transform(val => val ? parseFloat(val) : null),
  profitLoss: z.string().optional().transform(val => val ? parseFloat(val) : null),
});

export const insertTradingPairSchema = createInsertSchema(tradingPairs).pick({
  pair: true,
});

export const insertStrategyTypeSchema = createInsertSchema(strategyTypes).pick({
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPaperTradingAccount = z.infer<typeof insertPaperTradingAccountSchema>;
export type PaperTradingAccount = typeof paperTradingAccounts.$inferSelect;

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export type InsertTradingPair = z.infer<typeof insertTradingPairSchema>;
export type TradingPair = typeof tradingPairs.$inferSelect;

export type InsertStrategyType = z.infer<typeof insertStrategyTypeSchema>;
export type StrategyType = typeof strategyTypes.$inferSelect;

// All relations are defined after the table definitions to avoid circular references
export const usersRelations = relations(users, ({ one, many }) => ({
  paperAccount: one(paperTradingAccounts, {
    fields: [users.id],
    references: [paperTradingAccounts.userId],
  }),
  trades: many(trades),
  orders: many(orders),
  positions: many(positions),
}));

export const paperTradingAccountsRelations = relations(paperTradingAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [paperTradingAccounts.userId],
    references: [users.id],
  }),
  positions: many(positions),
  orders: many(orders),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  user: one(users, {
    fields: [positions.userId],
    references: [users.id],
  }),
  account: one(paperTradingAccounts, {
    fields: [positions.accountId],
    references: [paperTradingAccounts.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  account: one(paperTradingAccounts, {
    fields: [orders.accountId],
    references: [paperTradingAccounts.id],
  }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
}));
