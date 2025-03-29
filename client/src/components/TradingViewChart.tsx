import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend, Line, Area,
  Bar as RechartsBar, BarChart, ComposedChart
} from 'recharts';
import { 
  Crosshair, LineChart as LineChartIcon, Square, 
  BarChart3, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { getCryptoData, getStockData, getHistoricalCryptoData, getHistoricalStockData } from '@/services/marketService';

interface ChartData {
  time: string | number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

interface Position {
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

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface TradingViewChartProps {
  symbol: string;
  initialPrice?: number;
  className?: string;
  initialPositions?: Position[];
  showArea?: boolean;
  activeIndicators?: string[];
  activeRange?: string;
  showVolume?: boolean;
  simulateRealTime?: boolean;
  timeControllerDate?: Date;
  isPlaying?: boolean;
  playbackSpeed?: number;
  enableDrawingTools?: boolean;
  enablePatternRecognition?: boolean;
  onPatternDetected?: (patterns: any[]) => void;
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    if (data.open && data.close && data.high && data.low) {
      return (
        <div className="bg-background shadow-lg border p-2 rounded-md">
          <p className="text-sm">Date: {new Date(label || '').toLocaleString()}</p>
          <p className="text-sm">Open: {formatPrice(data.open)}</p>
          <p className="text-sm">High: {formatPrice(data.high)}</p>
          <p className="text-sm">Low: {formatPrice(data.low)}</p>
          <p className="text-sm">Close: {formatPrice(data.close)}</p>
          {data.volume && (
            <p className="text-sm">Volume: {formatLargeNumber(data.volume)}</p>
          )}
        </div>
      );
    }
    
    return (
      <div className="bg-background shadow-lg border p-2 rounded-md">
        <p className="text-sm">Date: {new Date(label || '').toLocaleString()}</p>
        <p className="text-sm">Price: {formatPrice(data.value || payload[0].value)}</p>
      </div>
    );
  }

  return null;
};

// Format price for display
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price < 1 ? 4 : 2,
    maximumFractionDigits: price < 1 ? 4 : 2,
  }).format(price);
};

// Format large numbers with k/m/b suffixes
const formatLargeNumber = (num: number) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Generates random historical data
const generateHistoricalData = (
  initialPrice: number, 
  days: number = 30, 
  volatility: number = 0.02
): ChartData[] => {
  const data: ChartData[] = [];
  let currentPrice = initialPrice;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic OHLC data
    const changePercent = (Math.random() - 0.5) * volatility;
    const open = i === days ? initialPrice : data[data.length - 1].close as number;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      time: date.getTime(),
      value: close, // For simple line charts
      open,
      high, 
      low,
      close,
      volume
    });
    
    currentPrice = close;
  }
  
  return data;
};

// Main Chart Component
// Pattern detection types
interface Pattern {
  type: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  description: string;
}

// Drawing tool state types
interface DrawingState {
  tool: 'line' | 'rectangle' | 'fibonacci' | 'channel' | 'trendline' | 'text' | 'none';
  points: { x: number; y: number }[];
  color: string;
  active: boolean;
  drawings: Drawing[];
}

interface Drawing {
  type: string;
  points: { x: number; y: number }[];
  color: string;
  id: string;
}

// Detect patterns in chart data
const detectPatterns = (data: ChartData[]): Pattern[] => {
  const patterns: Pattern[] = [];
  
  // Simple example pattern detection - Head and Shoulders
  for (let i = 20; i < data.length - 10; i++) {
    // Find potential left shoulder, head, and right shoulder
    const windowLeft = data.slice(i - 20, i);
    const windowHead = data.slice(i - 10, i + 10);
    const windowRight = data.slice(i, i + 20);
    
    const leftHigh = Math.max(...windowLeft.map(d => d.high || 0));
    const headHigh = Math.max(...windowHead.map(d => d.high || 0));
    const rightHigh = Math.max(...windowRight.map(d => d.high || 0));
    
    // Simple heuristic for head and shoulders
    if (
      headHigh > leftHigh * 1.02 && 
      headHigh > rightHigh * 1.02 && 
      Math.abs(leftHigh - rightHigh) / leftHigh < 0.05
    ) {
      patterns.push({
        type: 'Head and Shoulders',
        startIndex: i - 20,
        endIndex: i + 20,
        confidence: 0.75,
        description: 'Potential reversal pattern indicating market top'
      });
      i += 20; // Skip ahead to avoid duplicate detections
    }
  }
  
  // Double Top detection
  for (let i = 15; i < data.length - 15; i++) {
    const windowFirst = data.slice(i - 15, i);
    const windowMiddle = data.slice(i, i + 10);
    const windowSecond = data.slice(i + 10, i + 25);
    
    const firstHigh = Math.max(...windowFirst.map(d => d.high || 0));
    const middleLow = Math.min(...windowMiddle.map(d => d.low || 0));
    const secondHigh = Math.max(...windowSecond.map(d => d.high || 0));
    
    // Simple heuristic for double top
    if (
      Math.abs(firstHigh - secondHigh) / firstHigh < 0.03 && 
      firstHigh > middleLow * 1.03 && 
      secondHigh > middleLow * 1.03
    ) {
      patterns.push({
        type: 'Double Top',
        startIndex: i - 15,
        endIndex: i + 25,
        confidence: 0.8,
        description: 'Bearish reversal pattern at resistance'
      });
      i += 25; // Skip ahead to avoid duplicate detections
    }
  }
  
  // Cup and Handle detection (simplified)
  for (let i = 30; i < data.length - 15; i++) {
    const windowCup = data.slice(i - 30, i);
    const windowHandle = data.slice(i, i + 15);
    
    // Check for cup shape (U-shape)
    const cupStart = windowCup[0].close || 0;
    const cupEnd = windowCup[windowCup.length - 1].close || 0;
    const cupLow = Math.min(...windowCup.map(d => d.low || 0));
    
    // Check for handle shape (slight downtrend)
    const handleStart = windowHandle[0].close || 0;
    const handleEnd = windowHandle[windowHandle.length - 1].close || 0;
    
    // Simple heuristic for cup and handle
    if (
      Math.abs(cupStart - cupEnd) / cupStart < 0.05 && 
      cupStart > cupLow * 1.05 && 
      cupEnd > cupLow * 1.05 &&
      handleStart >= handleEnd && 
      handleEnd / handleStart > 0.97
    ) {
      patterns.push({
        type: 'Cup and Handle',
        startIndex: i - 30,
        endIndex: i + 15,
        confidence: 0.7,
        description: 'Bullish continuation pattern'
      });
      i += 15; // Skip ahead to avoid duplicate detections
    }
  }
  
  return patterns;
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  symbol, 
  initialPrice = 100,
  className = '', 
  initialPositions = [],
  showArea: propShowArea = false,
  activeIndicators = ['ma'],
  activeRange: propActiveRange = '1d',
  showVolume: propShowVolume = true,
  simulateRealTime = false,
  timeControllerDate,
  isPlaying = false,
  playbackSpeed = 1,
  enableDrawingTools = false,
  enablePatternRecognition = false,
  onPatternDetected
}) => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArea, setShowArea] = useState(propShowArea);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [activeRange, setActiveRange] = useState(propActiveRange);
  const [indicators, setIndicators] = useState<string[]>(activeIndicators);
  const [showVolume, setShowVolume] = useState(propShowVolume);
  // State for pattern detection
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  // State for drawing tools
  const [drawingState, setDrawingState] = useState<DrawingState>({
    tool: 'none',
    points: [],
    color: '#22a1e2', // Use Capitulre light blue
    active: false,
    drawings: []
  });
  
  // Update positions when initialPositions prop changes
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);
  
  // Update showArea when prop changes
  useEffect(() => {
    setShowArea(propShowArea);
  }, [propShowArea]);
  
  // Update activeRange when prop changes
  useEffect(() => {
    setActiveRange(propActiveRange);
  }, [propActiveRange]);
  
  // Update indicators when prop changes
  useEffect(() => {
    setIndicators(activeIndicators);
  }, [activeIndicators]);
  
  // Update showVolume when prop changes
  useEffect(() => {
    setShowVolume(propShowVolume);
  }, [propShowVolume]);
  
  // Pattern detection effect - runs when chart data changes and pattern recognition is enabled
  useEffect(() => {
    if (enablePatternRecognition && chartData.length > 0) {
      // Run pattern detection algorithm
      const detectedPatterns = detectPatterns(chartData);
      setPatterns(detectedPatterns);
      
      // Call the callback with detected patterns if provided
      if (onPatternDetected && detectedPatterns.length > 0) {
        // Convert patterns to a format that can be used by the callback
        const patternResults = detectedPatterns.map(pattern => ({
          pattern: pattern.type,
          confidence: pattern.confidence,
          description: pattern.description,
          recommendations: [
            pattern.type === 'Head and Shoulders' ? 'Consider opening short positions' : 
            pattern.type === 'Double Top' ? 'Potential for a market reversal down' :
            pattern.type === 'Cup and Handle' ? 'Look for a breakout to the upside' : 
            'Monitor price action for confirmation'
          ],
          areas: [{
            start: chartData[pattern.startIndex]?.time,
            end: chartData[pattern.endIndex]?.time,
            type: pattern.type
          }]
        }));
        
        onPatternDetected(patternResults);
      }
    }
  }, [chartData, enablePatternRecognition, onPatternDetected]);
  
  // Load chart data on mount and when symbol or time frame changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        let data: ChartData[] = [];
        const symbolType = symbol.includes('/') ? 'crypto' : 'stock';
        
        // For stocks: determine interval based on active range 
        let stockInterval: 'daily' | 'weekly' | 'monthly';
        if (activeRange === '1D') stockInterval = 'daily';
        else if (activeRange === '1W') stockInterval = 'weekly';
        else stockInterval = 'daily'; // Default to daily for other ranges
        
        // For crypto: determine period based on active range
        let cryptoPeriod: string;
        if (activeRange === '1m') cryptoPeriod = '1MIN';
        else if (activeRange === '5m') cryptoPeriod = '5MIN';
        else if (activeRange === '15m') cryptoPeriod = '15MIN';
        else if (activeRange === '1h') cryptoPeriod = '1HRS';
        else if (activeRange === '4h') cryptoPeriod = '4HRS';
        else if (activeRange === '1D') cryptoPeriod = '1DAY';
        else cryptoPeriod = '1DAY'; // Default to 1DAY for other ranges
        
        // Calculate timeStart based on the active range for crypto
        const now = new Date();
        let timeStart = new Date();
        if (activeRange === '1m') timeStart.setHours(now.getHours() - 1); // Last hour
        else if (activeRange === '5m') timeStart.setHours(now.getHours() - 4); // Last 4 hours
        else if (activeRange === '15m') timeStart.setHours(now.getHours() - 8); // Last 8 hours
        else if (activeRange === '1h') timeStart.setDate(now.getDate() - 1); // Last day
        else if (activeRange === '4h') timeStart.setDate(now.getDate() - 3); // Last 3 days
        else if (activeRange === '1D') timeStart.setDate(now.getDate() - 30); // Last 30 days
        else timeStart.setDate(now.getDate() - 90); // Last 90 days
        
        // Fetch historical data from APIs
        if (symbolType === 'crypto') {
          const cryptoSymbol = symbol.split('/')[0];
          try {
            const historicalData = await getHistoricalCryptoData(
              cryptoSymbol, 
              timeStart.toISOString(), 
              now.toISOString(), 
              cryptoPeriod
            );
            
            if (historicalData && historicalData.length > 0) {
              data = historicalData.map(item => ({
                time: new Date(item.date).getTime(),
                value: item.close,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume
              }));
            }
          } catch (error) {
            console.error('Error fetching crypto historical data:', error);
          }
        } else {
          // For stocks and indices
          try {
            const outputSize = (activeRange === '1D' || activeRange === '1W') ? 'compact' : 'full';
            const historicalData = await getHistoricalStockData(symbol, stockInterval, outputSize);
            
            if (historicalData && historicalData.length > 0) {
              data = historicalData.map(item => ({
                time: new Date(item.date).getTime(),
                value: item.close,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume
              }));
            }
          } catch (error) {
            console.error('Error fetching stock historical data:', error);
          }
        }
        
        // If we couldn't get data from API, use backup generated data
        if (data.length === 0) {
          console.warn('Failed to get real market data, using generated data');
          data = generateHistoricalData(initialPrice);
        }
        
        // Sort data by time
        data.sort((a, b) => Number(a.time) - Number(b.time));
        
        setChartData(data);
        if (data.length > 0) {
          setCurrentPrice(data[data.length - 1].close || initialPrice);
        } else {
          setCurrentPrice(initialPrice);
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
        // Fallback to generated data
        const data = generateHistoricalData(initialPrice);
        setChartData(data);
        setCurrentPrice(data[data.length - 1].close || initialPrice);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [symbol, activeRange, initialPrice]);
  
  // Fetch live price updates at regular intervals, or simulate with time controller
  useEffect(() => {
    // Define the function to get the current price either from real API or simulation
    const fetchCurrentPrice = async () => {
      try {
        // If we're using the time controller to simulate data
        if (simulateRealTime && timeControllerDate) {
          // Find the closest data point to the current time controller date
          if (chartData.length > 0) {
            const controllerTime = timeControllerDate.getTime();
            
            // Find the closest data point to the current time
            let closestPoint = chartData[0];
            let minTimeDiff = Math.abs(new Date(chartData[0].time).getTime() - controllerTime);
            
            for (const point of chartData) {
              const timeDiff = Math.abs(new Date(point.time).getTime() - controllerTime);
              if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                closestPoint = point;
              }
            }
            
            // Use the close price from that data point
            setCurrentPrice(closestPoint.close || initialPrice);
            return;
          }
        }
        
        // If not in simulation mode or no time controller date, fetch real data
        const symbolType = symbol.includes('/') ? 'crypto' : 'stock';
        
        if (symbolType === 'crypto') {
          const cryptoSymbol = symbol.split('/')[0];
          const marketData = await getCryptoData(cryptoSymbol);
          
          if (marketData) {
            setCurrentPrice(marketData.price);
          }
        } else {
          const marketData = await getStockData(symbol);
          
          if (marketData) {
            setCurrentPrice(marketData.price);
          }
        }
      } catch (error) {
        console.error('Error fetching current price:', error);
      }
    };
    
    // Fetch immediately
    fetchCurrentPrice();
    
    // If using time controller, update on timeControllerDate change
    if (simulateRealTime && timeControllerDate) {
      fetchCurrentPrice();
      return;
    }
    
    // Otherwise set up interval to fetch real data every second
    const interval = setInterval(fetchCurrentPrice, 1000);
    return () => clearInterval(interval);
  }, [symbol, timeControllerDate, simulateRealTime, chartData.length]);

  // Calculate PnL for a position
  const calculatePnL = (position: Position) => {
    if (!currentPrice) return 0;
    
    if (position.status === 'closed' && position.exitPrice) {
      if (position.type === 'long') {
        return (position.exitPrice - position.entryPrice) * position.amount * position.leverage;
      } else {
        return (position.entryPrice - position.exitPrice) * position.amount * position.leverage;
      }
    } else {
      if (position.type === 'long') {
        return (currentPrice - position.entryPrice) * position.amount * position.leverage;
      } else {
        return (position.entryPrice - currentPrice) * position.amount * position.leverage;
      }
    }
  };
  
  // Calculate PnL percentage
  const calculatePnLPercentage = (position: Position) => {
    if (!currentPrice) return 0;
    
    const pnl = calculatePnL(position);
    return (pnl / (position.amount * position.leverage)) * 100;
  };
  
  // Render time frame selector buttons
  const renderTimeFrameSelector = () => (
    <div className="flex items-center space-x-1 mb-1">
      {['1m', '5m', '15m', '1h', '4h', '1D', '1W'].map(range => (
        <Button
          key={range}
          size="sm"
          variant={activeRange === range ? "default" : "outline"}
          onClick={() => setActiveRange(range)}
          className="text-xs px-2 py-1 h-7"
        >
          {range}
        </Button>
      ))}
    </div>
  );

  // Get Moving Average data
  const calculateMA = (data: ChartData[], period: number = 20) => {
    return data.map((entry, index, array) => {
      if (index < period - 1) {
        // Not enough data for MA yet
        return { ...entry, ma: null };
      }
      
      const sum = array
        .slice(index - period + 1, index + 1)
        .reduce((acc, val) => acc + (val.close || 0), 0);
        
      return { ...entry, ma: sum / period };
    });
  };

  // Get EMA data
  const calculateEMA = (data: ChartData[], period: number = 9) => {
    const k = 2 / (period + 1);
    let ema = data[0].close || 0;
    
    return data.map((entry) => {
      ema = (entry.close || 0) * k + ema * (1 - k);
      return { ...entry, ema };
    });
  };

  // Calculate indicators if needed
  const getEnhancedData = () => {
    let enhancedData = [...chartData];
    
    if (indicators.includes('ma')) {
      enhancedData = calculateMA(enhancedData);
    }
    
    if (indicators.includes('ema')) {
      enhancedData = calculateEMA(enhancedData);
    }
    
    return enhancedData;
  };

  return (
    <Card className={`${className} shadow-md h-full w-full`}>
      <CardHeader className="p-2 flex-row justify-between items-center space-y-0 border-b">
        <CardTitle className="text-base flex items-center">
          {t("Chart")}: {symbol} {currentPrice && `- ${formatPrice(currentPrice)}`}
          {timeControllerDate && simulateRealTime && (
            <Badge variant="outline" className="ml-2">
              {timeControllerDate.toLocaleString()}
            </Badge>
          )}
        </CardTitle>
        <div className="flex flex-row items-center gap-2">
          {enableDrawingTools && (
            <div className="flex items-center space-x-1">
              <Button
                variant={drawingState.tool === 'none' ? "default" : "outline"}
                size="sm"
                className="text-xs px-2 py-1 h-7"
                onClick={() => setDrawingState({...drawingState, tool: 'none', active: false})}
              >
                <Crosshair className="h-3 w-3 mr-1" />
                {t("Select")}
              </Button>
              <Button
                variant={drawingState.tool === 'line' ? "default" : "outline"}
                size="sm"
                className="text-xs px-2 py-1 h-7"
                onClick={() => setDrawingState({...drawingState, tool: 'line', active: true})}
              >
                <LineChart className="h-3 w-3 mr-1" />
                {t("Line")}
              </Button>
              <Button
                variant={drawingState.tool === 'rectangle' ? "default" : "outline"}
                size="sm"
                className="text-xs px-2 py-1 h-7"
                onClick={() => setDrawingState({...drawingState, tool: 'rectangle', active: true})}
              >
                <Square className="h-3 w-3 mr-1" />
                {t("Box")}
              </Button>
              <Button
                variant={drawingState.tool === 'fibonacci' ? "default" : "outline"}
                size="sm"
                className="text-xs px-2 py-1 h-7"
                onClick={() => setDrawingState({...drawingState, tool: 'fibonacci', active: true})}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                {t("Fib")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-7"
                onClick={() => setDrawingState({...drawingState, drawings: []})}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("Clear")}
              </Button>
            </div>
          )}
          {renderTimeFrameSelector()}
        </div>
      </CardHeader>
      <CardContent className="p-2 h-[calc(100%-3rem)]">
        <div className="h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {showArea ? (
                <AreaChart 
                  data={getEnhancedData()}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(tick) => {
                      if (activeRange === '1m' || activeRange === '5m' || activeRange === '15m' || activeRange === '1h') {
                        return new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      return new Date(tick).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(tick) => formatPrice(tick)}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#1c3d86" 
                    fill="url(#colorValue)" 
                    fillOpacity={0.3}
                  />
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1c3d86" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1c3d86" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  {positions.map(position => (
                    <ReferenceLine 
                      key={`entry-${position.id}`}
                      y={position.entryPrice} 
                      stroke={position.type === 'long' ? "#4caf50" : "#f44336"}
                      strokeWidth={2}
                      label={{
                        value: `${position.type === 'long' ? 'Long' : 'Short'} Entry: ${formatPrice(position.entryPrice)}`,
                        position: 'insideBottomRight',
                        fill: position.type === 'long' ? "#4caf50" : "#f44336",
                        fontSize: 12
                      }}
                    />
                  ))}
                </AreaChart>
              ) : (
                <ComposedChart
                  data={getEnhancedData()}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(tick) => {
                      if (activeRange === '1m' || activeRange === '5m' || activeRange === '15m' || activeRange === '1h') {
                        return new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      if (activeRange === '4h' || activeRange === '1D') {
                        return new Date(tick).toLocaleDateString([], { month: 'short', day: 'numeric' });
                      }
                      return new Date(tick).toLocaleDateString([], { month: 'short', year: '2-digit' });
                    }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(tick) => formatPrice(tick)}
                    width={60}
                  />
                  {showVolume && (
                    <YAxis 
                      yAxisId={1}
                      orientation="right"
                      tickFormatter={(tick) => formatLargeNumber(tick)}
                      width={50} 
                      domain={['auto', 'auto']}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Volume display */}
                  {showVolume && (
                    <RechartsBar
                      dataKey="volume"
                      yAxisId={1}
                      fill="rgba(34, 161, 226, 0.3)"
                      opacity={0.5}
                      name="Volume"
                      barSize={5}
                    />
                  )}
                  
                  {/* Custom Price Line */}
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#22a1e2" 
                    dot={false}
                    name="Price" 
                  />
                  
                  {/* Moving Average Indicator */}
                  {indicators.includes('ma') && (
                    <Line 
                      type="monotone" 
                      dataKey="ma" 
                      stroke="#2962FF" 
                      dot={false}
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      name="MA (20)"
                    />
                  )}
                  
                  {/* EMA Indicator */}
                  {indicators.includes('ema') && (
                    <Line 
                      type="monotone" 
                      dataKey="ema" 
                      stroke="#FF9800" 
                      dot={false}
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      name="EMA (9)"
                    />
                  )}
                  
                  {/* Position Entry Lines */}
                  {positions.map(position => (
                    <ReferenceLine 
                      key={`entry-${position.id}`}
                      y={position.entryPrice} 
                      stroke={position.type === 'long' ? "#4caf50" : "#f44336"}
                      strokeWidth={2}
                      label={{
                        value: `${position.type === 'long' ? 'Long' : 'Short'} Entry: ${formatPrice(position.entryPrice)}`,
                        position: 'insideBottomRight',
                        fill: position.type === 'long' ? "#4caf50" : "#f44336",
                        fontSize: 12
                      }}
                    />
                  ))}

                  {/* Position Stop Loss Lines */}
                  {positions.filter(p => p.stopLoss !== null).map(position => (
                    <ReferenceLine 
                      key={`sl-${position.id}`}
                      y={position.stopLoss as number} 
                      stroke="#f44336"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      label={{
                        value: `Stop Loss: ${formatPrice(position.stopLoss as number)}`,
                        position: 'insideTopRight',
                        fill: "#f44336",
                        fontSize: 12
                      }}
                    />
                  ))}

                  {/* Position Take Profit Lines */}
                  {positions.filter(p => p.takeProfit !== null).map(position => (
                    <ReferenceLine 
                      key={`tp-${position.id}`}
                      y={position.takeProfit as number} 
                      stroke="#4caf50"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      label={{
                        value: `Take Profit: ${formatPrice(position.takeProfit as number)}`,
                        position: 'insideTopRight',
                        fill: "#4caf50",
                        fontSize: 12
                      }}
                    />
                  ))}
                  
                  {/* Current price reference line */}
                  {currentPrice && (
                    <ReferenceLine 
                      y={currentPrice} 
                      stroke="rgba(255,255,255,0.3)" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: formatPrice(currentPrice),
                        position: 'right',
                        fill: 'rgba(255,255,255,0.7)',
                        fontSize: 10
                      }}
                    />
                  )}
                  
                  <Legend />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;