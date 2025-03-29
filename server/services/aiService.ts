import OpenAI from "openai";
import { storage } from "../storage";
import { Trade } from "../../shared/schema";

// Initialize the OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Knowledge base for trading terms and concepts
const tradingKnowledgeBase = {
  wyckoff: {
    accumulation: "The Wyckoff Accumulation phase is where large operators begin to buy an asset after a prolonged downtrend. It's characterized by decreased volatility and trading range bound activity.",
    distribution: "The Wyckoff Distribution phase is where large operators begin to sell an asset after a prolonged uptrend. It's marked by decreased momentum and trading range bound activity before a reversal.",
    spring: "A Spring in Wyckoff methodology is a price move that briefly penetrates the lower boundary of the trading range, only to reverse quickly. It's designed to trigger stop losses and create liquidity for large operators.",
    upthrust: "An Upthrust in Wyckoff methodology is a price move that briefly penetrates the upper boundary of the trading range, only to reverse quickly. It's designed to trap buyers before a move down.",
    tests: "In Wyckoff methodology, tests refer to price revisiting a previous support or resistance level to confirm its strength or weakness.",
  },
  technicalAnalysis: {
    supportResistance: "Support and resistance are price levels where the asset has historically struggled to move beyond. Support prevents prices from falling lower, while resistance prevents prices from rising higher.",
    trendlines: "Trendlines are drawn by connecting at least two price points and then extending the line to identify potential future areas of support or resistance.",
    movingAverages: "Moving averages smooth out price data to create a single flowing line, making it easier to identify the direction of the trend.",
    volumeAnalysis: "Volume analysis examines the strength of price movements based on the trading volume that accompanies them.",
  }
};

// Define trading patterns for recognition
const wyckoffPatterns = {
  accumulation: {
    phases: ["preliminary support", "selling climax", "automatic rally", "secondary test", "spring", "sign of strength", "last point of support"],
    description: "A period where large operators are accumulating positions from retail traders who are selling due to pessimism."
  },
  distribution: {
    phases: ["preliminary supply", "buying climax", "automatic reaction", "secondary test", "upthrust", "sign of weakness", "last point of supply"],
    description: "A period where large operators are distributing positions to retail traders who are buying due to optimism."
  }
};

/**
 * AI Service for NLP and trading analysis
 */
export const aiService = {
  /**
   * Processes a question about trading or Wyckoff methodology
   */
  processQuestion: async (question: string): Promise<{ answer: string, sources?: string[] }> => {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a trading education assistant specializing in Wyckoff methodology. 
            Answer questions concisely but thoroughly. 
            If you're unsure, say so rather than providing incorrect information.
            Base your answers on established trading principles and Wyckoff methodology.
            Include practical examples where appropriate.`
          },
          { role: "user", content: question }
        ],
        max_tokens: 800,
      });

      const contentText = response.choices[0].message.content || "I couldn't generate an answer. Please try again.";

      return {
        answer: contentText,
        sources: determineSourcesFromQuestion(question)
      };
    } catch (error) {
      console.error("Error processing question:", error);
      throw new Error("Failed to process your question. Please try again later.");
    }
  },

  /**
   * Analyzes a chart for Wyckoff patterns
   */
  analyzeChart: async (chartData: any, symbol: string, timeframe: string) => {
    try {
      // Format the chart data for analysis
      const formattedData = formatChartDataForAnalysis(chartData);
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a chart analysis expert specializing in Wyckoff methodology.
            Analyze the provided price and volume data to identify potential Wyckoff patterns.
            Focus on accumulation, distribution, springs, upthrusts, and test patterns.
            Provide your analysis in JSON format with the following structure:
            {
              "patterns": [
                {
                  "pattern": "Pattern name",
                  "confidence": Number between 0-1,
                  "description": "Description of the pattern",
                  "recommendations": ["Trading recommendation 1", "Trading recommendation 2"],
                  "areas": [
                    {
                      "start": Index where pattern starts,
                      "end": Index where pattern ends,
                      "type": "accumulation/distribution/spring/etc."
                    }
                  ]
                }
              ]
            }`
          },
          {
            role: "user",
            content: `Please analyze this ${timeframe} chart for ${symbol}:\n\n${formattedData}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content || "{}";
      const result = JSON.parse(content);
      return result;
    } catch (error) {
      console.error("Error analyzing chart:", error);
      throw new Error("Failed to analyze the chart. Please try again later.");
    }
  },

  /**
   * Generates personalized trading advice based on user's history
   */
  getPersonalizedAdvice: async (userId: number): Promise<string> => {
    try {
      // Get user's trade history
      const trades = await storage.getTrades(userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Generate a summary of the user's trading performance
      const tradingSummary = generateTradingSummary(trades);
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a personalized trading coach. Based on the user's trading history,
            provide specific and actionable advice to improve their trading performance.
            Focus on pattern recognition, risk management, and psychological aspects.
            Be encouraging but realistic.`
          },
          {
            role: "user",
            content: `Please provide personalized trading advice based on this trading summary:
            
            ${tradingSummary}
            
            Focus on how I can improve my trading strategy and avoid common mistakes.`
          }
        ],
        max_tokens: 800,
      });

      const adviceText = response.choices[0].message.content || "Unable to generate personalized advice at this time.";
      return adviceText;
    } catch (error) {
      console.error("Error getting personalized advice:", error);
      throw new Error("Failed to generate personalized advice. Please try again later.");
    }
  }
};

/**
 * Helper function to determine sources based on the question content
 */
function determineSourcesFromQuestion(question: string): string[] {
  const sources: string[] = [];
  
  // Check for Wyckoff-related questions
  if (question.toLowerCase().includes("wyckoff")) {
    if (question.toLowerCase().includes("accumulation")) {
      sources.push("Wyckoff: Accumulation");
    }
    if (question.toLowerCase().includes("distribution")) {
      sources.push("Wyckoff: Distribution");
    }
    if (question.toLowerCase().includes("spring")) {
      sources.push("Wyckoff: Spring");
    }
    if (question.toLowerCase().includes("upthrust")) {
      sources.push("Wyckoff: Upthrust");
    }
    if (sources.length === 0) {
      sources.push("Wyckoff Methodology");
    }
  }
  
  // Check for technical analysis questions
  if (question.toLowerCase().includes("support") || question.toLowerCase().includes("resistance")) {
    sources.push("Technical Analysis: Support & Resistance");
  }
  if (question.toLowerCase().includes("trend") || question.toLowerCase().includes("trendline")) {
    sources.push("Technical Analysis: Trendlines");
  }
  if (question.toLowerCase().includes("moving average") || question.toLowerCase().includes("ma") || question.toLowerCase().includes("ema")) {
    sources.push("Technical Analysis: Moving Averages");
  }
  if (question.toLowerCase().includes("volume")) {
    sources.push("Technical Analysis: Volume Analysis");
  }
  
  return sources;
}

/**
 * Helper function to format chart data for AI analysis
 */
function formatChartDataForAnalysis(chartData: any): string {
  // Format the data as a string representation that AI can process
  let formattedData = "Time, Open, High, Low, Close, Volume\n";
  
  // Assuming chartData has the necessary OHLCV properties
  for (let i = 0; i < chartData.length; i++) {
    const candle = chartData[i];
    formattedData += `${candle.time}, ${candle.open}, ${candle.high}, ${candle.low}, ${candle.close}, ${candle.volume || 0}\n`;
  }
  
  return formattedData;
}

/**
 * Helper function to generate a trading summary from user trades
 */
function generateTradingSummary(trades: Trade[]): string {
  // Calculate overall statistics
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return "No trading history available.";
  }
  
  // Calculate profitLoss for each trade if it doesn't exist
  const tradesWithPL = trades.map(trade => {
    if (trade.profitLoss !== undefined && trade.profitLoss !== null) {
      return trade;
    }
    
    // Calculate profit/loss for trades without the field
    let calculatedPL = 0;
    if (trade.status === "completed" && trade.exitPrice && trade.entryPrice) {
      const isLong = trade.tradeType === 'long';
      calculatedPL = isLong ?
        (Number(trade.exitPrice) - Number(trade.entryPrice)) * Number(trade.amount) :
        (Number(trade.entryPrice) - Number(trade.exitPrice)) * Number(trade.amount);
    }
    
    return {
      ...trade,
      profitLoss: calculatedPL
    };
  });
  
  const completedTrades = tradesWithPL.filter(t => t.status === "completed");
  const winningTrades = completedTrades.filter(t => Number(t.profitLoss) > 0);
  const losingTrades = completedTrades.filter(t => Number(t.profitLoss) <= 0);
  
  const winRate = completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0;
  
  const totalProfit = completedTrades.reduce((sum, trade) => sum + Number(trade.profitLoss || 0), 0);
  const averageProfitWinning = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + Number(trade.profitLoss || 0), 0) / winningTrades.length 
    : 0;
  const averageLossLosing = losingTrades.length > 0 
    ? losingTrades.reduce((sum, trade) => sum + Number(trade.profitLoss || 0), 0) / losingTrades.length 
    : 0;
  
  // Get frequent trading pairs
  const pairFrequency: Record<string, number> = {};
  trades.forEach(trade => {
    pairFrequency[trade.pair] = (pairFrequency[trade.pair] || 0) + 1;
  });
  
  const mostTradedPairs = Object.entries(pairFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pair]) => pair)
    .join(", ");
  
  // Get common strategies
  const strategyFrequency: Record<string, number> = {};
  trades.forEach(trade => {
    if (trade.strategy) {
      strategyFrequency[trade.strategy] = (strategyFrequency[trade.strategy] || 0) + 1;
    }
  });
  
  const mostUsedStrategies = Object.entries(strategyFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([strategy]) => strategy)
    .join(", ");
  
  // Format the summary
  return `
    Trading Summary:
    ----------------
    Total Trades: ${totalTrades}
    Completed Trades: ${completedTrades.length}
    Win Rate: ${winRate.toFixed(2)}%
    Total Profit/Loss: ${totalProfit.toFixed(2)}
    Average Profit on Winning Trades: ${averageProfitWinning.toFixed(2)}
    Average Loss on Losing Trades: ${averageLossLosing.toFixed(2)}
    Most Traded Pairs: ${mostTradedPairs || "N/A"}
    Most Used Strategies: ${mostUsedStrategies || "N/A"}
    Long Positions: ${trades.filter(t => t.tradeType === "long").length}
    Short Positions: ${trades.filter(t => t.tradeType === "short").length}
  `;
}