import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { storage } from "./storage";
import { 
  insertTradeSchema, 
  insertTradingPairSchema, 
  insertStrategyTypeSchema, 
  insertPositionSchema,
  Trade,
  insertOrderSchema,
  Position,
  PaperTradingAccount
} from "@shared/schema";
import { z } from "zod";
import { aiService } from "./services/aiService";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication (includes /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me)
  setupAuth(app);
  
  // Create HTTP server for both Express and WebSocket
  const httpServer = createServer(app);
  
  // Create WebSocket server (different path from Vite HMR)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Extend WebSocket type to include custom properties
  interface ExtendedWebSocket extends WebSocket {
    symbol?: string;
    userId?: number;
    isAlive: boolean;
  }
  
  // Handle WebSocket connections
  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('WebSocket client connected');
    
    // Mark socket as alive for ping/pong
    ws.isAlive = true;
    
    // Handle pong responses to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Capitulre trading platform'
    }));
    
    // Handle messages from clients
    ws.on('message', (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'subscribe' && data.symbol) {
          // Subscribe to price updates for symbol
          ws.symbol = data.symbol;
          ws.send(JSON.stringify({
            type: 'subscribed',
            symbol: data.symbol
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Ping clients every 30 seconds to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const extWs = ws as ExtendedWebSocket;
      
      if (extWs.isAlive === false) {
        return ws.terminate();
      }
      
      extWs.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  // Clear interval when server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };
  
  // Middleware to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    next();
  };
  
  // Trading pairs API
  app.get("/api/trading-pairs", async (_req: Request, res: Response) => {
    try {
      const pairs = await storage.getTradingPairs();
      return res.status(200).json(pairs);
    } catch (error) {
      console.error("Get trading pairs error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.post("/api/trading-pairs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const pairInput = insertTradingPairSchema.safeParse(req.body);
      
      if (!pairInput.success) {
        return res.status(400).json({ 
          error: pairInput.error.format() 
        });
      }
      
      const newPair = await storage.createTradingPair(pairInput.data);
      
      return res.status(201).json(newPair);
    } catch (error) {
      console.error("Create trading pair error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  // Strategy types API
  app.get("/api/strategy-types", async (_req: Request, res: Response) => {
    try {
      const strategies = await storage.getStrategyTypes();
      return res.status(200).json(strategies);
    } catch (error) {
      console.error("Get strategy types error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.post("/api/strategy-types", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const strategyInput = insertStrategyTypeSchema.safeParse(req.body);
      
      if (!strategyInput.success) {
        return res.status(400).json({ 
          error: strategyInput.error.format() 
        });
      }
      
      const newStrategy = await storage.createStrategyType(strategyInput.data);
      
      return res.status(201).json(newStrategy);
    } catch (error) {
      console.error("Create strategy type error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  // Trades API
  app.get("/api/trades", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const trades = await storage.getTrades(req.user.id);
      
      return res.status(200).json(trades);
    } catch (error) {
      console.error("Get trades error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.get("/api/trades/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const tradeId = parseInt(req.params.id);
      
      if (isNaN(tradeId)) {
        return res.status(400).json({ 
          error: "Invalid trade ID" 
        });
      }
      
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ 
          error: "Trade not found" 
        });
      }
      
      // Ensure user can only access their own trades
      if (trade.userId !== req.user.id) {
        return res.status(403).json({ 
          error: "Access denied" 
        });
      }
      
      return res.status(200).json(trade);
    } catch (error) {
      console.error("Get trade error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.post("/api/trades", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      // Add userId to the trade data
      const tradeData = {
        ...req.body,
        userId: req.user.id
      };
      
      const tradeInput = insertTradeSchema.safeParse(tradeData);
      
      if (!tradeInput.success) {
        return res.status(400).json({ 
          error: tradeInput.error.format() 
        });
      }
      
      const newTrade = await storage.createTrade(tradeInput.data);
      
      return res.status(201).json(newTrade);
    } catch (error) {
      console.error("Create trade error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.put("/api/trades/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const tradeId = parseInt(req.params.id);
      
      if (isNaN(tradeId)) {
        return res.status(400).json({ 
          error: "Invalid trade ID" 
        });
      }
      
      const existingTrade = await storage.getTrade(tradeId);
      
      if (!existingTrade) {
        return res.status(404).json({ 
          error: "Trade not found" 
        });
      }
      
      // Ensure user can only update their own trades
      if (existingTrade.userId !== req.user.id) {
        return res.status(403).json({ 
          error: "Access denied" 
        });
      }
      
      // Update the trade
      const updatedTrade = await storage.updateTrade(tradeId, req.body);
      
      return res.status(200).json(updatedTrade);
    } catch (error) {
      console.error("Update trade error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.delete("/api/trades/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const tradeId = parseInt(req.params.id);
      
      if (isNaN(tradeId)) {
        return res.status(400).json({ 
          error: "Invalid trade ID" 
        });
      }
      
      const existingTrade = await storage.getTrade(tradeId);
      
      if (!existingTrade) {
        return res.status(404).json({ 
          error: "Trade not found" 
        });
      }
      
      // Ensure user can only delete their own trades
      if (existingTrade.userId !== req.user.id) {
        return res.status(403).json({ 
          error: "Access denied" 
        });
      }
      
      // Delete the trade
      const success = await storage.deleteTrade(tradeId);
      
      if (success) {
        return res.status(204).end();
      } else {
        return res.status(500).json({ 
          error: "Failed to delete trade" 
        });
      }
    } catch (error) {
      console.error("Delete trade error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  // Paper Trading Account API
  app.get("/api/paper-trading-account", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const account = await storage.getPaperTradingAccount(req.user.id);
      
      if (!account) {
        // Create a new account with default balance if none exists
        const newAccount = await storage.createPaperTradingAccount({
          userId: req.user.id,
          balance: "150000",
          equity: "150000",
          availableMargin: "150000",
          usedMargin: "0",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return res.status(200).json(newAccount);
      }
      
      return res.status(200).json(account);
    } catch (error) {
      console.error("Get paper trading account error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  // Position API
  app.get("/api/positions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const status = req.query.status as string;
      const positions = await storage.getPositions(req.user.id, status as 'active' | 'closed');
      
      return res.status(200).json(positions);
    } catch (error) {
      console.error("Get positions error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.post("/api/positions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      // Get user account
      const account = await storage.getPaperTradingAccount(req.user.id);
      
      if (!account) {
        return res.status(404).json({ error: "Trading account not found" });
      }
      
      // Add userId to the position data
      const positionData = {
        ...req.body,
        userId: req.user.id,
        accountId: account.id
      };
      
      const positionInput = insertPositionSchema.safeParse(positionData);
      
      if (!positionInput.success) {
        return res.status(400).json({ 
          error: positionInput.error.format() 
        });
      }
      
      // Check if user has enough margin
      const requiredMargin = parseFloat(String(positionInput.data.amount)) * parseFloat(String(positionInput.data.leverage));
      const availableMargin = parseFloat(account.availableMargin);
      
      if (requiredMargin > availableMargin) {
        return res.status(400).json({ 
          error: "Insufficient margin available"
        });
      }
      
      // Create the position
      const newPosition = await storage.createPosition(positionInput.data);
      
      // Update account margins
      const updatedMargin = (parseFloat(account.usedMargin) + requiredMargin).toString();
      const updatedAvailableMargin = (parseFloat(account.availableMargin) - requiredMargin).toString();
      
      await storage.updatePaperTradingAccount(req.user.id, {
        usedMargin: updatedMargin,
        availableMargin: updatedAvailableMargin,
        updatedAt: new Date()
      });
      
      return res.status(201).json(newPosition);
    } catch (error) {
      console.error("Create position error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.put("/api/positions/:id/close", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User ID not found" });
      }
      
      const positionId = parseInt(req.params.id);
      const exitPrice = parseFloat(req.body.exitPrice);
      
      if (isNaN(positionId)) {
        return res.status(400).json({ error: "Invalid position ID" });
      }
      
      if (isNaN(exitPrice) || exitPrice <= 0) {
        return res.status(400).json({ error: "Invalid exit price" });
      }
      
      // Get the position
      const position = await storage.getPosition(positionId);
      
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Check if user owns the position
      if (position.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if position is already closed
      if (position.status === 'closed') {
        return res.status(400).json({ error: "Position is already closed" });
      }
      
      // Close the position
      const closedPosition = await storage.closePosition(positionId, exitPrice);
      
      if (!closedPosition) {
        return res.status(500).json({ error: "Failed to close position" });
      }
      
      // Get user account to update margins
      const account = await storage.getPaperTradingAccount(req.user.id);
      
      if (account) {
        // Calculate P/L
        const entryPrice = parseFloat(position.entryPrice);
        const amount = parseFloat(position.amount);
        const leverage = parseFloat(position.leverage);
        const profitLoss = position.type === 'long' 
          ? (exitPrice - entryPrice) * amount * leverage
          : (entryPrice - exitPrice) * amount * leverage;
        
        // Update account
        const requiredMargin = parseFloat(position.amount) * parseFloat(position.leverage);
        const newUsedMargin = (parseFloat(account.usedMargin) - requiredMargin).toString();
        const newAvailableMargin = (parseFloat(account.availableMargin) + requiredMargin).toString();
        const newBalance = (parseFloat(account.balance) + profitLoss).toString();
        const newEquity = (parseFloat(account.equity) + profitLoss).toString();
        
        await storage.updatePaperTradingAccount(req.user.id, {
          balance: newBalance,
          equity: newEquity,
          usedMargin: newUsedMargin,
          availableMargin: newAvailableMargin,
          updatedAt: new Date()
        });
      }
      
      return res.status(200).json(closedPosition);
    } catch (error) {
      console.error("Close position error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // AI Service API
  app.post("/api/ai/analyze-chart", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { chartData, timeframe, symbol } = req.body;
      
      if (!chartData || !timeframe || !symbol) {
        return res.status(400).json({ error: "Missing required data" });
      }
      
      const analysis = await aiService.analyzeChart(chartData, timeframe, symbol);
      
      return res.status(200).json({ analysis });
    } catch (error) {
      console.error("AI chart analysis error:", error);
      return res.status(500).json({ error: "Failed to analyze chart" });
    }
  });
  
  app.post("/api/ai/wyckoff-coach", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { chartData, timeframe, symbol } = req.body;
      
      if (!chartData || !timeframe || !symbol) {
        return res.status(400).json({ error: "Missing required data" });
      }
      
      const analysis = await aiService.wyckoffAnalysis(chartData, timeframe, symbol);
      
      return res.status(200).json({ analysis });
    } catch (error) {
      console.error("AI Wyckoff analysis error:", error);
      return res.status(500).json({ error: "Failed to analyze chart with Wyckoff methodology" });
    }
  });
  
  app.post("/api/ai/analyze-chart-image", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { imageBase64, notes } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing image data" });
      }
      
      const analysis = await aiService.analyzeChartImage(imageBase64, notes || "");
      
      return res.status(200).json({ analysis });
    } catch (error) {
      console.error("AI chart image analysis error:", error);
      return res.status(500).json({ error: "Failed to analyze chart image" });
    }
  });
  
  app.post("/api/ai/ask", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }
      
      // Get user trades to provide context
      let trades: Trade[] = [];
      if (req.user?.id) {
        trades = await storage.getTrades(req.user.id);
      }
      
      const response = await aiService.askQuestion(question, trades);
      
      return res.status(200).json({ response });
    } catch (error) {
      console.error("AI question error:", error);
      return res.status(500).json({ error: "Failed to answer question" });
    }
  });
  
  // Return the HTTP server to be used in the main app
  return httpServer;
}