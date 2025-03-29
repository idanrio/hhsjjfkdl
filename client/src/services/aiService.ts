import OpenAI from 'openai';
import { ChartPatternRecognitionResult, Position, Trade } from '../types/trading';
import { OHLCV } from './enhancedMarketService';

// Initialize OpenAI client with API key from environment
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '';
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Allow usage in browser environment
});

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
      if (!apiKey) {
        console.error('OpenAI API key is missing');
        return {
          answer: 'The AI assistant is currently unavailable. Please check your API key configuration.',
          confidence: 0
        };
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a sophisticated trading and financial markets assistant for Capitulre, a trading education platform. 
            You specialize in technical analysis, Wyckoff methodology, chart patterns, and trading psychology.
            Provide concise, accurate responses backed by trading principles.
            For Wyckoff-related questions, refer to the phases of accumulation, markup, distribution, and markdown.
            Only provide information you're confident about, and acknowledge uncertainty when appropriate.
            Your responses should be educational and actionable.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      });

      const answer = response.choices[0].message.content || 'Unable to generate a response';
      
      // Determine sources based on question content
      const sources = determineSourcesFromQuestion(question);
      
      // Calculate confidence based on model's finish_reason and other factors
      const confidence = response.choices[0].finish_reason === 'stop' ? 0.9 : 0.7;

      return {
        answer,
        sources,
        confidence
      };
    } catch (error) {
      console.error('Error asking AI question:', error);
      return {
        answer: 'Sorry, I encountered an error processing your question. Please try again later.',
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
      if (!apiKey) {
        console.error('OpenAI API key is missing');
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

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert chart analyst specializing in Wyckoff methodology and technical patterns.
            Analyze the provided OHLCV chart data to identify patterns, market phases, and key price levels.
            Your response should follow JSON format with: patterns (array of detected patterns with confidence),
            summary (overview of chart conditions), keyLevels (support and resistance),
            wyckoffPhase (current Wyckoff phase if identifiable), marketStructure (bullish/bearish/ranging),
            and recommendation (trading recommendation based on analysis).`
          },
          {
            role: 'user',
            content: `Analyze this ${timeframe} chart data for ${symbol}:
            ${formattedChartData}`
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 1000
      });

      // Parse the JSON response
      const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
      
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
      if (!apiKey) {
        console.error('OpenAI API key is missing');
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

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional trading coach for Capitulre, a trading education platform.
            Analyze the trader's history and provide personalized advice to improve their performance.
            Focus on pattern recognition in their trading behavior, risk management, emotional discipline, and strategy optimization.
            Your response should follow JSON format with: advice (main recommendations),
            riskAnalysis (assessment of risk taking), improvementAreas (array of specific areas to improve),
            suggestedStrategies (array of strategies that might work for this trader), and confidence (your confidence in the advice).`
          },
          {
            role: 'user',
            content: `Analyze my trading history and provide personalized advice:
            ${tradingSummary}
            ${positionInfo}`
          }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
        max_tokens: 800
      });

      // Parse the JSON response
      const adviceResult = JSON.parse(response.choices[0].message.content || '{}');
      
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
      if (!apiKey) {
        console.error('OpenAI API key is missing');
        return 'Pattern explanations are currently unavailable. Please check your API key configuration.';
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a technical analysis educator for Capitulre, a trading education platform.
            Provide a comprehensive explanation of the requested chart pattern, including:
            1. Visual description of how to identify it
            2. Market psychology behind the pattern
            3. Traditional interpretation and success rate
            4. Common entry, stop loss, and take profit strategies
            5. Risk management considerations
            6. Example scenarios where the pattern worked and failed
            Keep your explanation educational, precise, and actionable with approximately 300-400 words.`
          },
          {
            role: 'user',
            content: `Explain the "${patternName}" chart pattern in detail.`
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      });

      return response.choices[0].message.content || 
        'Unable to generate pattern explanation. Please try again.';
    } catch (error) {
      console.error('Error explaining pattern:', error);
      return 'Sorry, I encountered an error generating the pattern explanation. Please try again later.';
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