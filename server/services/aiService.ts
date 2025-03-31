import OpenAI from "openai";
import { storage } from "../storage";
import { Trade } from "../../shared/schema";

// Initialize the OpenAI API client with improved error handling
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow usage in browser environments if needed
});

// Debug message for startup API status
console.log(`OpenAI API key status: ${process.env.OPENAI_API_KEY ? 'Available' : 'Missing'}`);

// Helper function to safely validate OpenAI API key
const isOpenAIKeyValid = () => {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;
};

// Comprehensive Wyckoff methodology knowledge base
const tradingKnowledgeBase = {
  wyckoff: {
    // Core Wyckoff concepts
    overview: "The Wyckoff Method is a comprehensive approach to trading and investing developed by Richard D. Wyckoff in the early 20th century. It focuses on the relationship between supply and demand to determine price direction, using price action, volume, and time. The methodology aims to identify the intentions and activities of 'smart money' or large institutional investors.",
    
    // Market cycles
    accumulation: "The Wyckoff Accumulation phase occurs after a prolonged downtrend when large operators begin to buy an asset. It's characterized by decreased volatility, trading range bound activity, and specific events such as Preliminary Support (PS), Selling Climax (SC), Automatic Rally (AR), Secondary Test (ST), and Spring. Volume typically diminishes throughout this phase except during key events. The phase concludes with a Sign of Strength (SOS) and a Last Point of Support (LPS) before a markup phase begins.",
    
    markup: "The Wyckoff Markup phase follows successful accumulation and represents the uptrend where prices rise steadily. It's characterized by higher highs and higher lows, with healthy pullbacks to the previous resistance (now support). Volume typically increases during strong advances and diminishes during reactions. Backup to Edge of Creek (BEC) and Last Point of Support (LPS) are common before continuation moves.",
    
    distribution: "The Wyckoff Distribution phase occurs after a prolonged uptrend when large operators begin to sell their positions. Key events include Preliminary Supply (PSY), Buying Climax (BC), Automatic Reaction (AR), Secondary Test (ST), and Upthrust. Volume patterns show increasing supply (selling) pressure, particularly on rallies. The phase concludes with Signs of Weakness (SOW) and a Last Point of Supply (LPSY) before a markdown phase begins.",
    
    markdown: "The Wyckoff Markdown phase follows distribution and represents the downtrend. Prices make lower highs and lower lows, with rallies that fail at previous support (now resistance). Volume typically increases during strong declines and diminishes during technical bounces. This phase continues until signs of accumulation appear again.",
    
    // Key Wyckoff events
    spring: "A Spring in Wyckoff methodology is a price move that briefly penetrates the lower boundary of the trading range, only to reverse quickly. It's designed to trigger stop losses and create liquidity for large operators. It often occurs near the end of an accumulation phase and represents a final test of supply before markup begins. Springs are typically accompanied by diminishing volume and followed by increased buying pressure.",
    
    upthrust: "An Upthrust in Wyckoff methodology is a price move that briefly penetrates the upper boundary of the trading range, only to reverse quickly. It's designed to trap buyers before a move down. It often occurs during the distribution phase and represents a final test of demand before markdown begins. Upthrusts are typically accompanied by increased volume initially, followed by strong selling pressure.",
    
    tests: "In Wyckoff methodology, tests refer to price revisiting a previous support or resistance level to confirm its strength or weakness. Secondary tests (ST) often occur after climactic action (selling climax or buying climax) and help establish the trading range. Tests with decreasing volume often suggest successful tests, while increased volume may signal failure of support or resistance.",
    
    compositeMan: "The 'Composite Man' is Wyckoff's conceptual model representing the collective actions of large operators who manipulate the markets to their advantage. Understanding the Composite Man's operations is central to the Wyckoff Method, as it helps traders align themselves with smart money rather than being caught in market manipulations.",
    
    // Additional key concepts
    sellingClimaxSC: "The Selling Climax (SC) occurs at the end of a downtrend with a significant price drop on exceptionally high volume. It represents panic selling and capitulation, often creating a Preliminary Support (PS). It's a key signal that smart money is absorbing the selling from the public.",
    
    buyingClimaxBC: "The Buying Climax (BC) occurs after a sustained uptrend with a significant price surge on exceptionally high volume. It represents euphoric buying, often creating a Preliminary Supply (PSY). It signals that smart money is distributing positions to the public.",
    
    signOfStrengthSOS: "A Sign of Strength (SOS) is a price advance on increased volume, often breaking out of the trading range after a successful spring. It confirms that accumulation is complete and markup is beginning.",
    
    signOfWeaknessSOW: "A Sign of Weakness (SOW) is a price decline on increased volume, often breaking below the trading range after an upthrust. It confirms that distribution is complete and markdown is beginning.",
    
    lastPointOfSupportLPS: "The Last Point of Support (LPS) is the final pullback in price before a substantial move up. It often tests the breakout level with reduced volume, providing a low-risk entry opportunity before continuation of the uptrend.",
    
    lastPointOfSupplyLPSY: "The Last Point of Supply (LPSY) is the final rally before a substantial move down. It often tests the breakdown level with reduced volume, providing a low-risk short entry opportunity before continuation of the downtrend.",
    
    effort_vs_result: "The Effort vs. Result principle compares volume (effort) with the price movement it produces (result). When large effort (high volume) produces minimal price change, it suggests a potential reversal. Conversely, when small effort produces significant price change, it suggests strength in the prevailing direction.",
    
    strengthAndWeakness: "In Wyckoff analysis, strength and weakness are determined by comparing price action to volume. Strength shows as rising prices on increased volume and reactions on decreased volume. Weakness appears as falling prices on increased volume and rallies on decreased volume.",
  },
  
  // Technical analysis principles supporting Wyckoff methodology
  technicalAnalysis: {
    supportResistance: "Support and resistance are price levels where an asset has historically struggled to move beyond. Support prevents prices from falling lower, while resistance prevents prices from rising higher. In Wyckoff analysis, these levels often correspond to important phases of accumulation and distribution.",
    
    trendlines: "Trendlines are drawn by connecting at least two price points and extending the line to identify potential future areas of support or resistance. In Wyckoff analysis, trendlines help identify the overall market structure and important breakout or breakdown levels.",
    
    movingAverages: "Moving averages smooth out price data to create a single flowing line, making it easier to identify the direction of the trend. While not explicitly part of Wyckoff's original teachings, moving averages can complement Wyckoff analysis by confirming trend direction and potential reversal points.",
    
    volumeAnalysis: "Volume analysis examines the strength of price movements based on the trading volume that accompanies them. In Wyckoff methodology, volume is crucial for confirming price action and identifying potential reversal points or continuation patterns.",
    
    pricePatterns: "Price patterns refer to specific formations that appear on charts, such as double tops/bottoms, head and shoulders, and flags. In Wyckoff analysis, these patterns often align with specific phases of accumulation or distribution.",
  },
  
  // Wyckoff trading strategies
  tradingStrategies: {
    entryPoints: "Optimal entry points in Wyckoff methodology include: after a successful Spring in accumulation, at the Last Point of Support (LPS) after a breakout, or during a backup to the Edge of the Creek (BEC). For short positions, entries include after a successful Upthrust in distribution or at the Last Point of Supply (LPSY) after a breakdown.",
    
    exitPoints: "Wyckoff suggests taking profits when signs of distribution appear after a markup phase, or when signs of accumulation appear after a markdown phase. Partial profits can be taken at resistance levels during markup or support levels during markdown.",
    
    stopLoss: "Stop-loss placement in Wyckoff trading depends on the specific trade setup. For longs after a Spring, stops are typically placed just below the Spring low. For shorts after an Upthrust, stops are typically placed just above the Upthrust high.",
    
    riskManagement: "Wyckoff emphasized the importance of risk management, suggesting position sizing based on the distance to stop-loss and maintaining a favorable risk-to-reward ratio. He recommended not risking more than a small percentage of total capital on any single trade.",
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
      // Check if OpenAI API key is valid before making request
      if (!isOpenAIKeyValid()) {
        console.warn("OpenAI API key is missing or invalid");
        return {
          answer: "I'm currently unable to process your question due to a configuration issue. Please contact support for assistance.",
          sources: determineSourcesFromQuestion(question)
        };
      }
      
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
      
      // Return a user-friendly error rather than throwing
      return {
        answer: "I experienced a technical difficulty processing your question. This might be due to a temporary issue. Please try again in a moment.",
        sources: determineSourcesFromQuestion(question)
      };
    }
  },

  /**
   * Analyzes a chart for Wyckoff patterns
   */
  analyzeChart: async (chartData: any, symbol: string, timeframe: string) => {
    try {
      // Check if OpenAI API key is valid before making request
      if (!isOpenAIKeyValid()) {
        console.warn("OpenAI API key is missing or invalid");
        return {
          patterns: [],
          summary: "Chart analysis is currently unavailable due to a configuration issue. Please contact support for assistance.",
          keyLevels: { support: [], resistance: [] }
        };
      }
      
      // Validate chart data
      if (!chartData || chartData.length === 0) {
        return {
          patterns: [],
          summary: "No chart data provided for analysis.",
          keyLevels: { support: [], resistance: [] }
        };
      }
      
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
              ],
              "summary": "Overall analysis summary",
              "keyLevels": {
                "support": [list of support prices],
                "resistance": [list of resistance prices]
              }
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
      
      // Ensure minimal required structure is present
      if (!result.patterns) result.patterns = [];
      if (!result.summary) result.summary = "Analysis completed";
      if (!result.keyLevels) result.keyLevels = { support: [], resistance: [] };
      
      return result;
    } catch (error) {
      console.error("Error analyzing chart:", error);
      // Return a valid object with an error message instead of throwing
      return {
        patterns: [],
        summary: "An error occurred during chart analysis. Please try again later.",
        keyLevels: { support: [], resistance: [] },
        error: true
      };
    }
  },

  /**
   * Generates personalized trading advice based on user's history
   */
  getPersonalizedAdvice: async (userId: number): Promise<string | {
    advice: string;
    riskAnalysis?: string;
    improvementAreas?: string[];
    suggestedStrategies?: string[];
  }> => {
    try {
      // Check if OpenAI API key is valid before making request
      if (!isOpenAIKeyValid()) {
        console.warn("OpenAI API key is missing or invalid");
        return {
          advice: "Personalized advice is currently unavailable due to a configuration issue. Please contact support for assistance.",
          improvementAreas: ["Ensure API configuration is correct"],
          suggestedStrategies: ["Contact support for assistance"]
        };
      }
      
      // Get user's trade history
      const trades = await storage.getTrades(userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return {
          advice: "User profile not found. Please ensure you're logged in correctly.",
          improvementAreas: ["Complete user profile setup"],
          suggestedStrategies: ["Log in with the correct credentials"]
        };
      }
      
      // Check if there's enough trading history
      if (trades.length === 0) {
        return {
          advice: "You don't have any trading history yet. Start by recording some trades to receive personalized advice.",
          improvementAreas: ["Create a trading history"],
          suggestedStrategies: ["Record your first trades", "Try paper trading to build history"]
        };
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
            Be encouraging but realistic.
            
            Format your response as a JSON object with these fields:
            {
              "advice": "Main advice paragraph",
              "riskAnalysis": "Risk management analysis",
              "improvementAreas": ["Area 1", "Area 2", ...],
              "suggestedStrategies": ["Strategy 1", "Strategy 2", ...]
            }`
          },
          {
            role: "user",
            content: `Please provide personalized trading advice based on this trading summary:
            
            ${tradingSummary}
            
            Focus on how I can improve my trading strategy and avoid common mistakes.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });

      try {
        // Try to parse as JSON first (preferred structured format)
        const jsonResponse = JSON.parse(response.choices[0].message.content || "{}");
        return {
          advice: jsonResponse.advice || "Unable to generate specific advice at this time.",
          riskAnalysis: jsonResponse.riskAnalysis,
          improvementAreas: jsonResponse.improvementAreas || [],
          suggestedStrategies: jsonResponse.suggestedStrategies || []
        };
      } catch (parseError) {
        // Fall back to raw text response if JSON parsing fails
        const adviceText = response.choices[0].message.content || "Unable to generate personalized advice at this time.";
        return {
          advice: adviceText,
          improvementAreas: ["Review your trading patterns", "Maintain consistent risk management"],
          suggestedStrategies: ["Analyze your most successful trades", "Learn more about market structure"]
        };
      }
    } catch (error) {
      console.error("Error getting personalized advice:", error);
      // Return user-friendly error message instead of throwing
      return {
        advice: "Unable to generate personalized advice due to a technical issue. Please try again later.",
        improvementAreas: ["Continue recording your trades for future analysis"],
        suggestedStrategies: ["Review your trading journal while waiting for the analysis system to be restored"]
      };
    }
  },
  
  /**
   * Analyzes a chart image using Wyckoff methodology and generates enhanced analysis
   */
  analyzeChartImage: async (imageBase64: string, notes?: string): Promise<any> => {
    try {
      // Check if OpenAI API key is valid before making request
      if (!isOpenAIKeyValid()) {
        console.warn("OpenAI API key is missing or invalid");
        return {
          success: false,
          error: "Chart image analysis is currently unavailable due to a configuration issue. Please contact support for assistance.",
          wyckoffPhase: "unknown",
          confidence: 0
        };
      }
      
      // Validate image data
      if (!imageBase64) {
        return {
          success: false,
          error: "No chart image provided for analysis. Please upload a valid chart image.",
          wyckoffPhase: "unknown",
          confidence: 0
        };
      }
      
      // Format the notes if provided
      const userNotes = notes ? 
        `The user provided these notes about their own analysis of the chart: ${notes}` :
        "The user did not provide any notes about their analysis.";
      
      // Log analysis attempt for debugging
      console.log(`Attempting Wyckoff analysis on provided chart image${notes ? ' with user notes' : ''}`);
      
      try {
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are Richard Wyckoff himself, a legendary market analyst and educator with decades of experience analyzing price charts.
              
              Analyze the uploaded chart image according to your developed Wyckoff Method principles, focusing on:
              
              1. MARKET STRUCTURE: Identify whether the chart is in Accumulation, Distribution, Markup, or Markdown phase.
                 - Accumulation: Look for trading ranges after downtrends, PS, SC, AR, ST, Springs, BU, SOS, LPS
                 - Distribution: Look for trading ranges after uptrends, PSY, BC, AR, ST, Upthrusts, SOW, LPSY
                 - Markup: Look for rising trends with higher highs and higher lows
                 - Markdown: Look for falling trends with lower highs and lower lows
              
              2. SPECIFIC WYCKOFF EVENTS: Identify technical events like:
                 - Springs and Upthrusts (false breakouts)
                 - Tests of support/resistance
                 - Signs of Strength (SOS) or Weakness (SOW)
                 - Selling Climax (SC) or Buying Climax (BC)
                 - Last Point of Support (LPS) or Last Point of Supply (LPSY)
                 - Backup to Edge of Creek (BEC)
                 - Compare volume with price movement (Effort vs. Result)
              
              3. VOLUME ANALYSIS: Examine how volume confirms or contradicts price movement
                 - High volume on advances in markup indicates strength
                 - Low volume on declines in markup indicates strength
                 - High volume on declines in markdown indicates weakness
                 - Low volume on rallies in markdown indicates weakness
              
              4. COMPARE USER ANALYSIS: If the user provided notes about their own analysis, comment on:
                 - What they correctly identified according to Wyckoff principles
                 - What they missed or misinterpreted
                 - How they could improve their Wyckoff analysis
              
              5. PROVIDE BOTH EDUCATIONAL AND PRACTICAL VALUE:
                 - Explain the reasoning behind your analysis in detail
                 - Offer specific trading recommendations based on Wyckoff principles
                 - Suggest what might happen next according to typical Wyckoff scenarios
                 - Include educational resources to help them improve
  
              Your response must be formatted as a JSON object with the following structure:
              
              {
                "wyckoffPhase": "current phase (accumulation, markup, distribution, markdown)",
                "confidence": float between 0-1 representing confidence in analysis,
                "phaseDescription": "detailed description of the current Wyckoff phase",
                "events": [
                  {
                    "type": "event type (spring, upthrust, test, etc.)",
                    "location": "description of where on the chart",
                    "description": "explanation of the event significance"
                  }
                ],
                "feedback": "detailed feedback on the chart analysis, including assessment of user's notes if provided",
                "tradingRecommendations": [
                  "specific actionable trading recommendation 1",
                  "specific actionable trading recommendation 2"
                ],
                "learningResources": [
                  {
                    "title": "resource title",
                    "url": "optional URL to resource",
                    "type": "article/video/book",
                    "description": "brief description of the resource"
                  }
                ]
              }`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please analyze this chart image using your Wyckoff methodology. Based on your expert analysis, identify the market phase, significant events, and provide detailed recommendations for traders.
                  
                  ${userNotes}
                  
                  Please be thorough in your analysis so I can learn how to properly apply Wyckoff methodology to my trading decisions.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ],
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 3000,
        });
  
        const content = response.choices[0].message.content || "{}";
        
        // Parse the response with error handling
        try {
          const result = JSON.parse(content);
          
          if (!result.wyckoffPhase) {
            console.warn("Wyckoff phase missing from analysis result");
            result.wyckoffPhase = "undetermined";
          }
          
          if (!result.confidence) {
            result.confidence = 0.5;
          }
          
          if (!result.events) {
            result.events = [];
          }
          
          if (!result.tradingRecommendations) {
            result.tradingRecommendations = [];
          }
          
          // Generate enhanced image with annotations based on analysis
          console.log("Analysis successful, generating enhanced image");
          const enhancedImageResult = await generateEnhancedImage(imageBase64, result);
          
          return {
            success: true,
            ...result,
            enhancedImage: enhancedImageResult.enhancedImage
          };
        } catch (parseError) {
          console.error("Error parsing chart analysis JSON response:", parseError);
          return {
            success: false,
            error: "Failed to process the analysis results. Please try again.",
            wyckoffPhase: "unknown",
            confidence: 0
          };
        }
      } catch (apiError) {
        console.error("OpenAI API error during chart analysis:", apiError);
        return {
          success: false,
          error: "The AI service encountered an error analyzing your chart. Please try again later.",
          wyckoffPhase: "unknown",
          confidence: 0
        };
      }
    } catch (error) {
      console.error("Unexpected error analyzing chart image:", error);
      return {
        success: false,
        error: "An unexpected error occurred during analysis. Please try again later.",
        wyckoffPhase: "unknown",
        confidence: 0
      };
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
 * Helper function to generate an enhanced image with Wyckoff annotations
 */
async function generateEnhancedImage(imageBase64: string, analysis: any): Promise<{ enhancedImage: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key missing. Cannot generate enhanced image.");
      return { enhancedImage: `data:image/jpeg;base64,${imageBase64}` };
    }
    
    // Prepare a description of the Wyckoff analysis to guide image enhancement
    const wyckoffPhase = analysis.wyckoffPhase || "unknown phase";
    const events = analysis.events || [];
    const eventsText = events.map((event: any) => 
      `${event.type} at ${event.location}`
    ).join(", ");
    
    // Generate detailed prompt for DALL-E
    const prompt = `
    Create an enhanced version of this financial chart with Wyckoff methodology annotations. 
    This chart is in a ${wyckoffPhase.toUpperCase()} phase.
    
    ADD THESE ANNOTATIONS:
    ${events.map((event: any, index: number) => 
      `${index + 1}. Label "${event.type}" at ${event.location}`
    ).join("\n")}
    
    ADDITIONAL ELEMENTS:
    - Add horizontal lines for support and resistance levels
    - Add clear label "${wyckoffPhase.toUpperCase()} PHASE" in a visible location
    - Circle and annotate important price action points
    - Add arrows showing expected price direction based on Wyckoff analysis
    - Include a small legend explaining the annotations
    - Mark any Springs, Upthrusts, Tests, Signs of Strength, or Signs of Weakness
    
    STYLING:
    - Use contrasting colors for annotations (red for resistance/distribution, green for support/accumulation)
    - Make all text annotations readable
    - Use professional financial charting style
    - Do not remove or alter any original chart data
    `;
    
    try {
      // the newest OpenAI model is "dall-e-3", do not change this unless explicitly requested by the user
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json"
      });
      
      if (imageResponse.data[0].b64_json) {
        return {
          enhancedImage: `data:image/jpeg;base64,${imageResponse.data[0].b64_json}`
        };
      } else if (imageResponse.data[0].url) {
        // In case the response comes with URL instead of base64
        return {
          enhancedImage: imageResponse.data[0].url
        };
      }
    } catch (dallEError) {
      console.error("Error generating image with DALL-E:", dallEError);
      // If DALL-E fails, fall back to the original image
    }
    
    // Return the original image if DALL-E generation fails
    return {
      enhancedImage: `data:image/jpeg;base64,${imageBase64}`
    };
  } catch (error) {
    console.error("Error generating enhanced image:", error);
    // Return the original image if enhancement fails
    return {
      enhancedImage: `data:image/jpeg;base64,${imageBase64}`
    };
  }
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