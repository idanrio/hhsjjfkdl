import { users, trades, tradingPairs, strategyTypes, 
  type User, type InsertUser, 
  type Trade, type InsertTrade, 
  type TradingPair, type InsertTradingPair, 
  type StrategyType, type InsertStrategyType 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trades: Map<number, Trade>;
  private tradingPairs: Map<number, TradingPair>;
  private strategyTypes: Map<number, StrategyType>;
  private userCurrentId: number;
  private tradeCurrentId: number;
  private pairCurrentId: number;
  private strategyCurrentId: number;

  constructor() {
    this.users = new Map();
    this.trades = new Map();
    this.tradingPairs = new Map();
    this.strategyTypes = new Map();
    this.userCurrentId = 1;
    this.tradeCurrentId = 1;
    this.pairCurrentId = 1;
    this.strategyCurrentId = 1;
    
    // Initialize with some default data
    this.setupDefaultData();
  }

  private setupDefaultData() {
    // Create default trading pairs
    const defaultPairs = ['BTC/USD', 'ETH/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD'];
    defaultPairs.forEach(pair => {
      this.createTradingPair({ pair });
    });
    
    // Create default strategy types
    const defaultStrategies = ['MACD Crossover', 'RSI Oversold/Overbought', 'Bollinger Bands', 'Moving Average', 'Support/Resistance'];
    defaultStrategies.forEach(name => {
      this.createStrategyType({ name });
    });
    
    // Create demo user
    this.createUser({
      username: 'demo',
      password: 'demo123',
      email: 'demo@capitulre.com'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + 30); // 30 days from now
    
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false,
      level: 1,
      expiryDate,
      bio: null,
      riskTolerance: null,
      email: insertUser.email || null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUserLevel(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Count user's trades
    let tradeCount = 0;
    const tradesArray = Array.from(this.trades.values());
    for (const trade of tradesArray) {
      if (trade.userId === userId) {
        tradeCount++;
      }
    }
    
    // Update user level (1 level per 10 trades, max level 10)
    const newLevel = Math.min(10, Math.floor(tradeCount / 10) + 1);
    
    this.users.set(userId, {
      ...user,
      level: newLevel
    });
  }
  
  // Trade operations
  async getTrades(userId: number): Promise<Trade[]> {
    const userTrades: Trade[] = [];
    
    // Convert to array first to avoid iteration issues
    const tradesArray = Array.from(this.trades.values());
    for (const trade of tradesArray) {
      if (trade.userId === userId) {
        userTrades.push(trade);
      }
    }
    
    return userTrades;
  }
  
  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }
  
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.tradeCurrentId++;
    const now = new Date();
    
    // Convert numeric values to strings for storage
    const trade: Trade = {
      id,
      userId: insertTrade.userId,
      date: now,
      endDate: null,
      pair: insertTrade.pair,
      amount: String(insertTrade.amount),
      entryPrice: String(insertTrade.entryPrice),
      exitPrice: insertTrade.exitPrice !== null ? String(insertTrade.exitPrice) : null,
      strategy: insertTrade.strategy || null,
      notes: insertTrade.notes || null,
      entryScreenshot: null,
      exitScreenshot: null,
      status: insertTrade.exitPrice ? 'completed' : 'active',
      tradeType: insertTrade.tradeType
    };
    
    this.trades.set(id, trade);
    
    // Update user level after adding a trade
    await this.updateUserLevel(insertTrade.userId);
    
    return trade;
  }
  
  async updateTrade(id: number, tradeUpdate: Partial<InsertTrade>): Promise<Trade | undefined> {
    const existingTrade = await this.getTrade(id);
    if (!existingTrade) return undefined;
    
    // Create a processed update object with proper type conversions
    const processedUpdate: Partial<Trade> = {};
    
    // Only include fields that exist in the update
    if (tradeUpdate.pair !== undefined) {
      processedUpdate.pair = tradeUpdate.pair;
    }
    
    if (tradeUpdate.amount !== undefined) {
      processedUpdate.amount = String(tradeUpdate.amount);
    }
    
    if (tradeUpdate.entryPrice !== undefined) {
      processedUpdate.entryPrice = String(tradeUpdate.entryPrice);
    }
    
    if (tradeUpdate.exitPrice !== undefined) {
      processedUpdate.exitPrice = tradeUpdate.exitPrice !== null ? String(tradeUpdate.exitPrice) : null;
      // If exitPrice is provided, update status to completed
      processedUpdate.status = tradeUpdate.exitPrice !== null ? 'completed' : existingTrade.status;
      // Also set endDate if completing the trade
      if (tradeUpdate.exitPrice !== null) {
        processedUpdate.endDate = new Date();
      }
    }
    
    if (tradeUpdate.strategy !== undefined) {
      processedUpdate.strategy = tradeUpdate.strategy;
    }
    
    if (tradeUpdate.notes !== undefined) {
      processedUpdate.notes = tradeUpdate.notes;
    }
    
    if (tradeUpdate.tradeType !== undefined) {
      processedUpdate.tradeType = tradeUpdate.tradeType;
    }
    
    const updatedTrade: Trade = {
      ...existingTrade,
      ...processedUpdate
    };
    
    this.trades.set(id, updatedTrade);
    
    return updatedTrade;
  }
  
  async deleteTrade(id: number): Promise<boolean> {
    const trade = await this.getTrade(id);
    if (!trade) return false;
    
    const success = this.trades.delete(id);
    
    if (success) {
      // Update user level after deleting a trade
      await this.updateUserLevel(trade.userId);
    }
    
    return success;
  }
  
  // Trading pairs operations
  async getTradingPairs(): Promise<TradingPair[]> {
    return Array.from(this.tradingPairs.values());
  }
  
  async createTradingPair(insertPair: InsertTradingPair): Promise<TradingPair> {
    const id = this.pairCurrentId++;
    
    const pair: TradingPair = {
      id,
      pair: insertPair.pair
    };
    
    this.tradingPairs.set(id, pair);
    return pair;
  }
  
  async deleteTradingPair(id: number): Promise<boolean> {
    return this.tradingPairs.delete(id);
  }
  
  // Strategy types operations
  async getStrategyTypes(): Promise<StrategyType[]> {
    return Array.from(this.strategyTypes.values());
  }
  
  async createStrategyType(insertStrategy: InsertStrategyType): Promise<StrategyType> {
    const id = this.strategyCurrentId++;
    
    const strategy: StrategyType = {
      id,
      name: insertStrategy.name
    };
    
    this.strategyTypes.set(id, strategy);
    return strategy;
  }
  
  async deleteStrategyType(id: number): Promise<boolean> {
    return this.strategyTypes.delete(id);
  }
}

export const storage = new MemStorage();
