import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend, Line, Area,
  Bar as RechartsBar, BarChart, ComposedChart
} from 'recharts';
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
const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  symbol, 
  initialPrice = 100,
  className = '', 
  initialPositions = []
}) => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArea, setShowArea] = useState(false);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [activeRange, setActiveRange] = useState('1D');
  const [indicators, setIndicators] = useState<string[]>(['ma']);
  const [showVolume, setShowVolume] = useState(true);
  
  // Update positions when initialPositions prop changes
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);
  
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
  
  // Fetch live price updates at regular intervals
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      try {
        // Determine if it's a crypto or stock symbol
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
    
    // Then set up interval to fetch every second
    const interval = setInterval(fetchCurrentPrice, 1000);
    
    return () => clearInterval(interval);
  }, [symbol]);

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
        </CardTitle>
        {renderTimeFrameSelector()}
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