import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, Legend, ReferenceLine 
} from 'recharts';
import { 
  ChevronDown, Maximize2, Minimize2, Settings, HelpCircle, 
  BarChart2, Layers, LineChart as LineChartIcon, PieChart,
  Eye, EyeOff, Crosshair, Sliders, Share, Download, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Define interface for the chart data
interface ChartData {
  time: string | number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

// Mock data generator for demonstration
const generateMockOHLCData = (days: number = 30, startPrice: number = 40000): ChartData[] => {
  const data: ChartData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < days; i++) {
    const volatility = Math.random() * 0.05; // 5% max daily volatility
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const open = currentPrice;
    const close = currentPrice * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 10000 + 5000);
    
    data.push({
      time: date.toISOString().split('T')[0],
      value: close,
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

// This would be fetched from an API in a real application
const mockIndicators = [
  { id: 'ma', name: 'Moving Average', color: '#2962FF' },
  { id: 'ema', name: 'Exponential Moving Average', color: '#FF6D00' },
  { id: 'bollinger', name: 'Bollinger Bands', color: '#7B1FA2' },
  { id: 'rsi', name: 'Relative Strength Index', color: '#1E88E5' },
  { id: 'macd', name: 'MACD', color: '#43A047' },
];

// Time periods for chart viewing
const timeRanges = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

interface TradingViewChartProps {
  symbol: string;
  initialPrice?: number;
  className?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  symbol, 
  initialPrice = 40000,
  className
}) => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeRange, setActiveRange] = useState('1M');
  const [indicators, setIndicators] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('candle');
  const [fullscreen, setFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  
  // Format larger numbers with k, m, b suffixes
  const formatLargeNumber = (num: number): string => {
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

  // Toggle indicator
  const toggleIndicator = (id: string) => {
    if (indicators.includes(id)) {
      setIndicators(indicators.filter(ind => ind !== id));
    } else {
      setIndicators([...indicators, id]);
    }
  };

  // Generate or fetch chart data based on active range
  useEffect(() => {
    // In a real app, this would fetch data from an API
    const rangeDays = activeRange === '1D' ? 1 : 
                      activeRange === '1W' ? 7 : 
                      activeRange === '1M' ? 30 : 
                      activeRange === '3M' ? 90 : 
                      activeRange === '6M' ? 180 : 
                      activeRange === '1Y' ? 365 : 730;
    
    const data = generateMockOHLCData(rangeDays, initialPrice);
    setChartData(data);
    
    if (data.length > 0) {
      const lastPrice = data[data.length - 1].close || data[data.length - 1].value;
      const firstPrice = data[0].open || data[0].value;
      setCurrentPrice(lastPrice);
      
      const change = lastPrice - firstPrice;
      setPriceChange(change);
      setPriceChangePercent((change / firstPrice) * 100);
    }
  }, [activeRange, initialPrice]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (fullscreen) {
      document.exitFullscreen();
    } else if (chartRef.current) {
      chartRef.current.requestFullscreen();
    }
    setFullscreen(!fullscreen);
  };

  // Format price with the appropriate decimal places
  const formatPrice = (price: number) => {
    // If the price is a crypto price (usually BTC, ETH) 
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    }
    // For stocks or indices
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 shadow-lg border rounded-lg">
          <p className="font-medium">{label}</p>
          {data.open && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              <div className="text-muted-foreground">Open:</div>
              <div className="font-medium">{formatPrice(data.open)}</div>
              <div className="text-muted-foreground">High:</div>
              <div className="font-medium">{formatPrice(data.high || 0)}</div>
              <div className="text-muted-foreground">Low:</div>
              <div className="font-medium">{formatPrice(data.low || 0)}</div>
              <div className="text-muted-foreground">Close:</div>
              <div className="font-medium">{formatPrice(data.close || 0)}</div>
              {data.volume && (
                <>
                  <div className="text-muted-foreground">Volume:</div>
                  <div className="font-medium">{formatLargeNumber(data.volume)}</div>
                </>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("w-full h-full bg-card", className)} ref={chartRef}>
      <CardHeader className="px-4 py-3 flex flex-col space-y-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">{symbol}</CardTitle>
            <Badge variant={priceChange >= 0 ? "success" : "destructive"} className="ml-2">
              {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)} 
              ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </Badge>
            <span className="text-xl font-bold ml-2">
              {currentPrice ? formatPrice(currentPrice) : 'Loading...'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex">
              {timeRanges.map(range => (
                <Button 
                  key={range}
                  variant={activeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveRange(range)}
                  className="px-2 h-8"
                >
                  {range}
                </Button>
              ))}
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <h3 className="font-medium mb-2">{t('Chart Settings')}</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t('Show Volume')}</span>
                    <Toggle 
                      pressed={showVolume} 
                      onPressedChange={setShowVolume}
                      aria-label="Toggle volume display"
                    >
                      {showVolume ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Toggle>
                  </div>
                  <Separator className="my-1" />
                  <h4 className="text-sm font-medium">{t('Chart Type')}</h4>
                  <div className="flex gap-1">
                    <Button 
                      variant={chartType === 'candle' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType('candle')}
                      className="flex-1"
                    >
                      <BarChart2 className="h-4 w-4 mr-1" />
                      {t('Candle')}
                    </Button>
                    <Button 
                      variant={chartType === 'line' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType('line')}
                      className="flex-1"
                    >
                      <LineChartIcon className="h-4 w-4 mr-1" />
                      {t('Line')}
                    </Button>
                    <Button 
                      variant={chartType === 'area' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType('area')}
                      className="flex-1"
                    >
                      <Layers className="h-4 w-4 mr-1" />
                      {t('Area')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Sliders className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <h3 className="font-medium mb-2">{t('Indicators')}</h3>
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {mockIndicators.map(indicator => (
                    <div key={indicator.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: indicator.color }}
                        ></div>
                        <span className="text-sm">{indicator.name}</span>
                      </div>
                      <Toggle 
                        pressed={indicators.includes(indicator.id)} 
                        onPressedChange={() => toggleIndicator(indicator.id)}
                        aria-label={`Toggle ${indicator.name}`}
                      />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={toggleFullscreen}
              >
                {fullscreen ? 
                  <Minimize2 className="h-4 w-4" /> : 
                  <Maximize2 className="h-4 w-4" />
                }
              </Button>
              
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex mt-2 items-center gap-2">
          <div className="flex">
            <Button 
              variant={!activeDrawingTool ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveDrawingTool(null)}
              className="h-8"
            >
              <Crosshair className="h-4 w-4 mr-1" />
              {t('Cursor')}
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button 
              variant={activeDrawingTool === 'trendline' ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveDrawingTool('trendline')}
              className="h-8"
            >
              {t('Trend Line')}
            </Button>
            
            <Button 
              variant={activeDrawingTool === 'rectangle' ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveDrawingTool('rectangle')}
              className="h-8"
            >
              {t('Rectangle')}
            </Button>
            
            <Button 
              variant={activeDrawingTool === 'fibonacci' ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveDrawingTool('fibonacci')}
              className="h-8"
            >
              {t('Fibonacci')}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 pt-0">
        <div className={`w-full ${fullscreen ? 'h-screen' : 'h-[500px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(tick) => {
                    // Format based on time range
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
                    // This would be a calculated MA in a real app
                    strokeDasharray="3 3"
                    name="MA"
                  />
                )}
                
                {indicators.includes('ema') && (
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#FF6D00" 
                    dot={false}
                    strokeWidth={1.5}
                    // This would be a calculated EMA in a real app
                    strokeDasharray="5 2"
                    name="EMA"
                  />
                )}
                
                <Legend />
                <ReferenceLine 
                  y={currentPrice || 0} 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeDasharray="3 3" 
                />
              </LineChart>
            ) : chartType === 'area' ? (
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
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#22a1e2" 
                  fill="url(#colorGradient)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22a1e2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22a1e2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
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
                
                <Legend />
                <ReferenceLine 
                  y={currentPrice || 0} 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeDasharray="3 3" 
                />
              </AreaChart>
            ) : (
              // Candlestick chart visualization using recharts
              <div className="w-full h-full flex flex-col">
                <div className="flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
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
                      {chartData.map((data, index) => (
                        <React.Fragment key={index}>
                          {/* Price bar (high to low) */}
                          <Line 
                            data={[{time: data.time, value: data.high}, {time: data.time, value: data.low}]}
                            dataKey="value"
                            stroke={data.close >= data.open ? "#4caf50" : "#f44336"}
                            strokeWidth={1}
                            dot={false}
                            connectNulls
                            isAnimationActive={false}
                          />
                          
                          {/* OHLC body */}
                          <Bar 
                            data={[{
                              time: data.time, 
                              value: Math.abs(data.close - data.open),
                              y: Math.min(data.open, data.close)
                            }]}
                            dataKey="value"
                            fill={data.close >= data.open ? "#4caf50" : "#f44336"}
                            isAnimationActive={false}
                          />
                        </React.Fragment>
                      ))}
                      
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
                      
                      <Legend />
                      <ReferenceLine 
                        y={currentPrice || 0} 
                        stroke="rgba(255,255,255,0.3)" 
                        strokeDasharray="3 3" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Volume chart */}
                {showVolume && (
                  <div style={{ height: '100px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(tick) => {
                            if (activeRange === '1D') {
                              return new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            }
                            return new Date(tick).toLocaleDateString([], { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(tick) => formatLargeNumber(tick)}
                          width={60}
                        />
                        <Tooltip 
                          formatter={(value: any) => [formatLargeNumber(value), 'Volume']}
                          labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                        />
                        <Bar 
                          dataKey="volume" 
                          fill="#7e57c2"
                          fillOpacity={0.7}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// These components don't actually exist in recharts and are just for visualization purposes in the candlestick view
const Bar = (props: any) => null;

export default TradingViewChart;