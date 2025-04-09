import { 
  users, trades, tradingPairs, strategyTypes, 
  paperTradingAccounts, positions, orders, verificationCodes,
  type User, type InsertUser, 
  type Trade, type InsertTrade, 
  type TradingPair, type InsertTradingPair, 
  type StrategyType, type InsertStrategyType,
  type PaperTradingAccount, type InsertPaperTradingAccount,
  type Position, type InsertPosition,
  type Order, type InsertOrder,
  type VerificationCode, type InsertVerificationCode
} from "@shared/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLevel(userId: number): Promise<void>;
  
  // Trade operations
  getTrades(userId: number): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, trade: Partial<InsertTrade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;
  
  // Trading pairs operations
  getTradingPairs(): Promise<TradingPair[]>;
  createTradingPair(pair: InsertTradingPair): Promise<TradingPair>;
  deleteTradingPair(id: number): Promise<boolean>;
  
  // Strategy types operations
  getStrategyTypes(): Promise<StrategyType[]>;
  createStrategyType(strategy: InsertStrategyType): Promise<StrategyType>;
  deleteStrategyType(id: number): Promise<boolean>;
  
  // Paper trading account operations
  getPaperTradingAccount(userId: number): Promise<PaperTradingAccount | undefined>;
  createPaperTradingAccount(account: InsertPaperTradingAccount): Promise<PaperTradingAccount>;
  updatePaperTradingAccount(userId: number, updates: Partial<PaperTradingAccount>): Promise<PaperTradingAccount | undefined>;
  
  // Position operations
  getPositions(userId: number, status?: 'active' | 'closed'): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, updates: Partial<Position>): Promise<Position | undefined>;
  closePosition(id: number, exitPrice: number): Promise<Position | undefined>;
  
  // Order operations
  getOrders(userId: number, status?: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  cancelOrder(id: number): Promise<Order | undefined>;
  fillOrder(id: number, filledPrice: number): Promise<Order | undefined>;
  
  // Verification code operations
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getVerificationCode(userId: number, code: string): Promise<VerificationCode | undefined>;
  markVerificationCodeAsUsed(id: number): Promise<VerificationCode | undefined>;
  hasRecentVerificationCode(userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Create paper trading account for new user with $150,000 starting balance
    await this.createPaperTradingAccount({
      userId: user.id,
      balance: "150000",
      equity: "150000",
      availableMargin: "150000",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return user;
  }
  
  async updateUserLevel(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Count user's trades
    const userTrades = await this.getTrades(userId);
    const tradeCount = userTrades.length;
    
    // Update user level (1 level per 10 trades, max level 10)
    const newLevel = Math.min(10, Math.floor(tradeCount / 10) + 1);
    
    await db.update(users)
      .set({ level: newLevel })
      .where(eq(users.id, userId));
  }
  
  // Trade operations
  async getTrades(userId: number): Promise<Trade[]> {
    return await db.select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.date));
  }
  
  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }
  
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const status = insertTrade.exitPrice ? 'completed' : 'active';
    const endDate = insertTrade.exitPrice ? new Date() : null;
    
    // Convert numeric values to strings for database
    const tradeData = {
      ...insertTrade,
      amount: insertTrade.amount.toString(),
      entryPrice: insertTrade.entryPrice.toString(),
      exitPrice: insertTrade.exitPrice?.toString(),
      profitLoss: insertTrade.profitLoss?.toString(),
      status,
      endDate
    };
    
    const [trade] = await db.insert(trades)
      .values(tradeData)
      .returning();
    
    // Update user level after adding a trade
    await this.updateUserLevel(insertTrade.userId);
    
    return trade;
  }
  
  async updateTrade(id: number, tradeUpdate: Partial<InsertTrade>): Promise<Trade | undefined> {
    const existingTrade = await this.getTrade(id);
    if (!existingTrade) return undefined;
    
    let status = existingTrade.status;
    let endDate = existingTrade.endDate;
    
    // If exitPrice is provided, update status to completed
    if (tradeUpdate.exitPrice !== undefined && tradeUpdate.exitPrice !== null) {
      status = 'completed';
      endDate = new Date();
    }
    
    // Convert numeric values to strings for database
    const tradeData: any = {
      status,
      endDate
    };
    
    if (tradeUpdate.amount !== undefined) {
      tradeData.amount = tradeUpdate.amount.toString();
    }
    
    if (tradeUpdate.entryPrice !== undefined) {
      tradeData.entryPrice = tradeUpdate.entryPrice.toString(); 
    }
    
    if (tradeUpdate.exitPrice !== undefined) {
      tradeData.exitPrice = tradeUpdate.exitPrice.toString();
    }
    
    if (tradeUpdate.profitLoss !== undefined) {
      tradeData.profitLoss = tradeUpdate.profitLoss.toString();
    }
    
    // Copy other non-numeric fields
    if (tradeUpdate.pair !== undefined) tradeData.pair = tradeUpdate.pair;
    if (tradeUpdate.strategy !== undefined) tradeData.strategy = tradeUpdate.strategy;
    if (tradeUpdate.notes !== undefined) tradeData.notes = tradeUpdate.notes;
    if (tradeUpdate.tradeType !== undefined) tradeData.tradeType = tradeUpdate.tradeType;
    
    const [updatedTrade] = await db.update(trades)
      .set(tradeData)
      .where(eq(trades.id, id))
      .returning();
    
    return updatedTrade;
  }
  
  async deleteTrade(id: number): Promise<boolean> {
    const trade = await this.getTrade(id);
    if (!trade) return false;
    
    await db.delete(trades).where(eq(trades.id, id));
    
    // Update user level after deleting a trade
    await this.updateUserLevel(trade.userId);
    
    return true;
  }
  
  // Trading pairs operations
  async getTradingPairs(): Promise<TradingPair[]> {
    return await db.select().from(tradingPairs);
  }
  
  async createTradingPair(insertPair: InsertTradingPair): Promise<TradingPair> {
    const [pair] = await db.insert(tradingPairs)
      .values(insertPair)
      .returning();
    
    return pair;
  }
  
  async deleteTradingPair(id: number): Promise<boolean> {
    await db.delete(tradingPairs).where(eq(tradingPairs.id, id));
    return true;
  }
  
  // Strategy types operations
  async getStrategyTypes(): Promise<StrategyType[]> {
    return await db.select().from(strategyTypes);
  }
  
  async createStrategyType(insertStrategy: InsertStrategyType): Promise<StrategyType> {
    const [strategy] = await db.insert(strategyTypes)
      .values(insertStrategy)
      .returning();
    
    return strategy;
  }
  
  async deleteStrategyType(id: number): Promise<boolean> {
    await db.delete(strategyTypes).where(eq(strategyTypes.id, id));
    return true;
  }
  
  // Paper trading account operations
  async getPaperTradingAccount(userId: number): Promise<PaperTradingAccount | undefined> {
    const [account] = await db.select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.userId, userId));
    
    return account;
  }
  
  async createPaperTradingAccount(insertAccount: InsertPaperTradingAccount): Promise<PaperTradingAccount> {
    const [account] = await db.insert(paperTradingAccounts)
      .values({
        ...insertAccount,
        equity: insertAccount.balance,
        availableMargin: insertAccount.balance,
        usedMargin: "0",
      })
      .returning();
    
    return account;
  }
  
  async updatePaperTradingAccount(userId: number, updates: Partial<PaperTradingAccount>): Promise<PaperTradingAccount | undefined> {
    const account = await this.getPaperTradingAccount(userId);
    if (!account) return undefined;
    
    const [updatedAccount] = await db.update(paperTradingAccounts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(paperTradingAccounts.userId, userId))
      .returning();
    
    return updatedAccount;
  }
  
  // Position operations
  async getPositions(userId: number, status?: 'active' | 'closed'): Promise<Position[]> {
    let query = db.select()
      .from(positions)
      .where(eq(positions.userId, userId));
    
    if (status) {
      query = query.where(eq(positions.status, status));
    }
    
    return await query.orderBy(desc(positions.entryTime));
  }
  
  async getPosition(id: number): Promise<Position | undefined> {
    const [position] = await db.select()
      .from(positions)
      .where(eq(positions.id, id));
    
    return position;
  }
  
  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    // Get the user's paper trading account
    const account = await this.getPaperTradingAccount(insertPosition.userId);
    if (!account) {
      throw new Error("User does not have a paper trading account");
    }
    
    // Calculate margin required for position
    const positionValue = Number(insertPosition.amount) * Number(insertPosition.entryPrice);
    const marginRequired = positionValue / Number(insertPosition.leverage);
    
    // Check if user has enough available margin
    if (Number(account.availableMargin) < marginRequired) {
      throw new Error("Insufficient margin available");
    }
    
    // Create the position
    const [position] = await db.insert(positions)
      .values({
        ...insertPosition,
        accountId: account.id,
        profitLoss: "0",
        status: "active"
      })
      .returning();
    
    // Update account balance and margin
    const usedMargin = Number(account.usedMargin) + marginRequired;
    const availableMargin = Number(account.balance) - usedMargin;
    
    await this.updatePaperTradingAccount(insertPosition.userId, {
      usedMargin: usedMargin.toString(),
      availableMargin: availableMargin.toString(),
      equity: account.balance, // Initially equity equals balance
    });
    
    return position;
  }
  
  async updatePosition(id: number, updates: Partial<Position>): Promise<Position | undefined> {
    const position = await this.getPosition(id);
    if (!position) return undefined;
    
    const [updatedPosition] = await db.update(positions)
      .set(updates)
      .where(eq(positions.id, id))
      .returning();
    
    return updatedPosition;
  }
  
  async closePosition(id: number, exitPrice: number): Promise<Position | undefined> {
    const position = await this.getPosition(id);
    if (!position) return undefined;
    if (position.status === 'closed') return position;
    
    // Calculate profit/loss
    let profitLoss = 0;
    if (position.type === 'long') {
      profitLoss = (exitPrice - Number(position.entryPrice)) * Number(position.amount) * Number(position.leverage);
    } else { // short
      profitLoss = (Number(position.entryPrice) - exitPrice) * Number(position.amount) * Number(position.leverage);
    }
    
    // Update position
    const [updatedPosition] = await db.update(positions)
      .set({
        status: 'closed',
        exitPrice: exitPrice.toString(),
        exitTime: new Date(),
        profitLoss: profitLoss.toString()
      })
      .where(eq(positions.id, id))
      .returning();
    
    // Update account balance and margin
    const account = await this.getPaperTradingAccount(position.userId);
    if (account) {
      const positionValue = Number(position.amount) * Number(position.entryPrice);
      const marginUsed = positionValue / Number(position.leverage);
      
      const newUsedMargin = Math.max(0, Number(account.usedMargin) - marginUsed);
      const newBalance = Number(account.balance) + profitLoss;
      const newEquity = newBalance;
      const newAvailableMargin = newBalance - newUsedMargin;
      
      await this.updatePaperTradingAccount(position.userId, {
        balance: newBalance.toString(),
        equity: newEquity.toString(),
        usedMargin: newUsedMargin.toString(),
        availableMargin: newAvailableMargin.toString()
      });
    }
    
    return updatedPosition;
  }
  
  // Order operations
  async getOrders(userId: number, status?: string): Promise<Order[]> {
    let query = db.select()
      .from(orders)
      .where(eq(orders.userId, userId));
    
    if (status) {
      query = query.where(eq(orders.status, status));
    }
    
    return await query.orderBy(desc(orders.createdAt));
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select()
      .from(orders)
      .where(eq(orders.id, id));
    
    return order;
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders)
      .values(insertOrder)
      .returning();
    
    return order;
  }
  
  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const [updatedOrder] = await db.update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }
  
  async cancelOrder(id: number): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    if (order.status !== 'pending') return order;
    
    const [updatedOrder] = await db.update(orders)
      .set({
        status: 'cancelled',
        cancelledAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }
  
  async fillOrder(id: number, filledPrice: number): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    if (order.status !== 'pending') return order;
    
    // Update order status
    const [updatedOrder] = await db.update(orders)
      .set({
        status: 'filled',
        filledAt: new Date(),
        filledPrice: filledPrice.toString()
      })
      .where(eq(orders.id, id))
      .returning();
    
    // Create a position from the filled order
    if (updatedOrder) {
      await this.createPosition({
        userId: updatedOrder.userId,
        accountId: updatedOrder.accountId,
        symbol: updatedOrder.symbol,
        type: updatedOrder.side,
        entryPrice: filledPrice.toString(),
        amount: updatedOrder.amount.toString(),
        leverage: updatedOrder.leverage.toString(),
        stopLoss: updatedOrder.stopLoss?.toString() || null,
        takeProfit: updatedOrder.takeProfit?.toString() || null,
        notes: updatedOrder.notes || null
      });
    }
    
    return updatedOrder;
  }
  
  // Verification code operations
  async createVerificationCode(insertCode: InsertVerificationCode): Promise<VerificationCode> {
    const [code] = await db.insert(verificationCodes)
      .values({
        ...insertCode,
        isUsed: false,
        createdAt: new Date()
      })
      .returning();
    
    return code;
  }
  
  async getVerificationCode(userId: number, code: string): Promise<VerificationCode | undefined> {
    const [verificationCode] = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code),
          eq(verificationCodes.isUsed, false)
        )
      );
    
    return verificationCode;
  }
  
  async markVerificationCodeAsUsed(id: number): Promise<VerificationCode | undefined> {
    const [verificationCode] = await db.update(verificationCodes)
      .set({ isUsed: true })
      .where(eq(verificationCodes.id, id))
      .returning();
    
    return verificationCode;
  }
  
  async hasRecentVerificationCode(userId: number): Promise<boolean> {
    // Check if user has a code that was created in the last 3 minutes
    const threeMinutesAgo = new Date();
    threeMinutesAgo.setMinutes(threeMinutesAgo.getMinutes() - 3);
    
    const [code] = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.isUsed, false),
          sql`${verificationCodes.createdAt} > ${threeMinutesAgo}`
        )
      )
      .limit(1);
    
    return !!code;
  }
}

export const storage = new DatabaseStorage();
