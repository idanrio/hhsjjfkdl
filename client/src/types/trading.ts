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
  phase: WyckoffPhase;
  confidence: number;
  schematic?: string;
  events: {
    name: string;
    time: string | number;
    description: string;
    type: 'ps' | 'sc' | 'ar' | 'st' | 'ut' | 'sOS' | 'pBO' | 'lps' | 'spring';
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