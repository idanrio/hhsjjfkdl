// Trading types for Capitulre platform

// Wyckoff Analysis Types
export interface WyckoffAnalysisResult {
  phase: string;
  confidence: number;
  patterns: string[];
  description: string;
  priceTarget: {
    direction: 'long' | 'short' | 'neutral';
    price?: number;
    confidence: number;
    timeframe?: string;
    rationale?: string;
    riskRewardRatio?: string;
  };
  recommendations: string[];
}

// Chart Pattern Types
export interface ChartPatternRecognitionResult {
  name: string;
  startPoint: { time: number; price: number };
  endPoint: { time: number; price: number };
  confidence: number;
  description: string;
  expectedMove: {
    direction: 'up' | 'down' | 'sideways';
    magnitude: 'small' | 'medium' | 'large';
    priceTarget?: number;
  };
}

// Position Types
export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'active' | 'closed';

export interface Position {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  leverage: number;
  liquidationPrice: number;
  entryTime: Date;
  exitTime?: Date;
  status: TradeStatus;
  profitLoss: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  currentPrice?: number;
}

// OHLCV (Open, High, Low, Close, Volume) data
export interface OHLCV {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}