import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertTradeSchema, insertTradingPairSchema, insertStrategyTypeSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { aiService } from "./services/aiService";

// Extend the Express session with our user ID
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: "Missing username or password"
        });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ 
          error: "Invalid username or password"
        });
      }
      
      // Set user session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        bio: user.bio,
        riskTolerance: user.riskTolerance
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userInput = insertUserSchema.safeParse(req.body);
      
      if (!userInput.success) {
        return res.status(400).json({ 
          error: userInput.error.format() 
        });
      }
      
      const existingUser = await storage.getUserByUsername(userInput.data.username);
      
      if (existingUser) {
        return res.status(409).json({ 
          error: "Username already exists" 
        });
      }
      
      const newUser = await storage.createUser(userInput.data);
      
      // Set user session
      if (req.session) {
        req.session.userId = newUser.id;
      }
      
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        level: newUser.level
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        error: "Not authenticated" 
      });
    }
    next();
  };

  // Middleware to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        error: "Not authenticated" 
      });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        error: "Not authorized" 
      });
    }
    
    next();
  };

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ 
          error: "User not found" 
        });
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        bio: user.bio,
        riskTolerance: user.riskTolerance,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ 
            error: "Failed to logout" 
          });
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({ 
          message: "Logged out successfully" 
        });
      });
    } else {
      return res.status(200).json({ 
        message: "Already logged out" 
      });
    }
  });

  // Trading pairs API
  app.get("/api/trading-pairs", async (_, res) => {
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

  app.post("/api/trading-pairs", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
      }
      
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
  app.get("/api/strategy-types", async (_, res) => {
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

  app.post("/api/strategy-types", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
      }
      
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
  app.get("/api/trades", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
      }
      
      const trades = await storage.getTrades(req.session.userId);
      
      return res.status(200).json(trades);
    } catch (error) {
      console.error("Get trades error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  app.get("/api/trades/:id", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
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
      if (trade.userId !== req.session.userId) {
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

  app.post("/api/trades", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
      }
      
      // Add userId to the trade data
      const tradeData = {
        ...req.body,
        userId: req.session.userId
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

  app.put("/api/trades/:id", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
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
      if (existingTrade.userId !== req.session.userId) {
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

  app.delete("/api/trades/:id", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
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
      if (existingTrade.userId !== req.session.userId) {
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

  // Metrics API
  app.get("/api/metrics/trades", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          error: "Not authenticated" 
        });
      }
      
      const trades = await storage.getTrades(req.session.userId);
      
      // Calculate metrics
      const totalTrades = trades.length;
      const completedTrades = trades.filter(trade => trade.status === 'completed').length;
      const activeTrades = trades.filter(trade => trade.status === 'active').length;
      
      // Win rate calculation
      let winningTrades = 0;
      let totalProfitLoss = 0;
      
      trades.forEach(trade => {
        if (trade.status === 'completed' && trade.exitPrice && trade.entryPrice) {
          const isLong = trade.tradeType === 'long';
          const isWinning = isLong ? 
            trade.exitPrice > trade.entryPrice : 
            trade.exitPrice < trade.entryPrice;
          
          if (isWinning) {
            winningTrades++;
          }
          
          // Calculate profit/loss
          const profitLoss = isLong ?
            (Number(trade.exitPrice) - Number(trade.entryPrice)) * Number(trade.amount) :
            (Number(trade.entryPrice) - Number(trade.exitPrice)) * Number(trade.amount);
          
          totalProfitLoss += profitLoss;
        }
      });
      
      const winRate = completedTrades > 0 ? (winningTrades / completedTrades) * 100 : 0;
      
      return res.status(200).json({
        totalTrades,
        completedTrades,
        activeTrades,
        winRate,
        totalProfitLoss
      });
    } catch (error) {
      console.error("Get metrics error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  // Admin API routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Get all users
      const users = Array.from(storage["users"].values());
      
      // Remove sensitive data
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      return res.status(200).json(safeUsers);
    } catch (error) {
      console.error("Admin get users error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.get("/api/admin/trades", isAdmin, async (req, res) => {
    try {
      // Get all trades
      const allTrades = Array.from(storage["trades"].values());
      
      return res.status(200).json(allTrades);
    } catch (error) {
      console.error("Admin get trades error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.post("/api/admin/users/:id/level-up", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          error: "Invalid user ID" 
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          error: "User not found" 
        });
      }
      
      // Update user level
      await storage.updateUserLevel(userId);
      
      // Get updated user
      const updatedUser = await storage.getUser(userId);
      
      // Return user without password
      const { password, ...safeUser } = updatedUser!;
      
      return res.status(200).json(safeUser);
    } catch (error) {
      console.error("Admin update user level error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          error: "Invalid user ID" 
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          error: "User not found" 
        });
      }
      
      // Prevent deleting your own account
      if (userId === req.session.userId) {
        return res.status(400).json({ 
          error: "Cannot delete your own account" 
        });
      }
      
      // Delete user (mock implementation - would need proper implementation in storage)
      const success = storage["users"].delete(userId);
      
      if (!success) {
        return res.status(500).json({ 
          error: "Failed to delete user" 
        });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Admin delete user error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  app.delete("/api/admin/trades/:id", isAdmin, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      
      if (isNaN(tradeId)) {
        return res.status(400).json({ 
          error: "Invalid trade ID" 
        });
      }
      
      // Check if trade exists
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ 
          error: "Trade not found" 
        });
      }
      
      // Delete trade
      const success = await storage.deleteTrade(tradeId);
      
      if (!success) {
        return res.status(500).json({ 
          error: "Failed to delete trade" 
        });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Admin delete trade error:", error);
      return res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });

  // AI Routes
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      const aiResponse = await aiService.processQuestion(question);
      res.json(aiResponse);
    } catch (error) {
      console.error('Error in /api/ai/ask:', error);
      res.status(500).json({ error: 'Failed to process question' });
    }
  });

  app.post('/api/ai/analyze-chart', async (req, res) => {
    try {
      const { symbol, timeframe, data } = req.body;
      if (!symbol || !timeframe || !data) {
        return res.status(400).json({ error: 'Symbol, timeframe, and data are required' });
      }

      const analysis = await aiService.analyzeChart(data, symbol, timeframe);
      res.json(analysis);
    } catch (error) {
      console.error('Error in /api/ai/analyze-chart:', error);
      res.status(500).json({ error: 'Failed to analyze chart' });
    }
  });

  app.get('/api/ai/personalized-advice/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if the user is requesting their own advice or is an admin
      const sessionUserId = req.session.userId;
      
      // Not authenticated
      if (sessionUserId === undefined) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Different user than requested
      if (sessionUserId !== userId) {
        // Check if requester is an admin
        const user = await storage.getUser(sessionUserId);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      }

      const advice = await aiService.getPersonalizedAdvice(userId);
      res.json({ advice });
    } catch (error) {
      console.error('Error in /api/ai/personalized-advice:', error);
      res.status(500).json({ error: 'Failed to get personalized advice' });
    }
  });
  
  // API Key Management Routes
  app.get('/api/config/services', isAuthenticated, async (req, res) => {
    try {
      // Only provide information about which services have keys available, not the actual keys
      const serviceConfig = {
        openai: {
          available: !!process.env.OPENAI_API_KEY,
          service: 'OpenAI'
        },
        coinapi: {
          available: !!process.env.VITE_COINAPI_KEY,
          service: 'CoinAPI'
        },
        alphaVantage: {
          available: !!process.env.VITE_ALPHA_VANTAGE_API_KEY,
          service: 'Alpha Vantage'
        }
      };
      
      res.json(serviceConfig);
    } catch (error) {
      console.error('Error getting service configuration:', error);
      res.status(500).json({ error: 'Failed to get service configuration' });
    }
  });
  
  // OpenAI API Routes for client-side requests
  app.post('/api/ai/ask-question', isAuthenticated, async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key is not configured',
          answer: 'The AI assistant is currently unavailable. Please check your API key configuration.',
          confidence: 0
        });
      }
      
      // Call the AI service to process the question
      // This will be handled on the server-side with the server's API key
      // Implementation depends on your server-side AI service
      
      // For now, return a simple response
      res.json({
        answer: `Your question was: ${question}. The server-side OpenAI integration will handle this request.`,
        sources: ['Server AI Integration'],
        confidence: 0.9
      });
    } catch (error) {
      console.error('Error in /api/ai/ask-question:', error);
      res.status(500).json({ error: 'Failed to process AI question' });
    }
  });
  
  app.post('/api/ai/analyze-chart', isAuthenticated, async (req, res) => {
    try {
      const { symbol, timeframe, chartData } = req.body;
      
      if (!symbol || !timeframe || !chartData) {
        return res.status(400).json({ error: 'Symbol, timeframe, and chart data are required' });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key is not configured',
          patterns: [],
          summary: 'Chart analysis is currently unavailable. Please check your API key configuration.',
          keyLevels: { support: [], resistance: [] }
        });
      }
      
      // Call the server-side AI service to analyze the chart
      // Implementation depends on your server-side AI service
      
      // For now, return a sample response
      res.json({
        patterns: [
          {
            name: 'Double Bottom',
            description: 'Bullish reversal pattern',
            confidence: 0.75,
            startTime: Date.now() - 1000000,
            endTime: Date.now(),
            type: 'bullish'
          }
        ],
        summary: `Chart analysis for ${symbol} on ${timeframe} timeframe. The server-side OpenAI integration will handle this request.`,
        keyLevels: { 
          support: [100, 120], 
          resistance: [150, 170] 
        },
        wyckoffPhase: 'accumulation',
        marketStructure: 'bullish',
        recommendation: 'Consider long positions with tight stop loss.'
      });
    } catch (error) {
      console.error('Error in /api/ai/analyze-chart:', error);
      res.status(500).json({ error: 'Failed to analyze chart' });
    }
  });
  
  app.post('/api/ai/explain-pattern', isAuthenticated, async (req, res) => {
    try {
      const { patternName } = req.body;
      
      if (!patternName) {
        return res.status(400).json({ error: 'Pattern name is required' });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key is not configured',
          explanation: 'Pattern explanations are currently unavailable. Please check your API key configuration.'
        });
      }
      
      // Call the server-side AI service to explain the pattern
      // Implementation depends on your server-side AI service
      
      // For now, return a sample response
      res.json({
        explanation: `The ${patternName} pattern is a common chart formation. The server-side OpenAI integration will provide a detailed explanation.`
      });
    } catch (error) {
      console.error('Error in /api/ai/explain-pattern:', error);
      res.status(500).json({ error: 'Failed to explain pattern' });
    }
  });
  
  app.post('/api/ai/personalized-advice', isAuthenticated, async (req, res) => {
    try {
      const { trades, positions, tradingSummary } = req.body;
      
      if (!trades) {
        return res.status(400).json({ error: 'Trade data is required' });
      }
      
      // Get the user ID from the session
      const userId = req.session.userId;
      if (userId === undefined) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key is not configured',
          advice: 'Personalized advice is currently unavailable. Please check your API key configuration.',
          riskAnalysis: '',
          improvementAreas: [],
          suggestedStrategies: [],
          confidence: 0
        });
      }
      
      // Call the server-side AI service to get personalized advice
      // Implementation depends on your server-side AI service
      
      // For now, return a sample response
      res.json({
        advice: "Based on your trading history, you're showing progress in market analysis but could improve risk management.",
        riskAnalysis: "Your risk-reward ratio could be improved. Consider placing tighter stop losses.",
        improvementAreas: [
          "Risk management",
          "Position sizing",
          "Trade documentation"
        ],
        suggestedStrategies: [
          "Trend following with proper risk controls",
          "Swing trading major support/resistance levels"
        ],
        confidence: 0.85
      });
    } catch (error) {
      console.error('Error in /api/ai/personalized-advice:', error);
      res.status(500).json({ error: 'Failed to get personalized advice' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
