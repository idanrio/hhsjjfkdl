import axios from 'axios';
import { ChartData, Position } from '../types/trading';

// API Keys
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';
const COINAPI_KEY = import.meta.env.VITE_COINAPI_KEY || '';

// API Endpoints
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const COINAPI_BASE_URL = 'https://rest.coinapi.io/v1';

// Chart data types
export interface OHLCV {
  time: number; // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Time frame definitions
export const TIME_FRAMES = {
  '1m': { interval: '1min', seconds: 60 },
  '5m': { interval: '5min', seconds: 300 },
  '15m': { interval: '15min', seconds: 900 },
  '30m': { interval: '30min', seconds: 1800 },
  '1h': { interval: '60min', seconds: 3600 },
  '4h': { interval: '4hour', seconds: 14400 },
  '1d': { interval: 'daily', seconds: 86400 },
  '1w': { interval: 'weekly', seconds: 604800 },
};

/**
 * Convert ISO date string to Unix timestamp (seconds)
 */
export function isoToTimestamp(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}

/**
 * Convert Unix timestamp to ISO date string
 */
export function timestampToIso(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Generate realistic OHLCV data for backtesting scenarios
 * when API is not available or for demo purposes
 */
export function generateOHLCVData(
  symbol: string,
  timeframe: string,
  startDate: Date,
  endDate = new Date(),
  basePrice?: number,
  volatility = 0.02
): OHLCV[] {
  // Get the number of seconds for the requested timeframe
  const timeframeSeconds = TIME_FRAMES[timeframe as keyof typeof TIME_FRAMES]?.seconds || 86400;
  
  // Generate starting price based on symbol if not provided
  if (!basePrice) {
    if (symbol === 'BTC') basePrice = 55000 + Math.random() * 5000;
    else if (symbol === 'ETH') basePrice = 3000 + Math.random() * 500;
    else if (symbol === 'SPY') basePrice = 450 + Math.random() * 10;
    else basePrice = 100 + Math.random() * 20;
  }
  
  // Calculate number of periods
  const startTime = Math.floor(startDate.getTime() / 1000);
  const endTime = Math.floor(endDate.getTime() / 1000);
  const totalSeconds = endTime - startTime;
  const periods = Math.ceil(totalSeconds / timeframeSeconds);
  
  const data: OHLCV[] = [];
  let currentPrice = basePrice;
  let lastClose = basePrice;
  
  for (let i = 0; i < periods; i++) {
    const timeUnix = startTime + (i * timeframeSeconds);
    
    // Generate random price movement
    const changePercent = (Math.random() - 0.5) * volatility * 2; // Random between -volatility and +volatility
    const change = lastClose * changePercent;
    
    // Create open, high, low, close values
    const open = lastClose;
    const close = open + change;
    
    // High is the max of open and close, plus a random amount
    const highAdd = open > close 
      ? open * (Math.random() * volatility * 0.5) 
      : close * (Math.random() * volatility * 0.5);
    const high = Math.max(open, close) + highAdd;
    
    // Low is the min of open and close, minus a random amount
    const lowSubtract = open < close 
      ? open * (Math.random() * volatility * 0.5) 
      : close * (Math.random() * volatility * 0.5);
    const low = Math.min(open, close) - lowSubtract;
    
    // Volume is proportional to the price movement (more volume on bigger moves)
    const volume = Math.abs(change) * (basePrice * 10) * (0.5 + Math.random());
    
    data.push({
      time: timeUnix,
      open,
      high,
      low,
      close,
      volume
    });
    
    lastClose = close;
  }
  
  return data;
}

/**
 * Fetch historical OHLCV data from Alpha Vantage
 */
export async function fetchAlphaVantageOHLCV(
  symbol: string,
  interval: string = 'daily',
  outputSize: 'compact' | 'full' = 'compact'
): Promise<OHLCV[]> {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      console.error('Alpha Vantage API key is missing. Using generated data.');
      return generateOHLCVData(symbol, interval === 'daily' ? '1d' : '1h', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    }
    
    // Map interval to Alpha Vantage function
    let timeSeriesFunction = 'TIME_SERIES_DAILY';
    if (interval === 'weekly') timeSeriesFunction = 'TIME_SERIES_WEEKLY';
    else if (interval === 'monthly') timeSeriesFunction = 'TIME_SERIES_MONTHLY';
    else if (interval.includes('min')) timeSeriesFunction = 'TIME_SERIES_INTRADAY';
    
    const params: Record<string, string> = {
      function: timeSeriesFunction,
      symbol,
      apikey: ALPHA_VANTAGE_API_KEY
    };
    
    // Add specific parameters for intraday data
    if (timeSeriesFunction === 'TIME_SERIES_INTRADAY') {
      params.interval = interval;
      params.outputsize = outputSize;
    } else if (timeSeriesFunction === 'TIME_SERIES_DAILY') {
      params.outputsize = outputSize;
    }
    
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, { params });
    
    // Handle API errors
    if (response.data.Note || response.data['Error Message']) {
      throw new Error(response.data.Note || response.data['Error Message']);
    }
    
    // Find the correct time series key in the response
    const timeSeriesKey = Object.keys(response.data).find(key => key.startsWith('Time Series'));
    if (!timeSeriesKey || !response.data[timeSeriesKey]) {
      throw new Error('No time series data found in the response');
    }
    
    const timeSeries = response.data[timeSeriesKey];
    const ohlcvData: OHLCV[] = [];
    
    for (const dateStr in timeSeries) {
      const dataPoint = timeSeries[dateStr];
      const timestamp = isoToTimestamp(dateStr);
      
      ohlcvData.push({
        time: timestamp,
        open: parseFloat(dataPoint['1. open']),
        high: parseFloat(dataPoint['2. high']),
        low: parseFloat(dataPoint['3. low']),
        close: parseFloat(dataPoint['4. close']),
        volume: parseFloat(dataPoint['5. volume'] || '0')
      });
    }
    
    // Sort by time ascending
    ohlcvData.sort((a, b) => a.time - b.time);
    
    return ohlcvData;
  } catch (error) {
    console.error('Error fetching data from Alpha Vantage:', error);
    // Return generated data as fallback
    return generateOHLCVData(symbol, interval === 'daily' ? '1d' : '1h', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  }
}

/**
 * Fetch historical OHLCV data from CoinAPI
 */
export async function fetchCoinAPIOHLCV(
  symbol: string,
  period: string = '1DAY',
  startDate?: Date,
  endDate: Date = new Date()
): Promise<OHLCV[]> {
  try {
    if (!COINAPI_KEY) {
      console.error('CoinAPI key is missing. Using generated data.');
      return generateOHLCVData(
        symbol, 
        period === '1DAY' ? '1d' : 
        period === '1HRS' ? '1h' : 
        period === '15MIN' ? '15m' : '1d',
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
    }
    
    // Default to 30 days of history if no start date is provided
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    
    const response = await axios.get(`${COINAPI_BASE_URL}/ohlcv/${symbol}/USD/history`, {
      headers: {
        'X-CoinAPI-Key': COINAPI_KEY
      },
      params: {
        period_id: period,
        time_start: startDate.toISOString(),
        time_end: endDate.toISOString(),
        limit: 1000
      }
    });
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    const ohlcvData: OHLCV[] = response.data.map((item: any) => ({
      time: isoToTimestamp(item.time_period_start),
      open: item.price_open,
      high: item.price_high,
      low: item.price_low,
      close: item.price_close,
      volume: item.volume_traded
    }));
    
    // Sort by time ascending
    ohlcvData.sort((a, b) => a.time - b.time);
    
    return ohlcvData;
  } catch (error) {
    console.error('Error fetching data from CoinAPI:', error);
    // Return generated data as fallback
    return generateOHLCVData(
      symbol, 
      period === '1DAY' ? '1d' : 
      period === '1HRS' ? '1h' : 
      period === '15MIN' ? '15m' : '1d',
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
  }
}

/**
 * Main function to get OHLCV data for a specific symbol, optimized for charting
 */
export async function getChartData(
  symbol: string,
  timeframe: string = '1d',
  startDate?: Date,
  endDate: Date = new Date()
): Promise<OHLCV[]> {
  // Determine if we're dealing with a stock or crypto symbol
  const isCrypto = ['BTC', 'ETH', 'XRP', 'LTC', 'BNB', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE', 'USDT', 'UNI'].includes(symbol);
  
  try {
    if (isCrypto) {
      // Map timeframe to CoinAPI period format
      const periodMap: Record<string, string> = {
        '1m': '1MIN',
        '5m': '5MIN',
        '15m': '15MIN',
        '30m': '30MIN',
        '1h': '1HRS',
        '4h': '4HRS',
        '1d': '1DAY',
        '1w': '1WEK'
      };
      
      const period = periodMap[timeframe] || '1DAY';
      return await fetchCoinAPIOHLCV(symbol, period, startDate, endDate);
    } else {
      // Map timeframe to Alpha Vantage interval format
      const intervalMap: Record<string, string> = {
        '1m': '1min',
        '5m': '5min',
        '15m': '15min',
        '30m': '30min',
        '1h': '60min',
        '1d': 'daily',
        '1w': 'weekly',
        '1M': 'monthly'
      };
      
      const interval = intervalMap[timeframe] || 'daily';
      const outputSize = startDate && ((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) > 100 ? 'full' : 'compact';
      
      return await fetchAlphaVantageOHLCV(symbol, interval, outputSize);
    }
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    // Fall back to generated data
    return generateOHLCVData(
      symbol, 
      timeframe, 
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate
    );
  }
}

/**
 * Format OHLCV data for use with lightweight-charts library
 */
export function formatOHLCVForLightweightCharts(data: OHLCV[]): any[] {
  return data.map(item => ({
    time: item.time,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    value: item.close,
    volume: item.volume
  }));
}

/**
 * Fetch realtime price for a symbol
 */
export async function getRealTimePrice(symbol: string): Promise<number | null> {
  // Determine if we're dealing with a stock or crypto symbol
  const isCrypto = ['BTC', 'ETH', 'XRP', 'LTC', 'BNB', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE', 'USDT', 'UNI'].includes(symbol);
  
  try {
    if (isCrypto) {
      if (!COINAPI_KEY) {
        throw new Error('CoinAPI key is missing');
      }
      
      const response = await axios.get(`${COINAPI_BASE_URL}/exchangerate/${symbol}/USD`, {
        headers: {
          'X-CoinAPI-Key': COINAPI_KEY
        }
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data.rate;
    } else {
      if (!ALPHA_VANTAGE_API_KEY) {
        throw new Error('Alpha Vantage API key is missing');
      }
      
      const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
      
      if (response.data.Note || response.data['Error Message']) {
        throw new Error(response.data.Note || response.data['Error Message']);
      }
      
      const globalQuote = response.data['Global Quote'];
      if (!globalQuote) {
        throw new Error('No quote data available');
      }
      
      return parseFloat(globalQuote['05. price']);
    }
  } catch (error) {
    console.error(`Error fetching real-time price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Calculate position PnL (Profit and Loss)
 */
export function calculatePositionPnL(position: Position, currentPrice: number): number {
  if (position.status === 'closed' && position.profitLoss !== undefined) {
    return position.profitLoss;
  }
  
  const entryPrice = position.entryPrice;
  const amount = position.amount;
  const leverage = position.leverage || 1;
  
  if (position.type === 'long') {
    return (currentPrice - entryPrice) * amount * leverage;
  } else {
    return (entryPrice - currentPrice) * amount * leverage;
  }
}

/**
 * Calculate position PnL as a percentage
 */
export function calculatePositionPnLPercentage(position: Position, currentPrice: number): number {
  if (position.status === 'closed' && position.profitLoss !== undefined && position.entryPrice !== 0) {
    return (position.profitLoss / (position.entryPrice * position.amount)) * 100;
  }
  
  const entryPrice = position.entryPrice;
  const leverage = position.leverage || 1;
  
  if (position.type === 'long') {
    return ((currentPrice - entryPrice) / entryPrice) * 100 * leverage;
  } else {
    return ((entryPrice - currentPrice) / entryPrice) * 100 * leverage;
  }
}