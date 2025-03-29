/**
 * Technical Indicators Library
 * 
 * This file contains implementations of common technical indicators used in trading.
 * These functions process chart data and return formatted data ready to be used
 * in the TradingView-like chart component.
 */

interface CandleData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface LineData {
  time: string | number;
  value: number;
}

interface HistogramData {
  time: string | number;
  value: number;
  color?: string;
}

/**
 * Simple Moving Average (SMA)
 */
export function computeSMA(data: CandleData[], period: number): LineData[] {
  const result: LineData[] = [];
  
  if (data.length < period) {
    return result;
  }
  
  // Calculate SMA for each point after we have enough data
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    
    result.push({
      time: data[i].time,
      value: sum / period
    });
  }
  
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function computeEMA(data: CandleData[], period: number): LineData[] {
  const result: LineData[] = [];
  
  if (data.length < period) {
    return result;
  }
  
  // Calculate the multiplier
  const multiplier = 2 / (period + 1);
  
  // Calculate first EMA (which is a simple SMA)
  let ema = data.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) / period;
  
  // Calculate EMA for each subsequent point
  for (let i = period - 1; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    
    result.push({
      time: data[i].time,
      value: ema
    });
  }
  
  return result;
}

/**
 * Bollinger Bands
 */
export function computeBollingerBands(
  data: CandleData[], 
  period: number, 
  multiplier: number
): { upper: LineData[], middle: LineData[], lower: LineData[] } {
  const upper: LineData[] = [];
  const middle: LineData[] = [];
  const lower: LineData[] = [];
  
  if (data.length < period) {
    return { upper, middle, lower };
  }
  
  // Calculate bands for each point after we have enough data
  for (let i = period - 1; i < data.length; i++) {
    // Calculate SMA (middle band)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const sma = sum / period;
    
    // Calculate standard deviation
    let squaredDiffSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma;
      squaredDiffSum += diff * diff;
    }
    const stdDev = Math.sqrt(squaredDiffSum / period);
    
    // Calculate bands
    const upperBand = sma + (stdDev * multiplier);
    const lowerBand = sma - (stdDev * multiplier);
    
    // Store results
    upper.push({ time: data[i].time, value: upperBand });
    middle.push({ time: data[i].time, value: sma });
    lower.push({ time: data[i].time, value: lowerBand });
  }
  
  return { upper, middle, lower };
}

/**
 * Relative Strength Index (RSI)
 */
export function computeRSI(data: CandleData[], period: number): LineData[] {
  const result: LineData[] = [];
  
  if (data.length < period + 1) {
    return result;
  }
  
  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }
  
  // Calculate RSI for each point after we have enough data
  for (let i = period; i < changes.length; i++) {
    let gains = 0;
    let losses = 0;
    
    // Calculate average gains and losses for the period
    for (let j = i - period; j < i; j++) {
      if (changes[j] >= 0) {
        gains += changes[j];
      } else {
        losses += Math.abs(changes[j]);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) {
      // If there are no losses in the period, RSI is 100
      result.push({ time: data[i].time, value: 100 });
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push({ time: data[i].time, value: rsi });
    }
  }
  
  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 */
export function computeMACD(
  data: CandleData[], 
  fastPeriod: number, 
  slowPeriod: number, 
  signalPeriod: number
): { macdLine: LineData[], signalLine: LineData[], histogram: HistogramData[] } {
  const macdLine: LineData[] = [];
  const signalLine: LineData[] = [];
  const histogram: HistogramData[] = [];
  
  if (data.length < Math.max(fastPeriod, slowPeriod, signalPeriod)) {
    return { macdLine, signalLine, histogram };
  }
  
  // Calculate fast and slow EMAs
  const fastEMA = computeEMA(data, fastPeriod);
  const slowEMA = computeEMA(data, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macdValues: CandleData[] = [];
  
  // Find the starting point where both EMAs have values
  const startIndex = Math.max(fastPeriod, slowPeriod) - 1;
  
  for (let i = 0; i < slowEMA.length; i++) {
    const slowEMAValue = slowEMA[i];
    
    // Find the corresponding fast EMA value with the same time
    const fastEMAValue = fastEMA.find(item => item.time === slowEMAValue.time);
    
    if (fastEMAValue) {
      const macdValue = fastEMAValue.value - slowEMAValue.value;
      macdLine.push({
        time: slowEMAValue.time,
        value: macdValue
      });
      
      // Store MACD values for signal line calculation
      macdValues.push({
        time: slowEMAValue.time,
        open: macdValue,
        high: macdValue,
        low: macdValue,
        close: macdValue
      });
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalEMA = computeEMA(macdValues, signalPeriod);
  
  // Calculate histogram (MACD - Signal)
  for (let i = 0; i < signalEMA.length; i++) {
    const signalValue = signalEMA[i];
    
    // Find the corresponding MACD value with the same time
    const macdValue = macdLine.find(item => item.time === signalValue.time);
    
    if (macdValue) {
      signalLine.push(signalValue);
      
      const histValue = macdValue.value - signalValue.value;
      histogram.push({
        time: signalValue.time,
        value: histValue,
        color: histValue >= 0 ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 82, 82, 0.5)'
      });
    }
  }
  
  return { macdLine, signalLine, histogram };
}

/**
 * Average True Range (ATR)
 */
export function computeATR(data: CandleData[], period: number): LineData[] {
  const result: LineData[] = [];
  
  if (data.length < period + 1) {
    return result;
  }
  
  // Calculate True Range for each candle
  const trValues: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const currentHigh = data[i].high;
    const currentLow = data[i].low;
    const previousClose = data[i - 1].close;
    
    const tr1 = currentHigh - currentLow;
    const tr2 = Math.abs(currentHigh - previousClose);
    const tr3 = Math.abs(currentLow - previousClose);
    
    const trueRange = Math.max(tr1, tr2, tr3);
    trValues.push(trueRange);
  }
  
  // Calculate first ATR as simple average of TR over the period
  let atr = trValues.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  
  // Calculate ATR for each subsequent point using smoothing
  for (let i = period; i < trValues.length; i++) {
    atr = ((atr * (period - 1)) + trValues[i]) / period;
    
    result.push({
      time: data[i + 1].time, // +1 because TR values start from the second candle
      value: atr
    });
  }
  
  return result;
}

/**
 * Stochastic Oscillator
 */
export function computeStochastic(
  data: CandleData[], 
  periodK: number, 
  smoothK: number, 
  smoothD: number
): { k: LineData[], d: LineData[] } {
  const kLine: LineData[] = [];
  const dLine: LineData[] = [];
  
  if (data.length < periodK) {
    return { k: kLine, d: dLine };
  }
  
  // Calculate raw K values
  const rawK: number[] = [];
  
  for (let i = periodK - 1; i < data.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    
    for (let j = i - (periodK - 1); j <= i; j++) {
      highestHigh = Math.max(highestHigh, data[j].high);
      lowestLow = Math.min(lowestLow, data[j].low);
    }
    
    const currentClose = data[i].close;
    
    if (highestHigh === lowestLow) {
      rawK.push(50); // Default to 50 when there's no range
    } else {
      const stochasticK = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      rawK.push(stochasticK);
    }
  }
  
  // Apply smoothing to K line if needed
  let smoothedK: number[];
  if (smoothK > 1) {
    smoothedK = [];
    for (let i = smoothK - 1; i < rawK.length; i++) {
      let sum = 0;
      for (let j = i - (smoothK - 1); j <= i; j++) {
        sum += rawK[j];
      }
      smoothedK.push(sum / smoothK);
    }
  } else {
    smoothedK = rawK;
  }
  
  // Create K line data
  for (let i = 0; i < smoothedK.length; i++) {
    kLine.push({
      time: data[i + periodK - 1 + (smoothK > 1 ? smoothK - 1 : 0)].time,
      value: smoothedK[i]
    });
  }
  
  // Calculate D line (SMA of K line)
  for (let i = smoothD - 1; i < smoothedK.length; i++) {
    let sum = 0;
    for (let j = i - (smoothD - 1); j <= i; j++) {
      sum += smoothedK[j];
    }
    
    dLine.push({
      time: data[i + periodK - 1 + (smoothK > 1 ? smoothK - 1 : 0)].time,
      value: sum / smoothD
    });
  }
  
  return { k: kLine, d: dLine };
}