import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, BarChart, Bar as RechartsBar,
  Legend, ReferenceLine 
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

// Position interface for long/short positions on the chart
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

// Convert historical data to chart data format
const convertHistoricalToChartData = (
  historicalData: import('@/services/marketService').HistoricalDataPoint[]
): ChartData[] => {
  return historicalData.map(dataPoint => ({
    time: dataPoint.date,
    value: dataPoint.close,
    open: dataPoint.open,
    high: dataPoint.high,
    low: dataPoint.low,
    close: dataPoint.close,
    volume: dataPoint.volume
  }));
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

// Helper function to format large numbers (e.g., for volume)
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

interface TradingViewChartProps {
  symbol: string;
  initialPrice?: number;
  className?: string;
  initialPositions?: Position[];
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  symbol, 
  initialPrice = 40000,
  className,
  initialPositions = []
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
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [positionAmount, setPositionAmount] = useState('1000');
  const [positionLeverage, setPositionLeverage] = useState(1);
  const [positionStopLoss, setPositionStopLoss] = useState<string | null>(null);
  const [positionTakeProfit, setPositionTakeProfit] = useState<string | null>(null);
  
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
    // Determine the date range for the API request
    const endDate = new Date();
    const startDate = new Date();
    
    if (activeRange === '1D') startDate.setDate(endDate.getDate() - 1);
    else if (activeRange === '1W') startDate.setDate(endDate.getDate() - 7);
    else if (activeRange === '1M') startDate.setDate(endDate.getDate() - 30);
    else if (activeRange === '3M') startDate.setDate(endDate.getDate() - 90);
    else if (activeRange === '6M') startDate.setDate(endDate.getDate() - 180);
    else if (activeRange === '1Y') startDate.setDate(endDate.getDate() - 365);
    else startDate.setDate(endDate.getDate() - 730); // 2 years for 'ALL'
    
    // Determine if this is a crypto or stock symbol
    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('/');
    const stockSymbol = isCrypto ? symbol.split('/')[0] : symbol;
    
    // Set loading state
    setChartData([]);
    
    // Define an async function to fetch the data
    const fetchHistoricalData = async () => {
      try {
        let historicalData;
        
        if (isCrypto) {
          // For crypto, use the CoinAPI endpoints
          const startDateIso = startDate.toISOString();
          const endDateIso = endDate.toISOString();
          
          // Determine appropriate period based on date range
          let period = '1DAY';
          if (activeRange === '1D') period = '1HRS';
          else if (activeRange === '1W') period = '4HRS';
          
          // Import and use the historical crypto data function
          const { getHistoricalCryptoData } = await import('@/services/marketService');
          historicalData = await getHistoricalCryptoData(stockSymbol, startDateIso, endDateIso, period);
        } else {
          // For stocks, use Alpha Vantage endpoints
          let interval: 'daily' | 'weekly' | 'monthly' = 'daily';
          if (activeRange === '1Y' || activeRange === 'ALL') interval = 'weekly';
          
          // Import and use the historical stock data function
          const { getHistoricalStockData } = await import('@/services/marketService');
          historicalData = await getHistoricalStockData(stockSymbol, interval);
        }
        
        // Convert historical data to chart format
        const chartDataFormatted = convertHistoricalToChartData(historicalData);
        setChartData(chartDataFormatted);
        
        // Update price information if data is available
        if (chartDataFormatted.length > 0) {
          const lastPrice = chartDataFormatted[chartDataFormatted.length - 1].close;
          const firstPrice = chartDataFormatted[0].open;
          setCurrentPrice(lastPrice || null);
          
          if (lastPrice !== undefined && firstPrice !== undefined) {
            const change = lastPrice - firstPrice;
            setPriceChange(change);
            setPriceChangePercent((change / firstPrice) * 100);
          }
        } else {
          // If no data, set current price from props
          setCurrentPrice(initialPrice);
          setPriceChange(0);
          setPriceChangePercent(0);
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
        // In case of error, set current price from props
        setCurrentPrice(initialPrice);
        setPriceChange(0);
        setPriceChangePercent(0);
      }
    };
    
    // Call the async function
    fetchHistoricalData();
    
  }, [activeRange, symbol, initialPrice]);

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

  // Add a new position to the chart
  const addPosition = () => {
    if (!currentPrice) return;
    
    const newPosition: Position = {
      id: Math.random().toString(36).substring(2, 9),
      type: positionType,
      entryPrice: currentPrice,
      entryTime: chartData[chartData.length - 1]?.time || new Date().toISOString(),
      amount: parseFloat(positionAmount),
      leverage: positionLeverage,
      stopLoss: positionStopLoss ? parseFloat(positionStopLoss) : null,
      takeProfit: positionTakeProfit ? parseFloat(positionTakeProfit) : null,
      status: 'active'
    };
    
    setPositions([...positions, newPosition]);
    setShowPositionForm(false);
    
    // Reset form
    setPositionStopLoss(null);
    setPositionTakeProfit(null);
  };

  // Close a position
  const closePosition = (positionId: string) => {
    if (!currentPrice) return;
    
    setPositions(positions.map(position => {
      if (position.id === positionId) {
        const profitLoss = position.type === 'long'
          ? ((currentPrice - position.entryPrice) / position.entryPrice) * position.amount * position.leverage
          : ((position.entryPrice - currentPrice) / position.entryPrice) * position.amount * position.leverage;
        
        return {
          ...position,
          status: 'closed',
          exitPrice: currentPrice,
          exitTime: chartData[chartData.length - 1]?.time || new Date().toISOString(),
          profitLoss
        };
      }
      return position;
    }));
  };

  // Delete a position from the chart
  const deletePosition = (positionId: string) => {
    setPositions(positions.filter(position => position.id !== positionId));
  };

  // Format percentage with + or - sign
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Calculate current P&L for a position
  const calculatePnL = (position: Position) => {
    if (position.status === 'closed' || !currentPrice) {
      return position.profitLoss || 0;
    }
    
    return position.type === 'long'
      ? ((currentPrice - position.entryPrice) / position.entryPrice) * position.amount * position.leverage
      : ((position.entryPrice - currentPrice) / position.entryPrice) * position.amount * position.leverage;
  };

  // Calculate P&L percentage for a position
  const calculatePnLPercentage = (position: Position) => {
    if (position.status === 'closed' || !currentPrice) {
      return position.profitLoss 
        ? (position.profitLoss / position.amount) * 100 
        : 0;
    }
    
    return position.type === 'long'
      ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100 * position.leverage
      : ((position.entryPrice - currentPrice) / position.entryPrice) * 100 * position.leverage;
  };

  return (
    <Card className={cn("w-full h-full bg-card", className)} ref={chartRef}>
      <CardHeader className="px-4 py-3 flex flex-col space-y-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">{symbol}</CardTitle>
            <Badge variant={priceChange >= 0 ? "outline" : "destructive"} className={cn("ml-2", priceChange >= 0 ? "text-success" : "")}>
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
        {/* Position Entry Form */}
        {showPositionForm && (
          <div className="bg-card border border-border rounded-md p-4 mb-4 mx-4">
            <h3 className="text-lg font-medium mb-4">
              {t('Create New Position')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('Position Type')}</h4>
                <div className="flex space-x-2">
                  <Button
                    variant={positionType === 'long' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPositionType('long')}
                    className="w-full"
                  >
                    {t('Long')}
                  </Button>
                  <Button
                    variant={positionType === 'short' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPositionType('short')}
                    className="w-full"
                  >
                    {t('Short')}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('Leverage')}</h4>
                <div className="flex space-x-2">
                  <Button
                    variant={positionLeverage === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPositionLeverage(1)}
                  >
                    1x
                  </Button>
                  <Button
                    variant={positionLeverage === 2 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPositionLeverage(2)}
                  >
                    2x
                  </Button>
                  <Button
                    variant={positionLeverage === 5 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPositionLeverage(5)}
                  >
                    5x
                  </Button>
                  <Button
                    variant={positionLeverage === 10 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPositionLeverage(10)}
                  >
                    10x
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Amount')}</label>
                <input
                  type="text"
                  value={positionAmount}
                  onChange={(e) => setPositionAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Current Price')}</label>
                <input
                  type="text"
                  value={currentPrice ? formatPrice(currentPrice) : ''}
                  disabled
                  className="w-full px-3 py-2 bg-muted text-muted-foreground border border-input rounded text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Stop Loss')} ({t('Optional')})</label>
                <input
                  type="text"
                  value={positionStopLoss || ''}
                  onChange={(e) => setPositionStopLoss(e.target.value || null)}
                  placeholder={positionType === 'long' ? `-5% (${currentPrice ? formatPrice(currentPrice * 0.95) : ''})` : `+5% (${currentPrice ? formatPrice(currentPrice * 1.05) : ''})`}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Take Profit')} ({t('Optional')})</label>
                <input
                  type="text"
                  value={positionTakeProfit || ''}
                  onChange={(e) => setPositionTakeProfit(e.target.value || null)}
                  placeholder={positionType === 'long' ? `+10% (${currentPrice ? formatPrice(currentPrice * 1.1) : ''})` : `-10% (${currentPrice ? formatPrice(currentPrice * 0.9) : ''})`}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowPositionForm(false)}
              >
                {t('Cancel')}
              </Button>
              <Button
                variant="default"
                onClick={addPosition}
              >
                {t('Create Position')}
              </Button>
            </div>
          </div>
        )}
        
        {/* Positions List */}
        {positions.length > 0 && !showPositionForm && (
          <div className="bg-card border border-border rounded-md mb-4 mx-4">
            <h3 className="text-lg font-medium p-4 pb-2">{t('Positions')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start p-2 text-sm font-medium">{t('Type')}</th>
                    <th className="text-start p-2 text-sm font-medium">{t('Entry')}</th>
                    <th className="text-start p-2 text-sm font-medium">{t('Amount')}</th>
                    <th className="text-start p-2 text-sm font-medium">{t('Leverage')}</th>
                    <th className="text-start p-2 text-sm font-medium">{t('SL/TP')}</th>
                    <th className="text-start p-2 text-sm font-medium">{t('P&L')}</th>
                    <th className="text-start p-2 text-sm font-medium">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(position => {
                    const pnl = calculatePnL(position);
                    const pnlPercentage = calculatePnLPercentage(position);
                    
                    return (
                      <tr key={position.id} className="border-b border-border">
                        <td className="p-2 text-sm">
                          <Badge variant={position.type === 'long' ? "outline" : "destructive"}>
                            {position.type === 'long' ? t('LONG') : t('SHORT')}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">{formatPrice(position.entryPrice)}</td>
                        <td className="p-2 text-sm">{formatLargeNumber(position.amount)}</td>
                        <td className="p-2 text-sm">{position.leverage}x</td>
                        <td className="p-2 text-sm">
                          {position.stopLoss && (
                            <span className="text-destructive">SL: {formatPrice(position.stopLoss)}</span>
                          )}
                          {position.stopLoss && position.takeProfit && (
                            <span className="mx-1">/</span>
                          )}
                          {position.takeProfit && (
                            <span className="text-success">TP: {formatPrice(position.takeProfit)}</span>
                          )}
                          {!position.stopLoss && !position.takeProfit && "-"}
                        </td>
                        <td className={`p-2 text-sm ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatPrice(pnl)} ({formatPercentage(pnlPercentage)})
                        </td>
                        <td className="p-2 text-sm">
                          {position.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => closePosition(position.id)}
                            >
                              {t('Close')}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">{t('Closed')}</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePosition(position.id)}
                          >
                            X
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Add position button */}
        {!showPositionForm && (
          <div className="flex justify-end px-4 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPositionForm(true)}
            >
              + {t('Add Position')}
            </Button>
          </div>
        )}
        
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
                
                {/* Position entry, stop loss and take profit lines */}
                {positions.filter(p => p.status === 'active').map(position => (
                  <React.Fragment key={position.id}>
                    {/* Entry price line */}
                    <ReferenceLine 
                      y={position.entryPrice} 
                      stroke={position.type === 'long' ? "#4caf50" : "#f44336"} 
                      strokeWidth={1}
                      label={{ 
                        value: `Entry: ${formatPrice(position.entryPrice)}`,
                        position: 'insideTopRight',
                        fill: position.type === 'long' ? "#4caf50" : "#f44336",
                        fontSize: 10
                      }}
                    />
                    
                    {/* Stop loss line */}
                    {position.stopLoss && (
                      <ReferenceLine 
                        y={position.stopLoss} 
                        stroke="#f44336" 
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        label={{ 
                          value: `SL: ${formatPrice(position.stopLoss)}`,
                          position: 'insideTopRight',
                          fill: "#f44336",
                          fontSize: 10
                        }}
                      />
                    )}
                    
                    {/* Take profit line */}
                    {position.takeProfit && (
                      <ReferenceLine 
                        y={position.takeProfit} 
                        stroke="#4caf50" 
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        label={{ 
                          value: `TP: ${formatPrice(position.takeProfit)}`,
                          position: 'insideTopRight',
                          fill: "#4caf50",
                          fontSize: 10
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
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
                      {chartData.map((data, index) => {
                        // Skip if we don't have all the OHLC data
                        if (!data.open || !data.close || !data.high || !data.low) return null;
                        
                        // Determine color based on price movement
                        const priceColor = data.close >= data.open ? "#4caf50" : "#f44336";
                        
                        return (
                          <React.Fragment key={index}>
                            {/* Price bar (high to low) */}
                            <Line 
                              data={[
                                { x: index, value: data.high },
                                { x: index, value: data.low }
                              ]}
                              dataKey="value"
                              stroke={priceColor}
                              strokeWidth={1}
                              dot={false}
                              connectNulls
                              isAnimationActive={false}
                            />
                            
                            {/* OHLC body */}
                            <RechartsBar 
                              barSize={8}
                              data={[{
                                x: index,
                                value: Math.abs(data.close - data.open),
                                y: Math.min(data.open, data.close)
                              }]}
                              dataKey="value"
                              fill={priceColor}
                              isAnimationActive={false}
                            />
                          </React.Fragment>
                        );
                      })}
                      
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
                          stroke={position.type === 'long' ? "#f44336" : "#4caf50"}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          label={{
                            value: `Stop Loss: ${formatPrice(position.stopLoss as number)}`,
                            position: 'insideTopRight',
                            fill: position.type === 'long' ? "#f44336" : "#4caf50",
                            fontSize: 12
                          }}
                        />
                      ))}

                      {/* Position Take Profit Lines */}
                      {positions.filter(p => p.takeProfit !== null).map(position => (
                        <ReferenceLine 
                          key={`tp-${position.id}`}
                          y={position.takeProfit as number} 
                          stroke="#2196f3"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          label={{
                            value: `Take Profit: ${formatPrice(position.takeProfit as number)}`,
                            position: 'insideTopRight',
                            fill: "#2196f3",
                            fontSize: 12
                          }}
                        />
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
                      
                      {/* Current price reference line */}
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
                        <RechartsBar 
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

// Use custom components if needed for additional visualization purposes
// Note: We're now using the imported RechartsBar from recharts instead

export default TradingViewChart;