/**
 * Trading related type definitions
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

export interface ChartData {
  time: string | number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface IndicatorParameter {
  name: string;
  type: 'number' | 'boolean' | 'select';
  defaultValue: number | boolean | string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface Indicator {
  id: string;
  name: string;
  description?: string;
  category: 'trend' | 'momentum' | 'volatility' | 'volume' | 'other';
  parameters: IndicatorParameter[];
  overlay?: boolean;
}

export interface ChartPatternRecognitionResult {
  pattern: string;
  startIndex: number;
  endIndex: number;
  startPrice: number;
  endPrice: number;
  confidence: number;
  description: string;
  type: 'reversal' | 'continuation' | 'ranging';
  direction: 'bullish' | 'bearish' | 'neutral';
  expectedMove?: {
    direction: 'up' | 'down' | 'sideways';
    magnitude: 'small' | 'medium' | 'large';
    targetPrice?: number;
  };
  recommendations: string[];
}

export interface DrawingObject {
  id: string;
  type: 'line' | 'horizontal' | 'rectangle' | 'fibonacci' | 'text' | 'channel';
  points: { time: number | string; price: number }[];
  text?: string;
  color: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  backgroundColor?: string;
  visible?: boolean;
}

export interface TimeFrame {
  value: string;
  label: string;
  seconds: number;
}

export interface TradingSymbol {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index';
  exchange?: string;
  precision: number;
  minTick: number;
  pipValue?: number;
  baseAsset?: string;
  quoteAsset?: string;
}

export interface OrderType {
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  price?: number;
  stopPrice?: number;
  trailingOffset?: number;
  expiry?: 'day' | 'gtc' | 'ioc' | 'fok';
}

export interface Order extends OrderType {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  status: 'pending' | 'filled' | 'partial_fill' | 'cancelled' | 'rejected';
  filledQuantity?: number;
  averagePrice?: number;
  created: number;
  updated: number;
  parentId?: string;
}

export interface Trade {
  id: number;
  userId: number;
  pair: string;
  entryPrice: string;
  exitPrice: string | null;
  amount: string;
  tradeType: 'long' | 'short';
  strategy: string | null;
  date: string;
  status: 'active' | 'completed';
  profitLoss: number | null;
  notes: string | null;
}

export interface StrategyType {
  id: number;
  name: string;
  description: string | null;
}

export interface TradingPair {
  id: number;
  pair: string;
  description: string | null;
}