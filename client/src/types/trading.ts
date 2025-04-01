/**
 * Position type for tracking trading positions
 */
export interface Position {
  id: string;
  type: 'long' | 'short';
  entryPrice: number;
  entryTime: string | number;
  stopLoss: number | null;
  takeProfit: number | null;
  amount: number;
  leverage: number;
  status: 'active' | 'closed';
  exitPrice?: number;
  exitTime?: string | number;
  profitLoss?: number;
}

/**
 * Chart pattern recognition result type
 */
export interface ChartPatternRecognitionResult {
  name: string;
  description: string;
  confidence: number;
  startTime: string | number;
  endTime: string | number;
  type: 'bullish' | 'bearish' | 'neutral';
  priceTarget?: number;
}

/**
 * OHLCV data type for candle charts
 */
export interface OHLCV {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Wyckoff phase type for market structure analysis
 */
export enum WyckoffPhase {
  Accumulation = 'accumulation',
  Markup = 'markup',
  Distribution = 'distribution',
  Markdown = 'markdown'
}

/**
 * Wyckoff analysis result type
 */
export interface WyckoffAnalysisResult {
  wyckoffPhase: string;
  confidence: number;
  schematic?: string;
  phaseDescription?: string;
  feedback?: string;
  tradingRecommendations?: string[];
  enhancedImage?: string;
  priceTarget?: {
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    direction?: 'long' | 'short' | 'neutral';
    rationale?: string;
    riskRewardRatio?: number;
  };
  symbolInfo?: {
    name?: string;
    timeframe?: string;
    currentPrice?: number;
  };
  events?: {
    type: string;
    location: string;
    description: string;
  }[];
  learningResources?: {
    title: string;
    url?: string;
    type?: string;
    description?: string;
  }[];
}

/**
 * Chart Analysis combined result type
 */
export interface ChartAnalysisResult {
  patterns: ChartPatternRecognitionResult[];
  wyckoff?: WyckoffAnalysisResult;
  trendStrength?: number;
  support?: number[];
  resistance?: number[];
  keyLevels?: number[];
}

/**
 * Trade interface for backtesting system
 */
export interface Trade {
  id: number;
  userId: number;
  pair: string;
  tradeType: 'long' | 'short';
  entryPrice: string;
  entryTime: string;
  amount: string;
  status: 'active' | 'completed';
  exitPrice?: string;
  exitTime?: string;
  stopLoss?: string;
  takeProfit?: string;
  notes?: string;
  strategy?: string;
  profitLoss?: number;
  volume?: number;
  leverage?: number;
  fees?: number;
  tags?: string[];
}