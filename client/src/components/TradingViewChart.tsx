import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend, Line, Area,
  Bar as RechartsBar, BarChart
} from 'recharts';

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
  
  // Load chart data on mount and when symbol changes
  useEffect(() => {
    setLoading(true);
    
    // In a real implementation, we would fetch historical data here
    // For demo purposes, we'll generate sample data
    const data = generateHistoricalData(initialPrice);
    setChartData(data);
    setCurrentPrice(data[data.length - 1].close || initialPrice);
    
    setLoading(false);
  }, [symbol, initialPrice]);
  
  // This would typically come from live data in a real implementation
  useEffect(() => {
    // Update current price with small random movements
    const interval = setInterval(() => {
      if (currentPrice) {
        const changePercent = (Math.random() - 0.5) * 0.002; // Small movements
        const newPrice = currentPrice * (1 + changePercent);
        setCurrentPrice(newPrice);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [currentPrice]);

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
  
  // Render time range selector buttons
  const renderTimeRangeSelector = () => (
    <div className="flex items-center space-x-1 mb-1">
      {['1D', '1W', '1M', '3M', '1Y', 'All'].map(range => (
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

  return (
    <Card className={`${className} shadow-md h-full w-full`}>
      <CardHeader className="p-2 flex-row justify-between items-center space-y-0 border-b">
        <CardTitle className="text-base flex items-center">
          {t("Chart")}: {symbol} {currentPrice && `- ${formatPrice(currentPrice)}`}
        </CardTitle>
        {renderTimeRangeSelector()}
      </CardHeader>
      <CardContent className="p-2 h-[calc(100%-3rem)]">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            {showArea ? (
              <AreaChart 
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(tick) => {
                    if (activeRange === '1D') {
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
              // Improved candlestick chart rendering
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(tick) => {
                    if (activeRange === '1D') {
                      return new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    if (activeRange === '1W' || activeRange === '1M') {
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
                <Tooltip content={<CustomTooltip />} />
                
                {/* Custom candlestick rendering */}
                {chartData.map((data, index) => {
                  if (!data.open || !data.close || !data.high || !data.low) return null;
                  
                  // Determine color based on price movement
                  const priceColor = data.close >= data.open ? "#4caf50" : "#f44336";
                  
                  return (
                    <React.Fragment key={index}>
                      {/* Price bar (high to low) */}
                      <Line 
                        data={[
                          { x: index, y: data.high, time: data.time },
                          { x: index, y: data.low, time: data.time }
                        ]}
                        dataKey="y"
                        stroke={priceColor}
                        strokeWidth={1}
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                      />
                    </React.Fragment>
                  );
                })}
                
                {/* Main price line */}
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#22a1e2" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                
                {/* Render indicators */}
                {indicators.includes('ma') && (
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#2962FF" 
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    name="MA"
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
                <ReferenceLine 
                  y={currentPrice || 0} 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: formatPrice(currentPrice || 0),
                    position: 'right',
                    fill: 'rgba(255,255,255,0.7)',
                    fontSize: 10
                  }}
                />
                
                <Legend />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;