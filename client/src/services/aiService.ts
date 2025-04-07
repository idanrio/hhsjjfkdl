import { ChartPatternRecognitionResult, Position, Trade, WyckoffAnalysisResult } from '../types/trading';
import { OHLCV } from './enhancedMarketService';
import { apiRequest } from '@/lib/queryClient';
import { isOpenAIAvailable } from './configService';

// Define interfaces for AI responses
export interface AIQuestionResponse {
  answer: string;
  sources?: string[];
  confidence: number;
}

export interface AIChartAnalysisResponse {
  patterns: ChartPatternRecognitionResult[];
  summary: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  wyckoffPhase?: string;
  marketStructure?: string;
  recommendation?: string;
}

export interface AIChartImageAnalysisResponse extends WyckoffAnalysisResult {
  success: boolean;
  error?: string;
}

export interface AITradingAdviceResponse {
  advice: string;
  riskAnalysis: string;
  improvementAreas: string[];
  suggestedStrategies: string[];
  confidence: number;
}

/**
 * The AI Service provides natural language processing and chart pattern analysis
 * capabilities to the trading platform using OpenAI's GPT models.
 */
export const aiService = {
  /**
   * Process a trading-related question and provide an insightful answer
   */
  async askQuestion(question: string): Promise<AIQuestionResponse> {
    try {
      // Check if the OpenAI API is available
      const isAvailable = await isOpenAIAvailable();
      if (!isAvailable) {
        console.error('OpenAI API key is missing or unavailable');
        return {
          answer: 'The AI assistant is currently unavailable. Please check your API key configuration.',
          confidence: 0
        };
      }

      // Send the question to the server-side API
      const response = await apiRequest('POST', '/api/ai/ask-question', {
        question: question
      });
      
      const result = await response.json();
      
      // If no result from server, determine sources based on question content
      if (!result.sources) {
        result.sources = determineSourcesFromQuestion(question);
      }
      
      return {
        answer: result.answer || 'Unable to generate a response',
        sources: result.sources,
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Error asking AI question:', error);
      // Determine sources based on question content for fallback
      const sources = determineSourcesFromQuestion(question);
      
      return {
        answer: 'Sorry, I encountered an error processing your question. Please try again later.',
        sources,
        confidence: 0
      };
    }
  },

  /**
   * Analyze chart data to identify patterns and provide Wyckoff analysis
   */
  async analyzeChart(
    symbol: string,
    chartData: OHLCV[],
    timeframe: string
  ): Promise<AIChartAnalysisResponse> {
    try {
      // Check if the OpenAI API is available
      const isAvailable = await isOpenAIAvailable();
      if (!isAvailable) {
        console.error('OpenAI API key is missing or unavailable');
        return {
          patterns: [],
          summary: 'Chart analysis is currently unavailable. Please check your API key configuration.',
          keyLevels: { support: [], resistance: [] }
        };
      }

      if (!chartData || chartData.length === 0) {
        return {
          patterns: [],
          summary: 'No chart data available for analysis.',
          keyLevels: { support: [], resistance: [] }
        };
      }

      // Format chart data for AI analysis
      const formattedChartData = formatChartDataForAnalysis(chartData);

      // Send the chart data to the server-side API
      const response = await apiRequest('POST', '/api/ai/analyze-chart', {
        symbol,
        timeframe,
        chartData: formattedChartData
      });
      
      const analysisResult = await response.json();
      
      return {
        patterns: analysisResult.patterns || [],
        summary: analysisResult.summary || 'No clear patterns detected.',
        keyLevels: analysisResult.keyLevels || { support: [], resistance: [] },
        wyckoffPhase: analysisResult.wyckoffPhase,
        marketStructure: analysisResult.marketStructure,
        recommendation: analysisResult.recommendation
      };
    } catch (error) {
      console.error('Error analyzing chart with AI:', error);
      return {
        patterns: [],
        summary: 'Sorry, I encountered an error analyzing the chart. Please try again later.',
        keyLevels: { support: [], resistance: [] }
      };
    }
  },

  /**
   * Generate personalized trading advice based on user's trade history
   */
  async getPersonalizedAdvice(trades: Trade[], positions: Position[]): Promise<AITradingAdviceResponse> {
    try {
      // Check if the OpenAI API is available
      const isAvailable = await isOpenAIAvailable();
      if (!isAvailable) {
        console.error('OpenAI API key is missing or unavailable');
        return {
          advice: 'Personalized advice is currently unavailable. Please check your API key configuration.',
          riskAnalysis: '',
          improvementAreas: [],
          suggestedStrategies: [],
          confidence: 0
        };
      }

      if (!trades || trades.length === 0) {
        return {
          advice: 'Not enough trading history to provide personalized advice.',
          riskAnalysis: 'No risk assessment available with limited data.',
          improvementAreas: ['Start recording your trades to receive personalized advice'],
          suggestedStrategies: ['Consider paper trading to build a history'],
          confidence: 0.5
        };
      }

      // Generate a summary of the user's trading history
      const tradingSummary = generateTradingSummary(trades);
      
      // Add info about active positions if available
      const positionInfo = positions && positions.length > 0 
        ? `Currently holding ${positions.length} active positions.` 
        : 'No active positions.';

      // Send the trading data to the server-side API
      const response = await apiRequest('POST', '/api/ai/personalized-advice', {
        trades,
        positions,
        tradingSummary,
        positionInfo
      });
      
      const adviceResult = await response.json();
      
      return {
        advice: adviceResult.advice || 'Unable to generate personalized advice.',
        riskAnalysis: adviceResult.riskAnalysis || '',
        improvementAreas: adviceResult.improvementAreas || [],
        suggestedStrategies: adviceResult.suggestedStrategies || [],
        confidence: adviceResult.confidence || 0.5
      };
    } catch (error) {
      console.error('Error getting personalized advice:', error);
      return {
        advice: 'Sorry, I encountered an error generating personalized advice. Please try again later.',
        riskAnalysis: '',
        improvementAreas: [],
        suggestedStrategies: [],
        confidence: 0
      };
    }
  },
  
  /**
   * Generate a detailed explanation of a chart pattern with educational content
   */
  async explainPattern(patternName: string): Promise<string> {
    try {
      // Check if the OpenAI API is available
      const isAvailable = await isOpenAIAvailable();
      if (!isAvailable) {
        console.error('OpenAI API key is missing or unavailable');
        return 'Pattern explanations are currently unavailable. Please check your API key configuration.';
      }

      // Send the pattern name to the server-side API
      const response = await apiRequest('POST', '/api/ai/explain-pattern', {
        patternName
      });
      
      const result = await response.json();
      
      return result.explanation || 'Unable to generate pattern explanation. Please try again.';
    } catch (error) {
      console.error('Error explaining pattern:', error);
      return 'Sorry, I encountered an error generating the pattern explanation. Please try again later.';
    }
  },
  
  /**
   * Analyze a chart image using Wyckoff methodology
   * @param imageBase64 Base64 encoded image data
   * @param notes Optional notes from the trader about their own analysis
   */
  async analyzeChartImage(
    imageBase64: string,
    notes?: string
  ): Promise<AIChartImageAnalysisResponse> {
    try {
      // Check if the OpenAI API is available
      const isAvailable = await isOpenAIAvailable();
      if (!isAvailable) {
        console.error('OpenAI API key is missing or unavailable');
        return {
          success: false,
          error: 'OpenAI API key is missing or unavailable',
          wyckoffPhase: '',
          confidence: 0
        };
      }

      if (!imageBase64) {
        return {
          success: false,
          error: 'No image provided for analysis',
          wyckoffPhase: '',
          confidence: 0
        };
      }

      // Send the image to the server-side API
      const response = await apiRequest('POST', '/api/ai/analyze-chart-image', {
        imageBase64,
        notes: notes || ''
      });
      
      const analysisResult = await response.json();
      console.log('Analysis result from server:', analysisResult);
      
      if (!analysisResult.success) {
        return {
          success: false,
          error: analysisResult.error || 'Failed to analyze image',
          wyckoffPhase: '',
          confidence: 0
        };
      }
      
      return {
        success: true,
        wyckoffPhase: analysisResult.wyckoffPhase || 'Unknown',
        confidence: analysisResult.confidence || 0.5,
        phaseDescription: analysisResult.phaseDescription,
        feedback: analysisResult.feedback,
        tradingRecommendations: analysisResult.tradingRecommendations,
        enhancedImage: analysisResult.enhancedImage,
        events: analysisResult.events || [],
        learningResources: analysisResult.learningResources || []
      };
    } catch (error) {
      console.error('Error analyzing chart image with AI:', error);
      return {
        success: false,
        error: 'Error processing the image analysis',
        wyckoffPhase: '',
        confidence: 0
      };
    }
  }
};

/**
 * Helper function to determine relevant knowledge sources based on the question
 */
function determineSourcesFromQuestion(question: string): string[] {
  const sources: string[] = [];
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('wyckoff') || lowerQuestion.includes('accumulation') || 
      lowerQuestion.includes('distribution') || lowerQuestion.includes('phase')) {
    sources.push('Wyckoff Methodology');
  }
  
  if (lowerQuestion.includes('pattern') || lowerQuestion.includes('head and shoulder') || 
      lowerQuestion.includes('flag') || lowerQuestion.includes('pennant')) {
    sources.push('Chart Pattern Recognition');
  }
  
  if (lowerQuestion.includes('indicator') || lowerQuestion.includes('rsi') || 
      lowerQuestion.includes('macd') || lowerQuestion.includes('moving average')) {
    sources.push('Technical Indicators');
  }
  
  if (lowerQuestion.includes('psychology') || lowerQuestion.includes('emotion') || 
      lowerQuestion.includes('discipline') || lowerQuestion.includes('mindset')) {
    sources.push('Trading Psychology');
  }
  
  if (lowerQuestion.includes('risk') || lowerQuestion.includes('position size') || 
      lowerQuestion.includes('stop loss')) {
    sources.push('Risk Management');
  }
  
  // Add a default source if none were identified
  if (sources.length === 0) {
    sources.push('Trading Fundamentals');
  }
  
  return sources;
}

/**
 * Helper function to format chart data for AI analysis
 */
function formatChartDataForAnalysis(chartData: OHLCV[]): string {
  // Limit the amount of data to prevent token limit issues
  const limitedData = chartData.length > 50 ? chartData.slice(-50) : chartData;
  
  // Format data as a condensed string
  return JSON.stringify(limitedData.map(candle => ({
    time: new Date(candle.time * 1000).toISOString().split('T')[0],
    open: candle.open.toFixed(2),
    high: candle.high.toFixed(2),
    low: candle.low.toFixed(2),
    close: candle.close.toFixed(2),
    volume: candle.volume
  })));
}

/**
 * Helper function to generate a summary of a trader's history
 */
function generateTradingSummary(trades: Trade[]): string {
  // Calculate basic statistics
  const totalTrades = trades.length;
  const completedTrades = trades.filter(t => t.status === 'completed');
  const winningTrades = completedTrades.filter(t => (t.profitLoss || 0) > 0);
  const losingTrades = completedTrades.filter(t => (t.profitLoss || 0) <= 0);
  
  const winRate = completedTrades.length > 0 
    ? (winningTrades.length / completedTrades.length * 100).toFixed(2) 
    : '0.00';
  
  const totalProfitLoss = completedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  
  // Calculate average profit/loss
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / winningTrades.length 
    : 0;
  
  const avgLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / losingTrades.length 
    : 0;
  
  // Calculate risk-reward ratio
  const riskRewardRatio = Math.abs(avgLoss) > 0 ? (avgWin / Math.abs(avgLoss)).toFixed(2) : 'N/A';
  
  // Analyze trading pairs
  const pairFrequency: Record<string, number> = {};
  trades.forEach(trade => {
    pairFrequency[trade.pair] = (pairFrequency[trade.pair] || 0) + 1;
  });
  
  const mostTradedPairs = Object.entries(pairFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pair, count]) => `${pair} (${count})`);
  
  // Analyze strategies
  const strategyFrequency: Record<string, number> = {};
  trades.forEach(trade => {
    if (trade.strategy) {
      strategyFrequency[trade.strategy] = (strategyFrequency[trade.strategy] || 0) + 1;
    }
  });
  
  const mostUsedStrategies = Object.entries(strategyFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([strategy, count]) => `${strategy} (${count})`);
  
  // Build the summary
  return `
Trading Summary:
- Total Trades: ${totalTrades}
- Completed Trades: ${completedTrades.length}
- Win Rate: ${winRate}%
- Total P/L: ${totalProfitLoss.toFixed(2)}
- Avg Win: ${avgWin.toFixed(2)}
- Avg Loss: ${avgLoss.toFixed(2)}
- Risk-Reward Ratio: ${riskRewardRatio}
- Most Traded Pairs: ${mostTradedPairs.join(', ') || 'None'}
- Most Used Strategies: ${mostUsedStrategies.join(', ') || 'None'}
- Long Trades: ${trades.filter(t => t.tradeType === 'long').length}
- Short Trades: ${trades.filter(t => t.tradeType === 'short').length}
`;
}

export default aiService;