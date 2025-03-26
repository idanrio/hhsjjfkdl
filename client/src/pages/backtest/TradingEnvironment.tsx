import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from "wouter";
import { 
  ArrowRight, BarChart2, BookOpen, ChevronDown, ChevronLeft, Clock, 
  Compass, Crosshair, Maximize2, MessagesSquare, Save, SplitSquareVertical, 
  SquareStack, Star, TrendingUp, Users2, LineChart, PlusCircle, Search,
  Palette, CandlestickChart, CircleDollarSign, Gauge, BookMarked, Settings
} from 'lucide-react';

import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { 
  ResizableHandle, ResizablePanel, ResizablePanelGroup 
} from '@/components/ui/resizable';
import TradingViewChart from '@/components/TradingViewChart';
import { cn } from '@/lib/utils';

// API service for market data
import { getMultipleMarketData, getStockData, getCryptoData } from '@/services/marketService';

// Trading pairs available for analysis
const tradingPairs = [
  { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', initialPrice: 40000 },
  { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', initialPrice: 2200 },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', initialPrice: 170 },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock', initialPrice: 320 },
  { symbol: 'GOOG', name: 'Google', type: 'stock', initialPrice: 135 },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', initialPrice: 240 },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock', initialPrice: 130 },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock', initialPrice: 330 },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock', initialPrice: 420 },
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', initialPrice: 175 },
];

// List of technical indicators
const indicators = [
  { id: 'ma', name: 'Moving Average', category: 'trend', description: 'Simple Moving Average (SMA) is an arithmetic moving average calculated by adding recent prices and dividing by the number of time periods.' },
  { id: 'ema', name: 'Exponential Moving Average', category: 'trend', description: 'Exponential Moving Average (EMA) is a type of moving average that places a greater weight on recent data points.' },
  { id: 'macd', name: 'MACD', category: 'momentum', description: 'Moving Average Convergence Divergence (MACD) is a trend-following momentum indicator that shows the relationship between two moving averages of a security price.' },
  { id: 'rsi', name: 'Relative Strength Index', category: 'momentum', description: 'Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements.' },
  { id: 'bollinger', name: 'Bollinger Bands', category: 'volatility', description: 'Bollinger Bands are a type of statistical chart characterizing the prices and volatility over time of a financial instrument.' },
  { id: 'atr', name: 'Average True Range', category: 'volatility', description: 'Average True Range (ATR) is a technical analysis indicator that measures market volatility.' },
  { id: 'stochastic', name: 'Stochastic Oscillator', category: 'momentum', description: 'The Stochastic Oscillator is a momentum indicator comparing a particular closing price of a security to its price range over a specific period of time.' },
  { id: 'adx', name: 'Average Directional Index', category: 'trend', description: 'Average Directional Index (ADX) is used to determine the strength of a trend.' },
  { id: 'ichimoku', name: 'Ichimoku Cloud', category: 'trend', description: 'Ichimoku Cloud is a collection of technical indicators that show support and resistance levels, momentum and trend direction.' },
  { id: 'fibonacci', name: 'Fibonacci Retracement', category: 'pattern', description: 'Fibonacci retracement is a method of technical analysis that uses horizontal lines to indicate areas of support or resistance.' },
];

// Custom components for icons
const Minus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const LineVertical = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
  </svg>
);

const FibonacciIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 4h20"></path>
    <path d="M2 9h14"></path>
    <path d="M2 14h8"></path>
    <path d="M2 19h4"></path>
  </svg>
);

const Square = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="5" width="14" height="14" rx="0"></rect>
  </svg>
);

const Circle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9"></circle>
  </svg>
);

const Pitchfork = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3v18"></path>
    <path d="M6 9l12 12"></path>
    <path d="M18 9l-12 12"></path>
  </svg>
);

const Type = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4 7 4 4 20 4 20 7"></polyline>
    <line x1="9" y1="20" x2="15" y2="20"></line>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>
);

const Brush = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 3c.6 0 1 .4 1 1 0 3.1-3.8 6-7 6s-7-2.9-7-6c0-.6.4-1 1-1h12Z"></path>
    <path d="m5 10 2.5 10 2.5-10"></path>
    <path d="m14 10 2.5 10 2.5-10"></path>
    <path d="M10 10h4"></path>
  </svg>
);

// Drawing tools
const drawingTools = [
  { id: 'cursor', name: 'Cursor', icon: <Crosshair className="h-4 w-4" /> },
  { id: 'trendline', name: 'Trend Line', icon: <LineChart className="h-4 w-4" /> },
  { id: 'horizontalline', name: 'Horizontal Line', icon: <Minus className="h-4 w-4" /> },
  { id: 'verticalline', name: 'Vertical Line', icon: <LineVertical className="h-4 w-4" /> },
  { id: 'fibonacci', name: 'Fibonacci', icon: <FibonacciIcon className="h-4 w-4" /> },
  { id: 'rectangle', name: 'Rectangle', icon: <Square className="h-4 w-4" /> },
  { id: 'ellipse', name: 'Ellipse', icon: <Circle className="h-4 w-4" /> },
  { id: 'pitchfork', name: 'Pitchfork', icon: <Pitchfork className="h-4 w-4" /> },
  { id: 'text', name: 'Text', icon: <Type className="h-4 w-4" /> },
  { id: 'brush', name: 'Brush', icon: <Brush className="h-4 w-4" /> },
];

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  icon?: string;
}

// Trading environment main component
const TradingEnvironment: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [_, navigate] = useLocation();
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [activeTab, setActiveTab] = useState('chart');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDrawingTool, setActiveDrawingTool] = useState('cursor');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['ma', 'ema']);
  const [orderType, setOrderType] = useState('market');
  const [orderSide, setOrderSide] = useState('buy');
  const [orderAmount, setOrderAmount] = useState('1000');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderTakeProfit, setOrderTakeProfit] = useState('');
  const [orderStopLoss, setOrderStopLoss] = useState('');
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [showPositions, setShowPositions] = useState(true);
  const [showOrders, setShowOrders] = useState(true);
  const [marketExpanded, setMarketExpanded] = useState(false);

  // Fetch market data for current symbol
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['marketData', selectedPair.symbol],
    queryFn: async () => {
      if (selectedPair.type === 'crypto') {
        return await getCryptoData(selectedPair.symbol.split('/')[0]);
      } else {
        return await getStockData(selectedPair.symbol);
      }
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch multiple market data for watchlist
  const { data: marketsData, isLoading: isLoadingMarkets } = useQuery({
    queryKey: ['marketsData'],
    queryFn: async () => {
      return await getMultipleMarketData();
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Filter market pairs based on search term
  const filteredPairs = tradingPairs.filter(pair => 
    pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pair.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter indicators based on search term
  const filteredIndicators = indicators.filter(indicator => 
    indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicator.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle indicator in active indicators list
  const toggleIndicator = (id: string) => {
    if (activeIndicators.includes(id)) {
      setActiveIndicators(activeIndicators.filter(ind => ind !== id));
    } else {
      setActiveIndicators([...activeIndicators, id]);
    }
  };

  // Set current price as order price for limit orders
  useEffect(() => {
    if (marketData && orderType === 'limit' && !orderPrice) {
      setOrderPrice(marketData.price.toString());
    }
  }, [marketData, orderType, orderPrice]);

  // Handle order submission for backtesting
  const handleOrderSubmit = () => {
    // This would actually submit the backtest trade to the API
    const order = {
      symbol: selectedPair.symbol,
      type: orderType,
      side: orderSide,
      amount: parseFloat(orderAmount),
      price: orderType === 'market' ? marketData?.price : parseFloat(orderPrice),
      takeProfit: orderTakeProfit ? parseFloat(orderTakeProfit) : null,
      stopLoss: orderStopLoss ? parseFloat(orderStopLoss) : null,
      timeframe: selectedTimeframe,
      date: new Date().toISOString(),
    };
    
    console.log('Submitting backtest trade:', order);
    // Here you would call your API to create a trade
    
    // Reset form
    if (orderType === 'limit') {
      setOrderPrice('');
    }
    setOrderTakeProfit('');
    setOrderStopLoss('');
    
    // Show confirmation
    alert(t('Backtest trade placed successfully!'));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/backtest/dashboard')}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('Dashboard')}
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <div className="flex items-center">
            <CandlestickChart className="h-5 w-5 mr-1 text-primary" />
            <span className="font-bold text-lg">{t('Advanced Trading Platform')}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select 
            value={selectedTimeframe} 
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 {t('minute')}</SelectItem>
              <SelectItem value="5m">5 {t('minutes')}</SelectItem>
              <SelectItem value="15m">15 {t('minutes')}</SelectItem>
              <SelectItem value="30m">30 {t('minutes')}</SelectItem>
              <SelectItem value="1h">1 {t('hour')}</SelectItem>
              <SelectItem value="4h">4 {t('hours')}</SelectItem>
              <SelectItem value="1D">1 {t('day')}</SelectItem>
              <SelectItem value="1W">1 {t('week')}</SelectItem>
              <SelectItem value="1M">1 {t('month')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="sm" className="gap-1">
            <Save className="h-4 w-4" />
            {t('Save Layout')}
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-1">
            <Star className="h-4 w-4" />
            {t('Add to Favorites')}
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-1">
            <Maximize2 className="h-4 w-4" />
            {t('Fullscreen')}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left sidebar - Market list */}
          <ResizablePanel 
            defaultSize={18} 
            minSize={15} 
            maxSize={25} 
            className={cn("bg-card border-r", !marketExpanded && "hidden md:block")}
          >
            <div className="h-full flex flex-col">
              <div className="p-2 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{t('Markets')}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={() => setIsWatchlist(!isWatchlist)}
                  >
                    {isWatchlist ? 
                      <BookMarked className="h-4 w-4" /> : 
                      <Compass className="h-4 w-4" />
                    }
                  </Button>
                </div>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-[50%] transform -translate-y-[50%] text-muted-foreground" />
                  <Input 
                    placeholder={t('Search markets...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
              
              <Tabs defaultValue="all" className="flex-1 overflow-hidden">
                <TabsList className="w-full justify-start px-2 pt-2 bg-transparent">
                  <TabsTrigger value="all" className="text-xs">{t('All')}</TabsTrigger>
                  <TabsTrigger value="crypto" className="text-xs">{t('Crypto')}</TabsTrigger>
                  <TabsTrigger value="stock" className="text-xs">{t('Stocks')}</TabsTrigger>
                  <TabsTrigger value="forex" className="text-xs">{t('Forex')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="flex-1 overflow-y-auto m-0 px-1 py-2">
                  <div className="space-y-1">
                    {filteredPairs.map((pair) => (
                      <Button
                        key={pair.symbol}
                        variant={selectedPair.symbol === pair.symbol ? "secondary" : "ghost"}
                        className="w-full justify-between h-11 px-2"
                        onClick={() => setSelectedPair(pair)}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            {pair.type === 'crypto' ? 
                              <CircleDollarSign className="h-3.5 w-3.5" /> : 
                              <TrendingUp className="h-3.5 w-3.5" />
                            }
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">{pair.symbol}</div>
                            <div className="text-xs text-muted-foreground">{pair.name}</div>
                          </div>
                        </div>
                        
                        {marketsData?.find(m => m.symbol === pair.symbol) && (
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              {marketsData.find(m => m.symbol === pair.symbol)?.price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                            <div className={cn(
                              "text-xs",
                              marketsData.find(m => m.symbol === pair.symbol)?.changePercent as number >= 0 ? 
                                "text-success" : "text-destructive"
                            )}>
                              {marketsData.find(m => m.symbol === pair.symbol)?.changePercent as number >= 0 ? "+" : ""}
                              {(marketsData.find(m => m.symbol === pair.symbol)?.changePercent as number).toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="crypto" className="flex-1 overflow-y-auto m-0 px-1 py-2">
                  <div className="space-y-1">
                    {filteredPairs.filter(pair => pair.type === 'crypto').map((pair) => (
                      <Button
                        key={pair.symbol}
                        variant={selectedPair.symbol === pair.symbol ? "secondary" : "ghost"}
                        className="w-full justify-between h-11 px-2"
                        onClick={() => setSelectedPair(pair)}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            <CircleDollarSign className="h-3.5 w-3.5" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">{pair.symbol}</div>
                            <div className="text-xs text-muted-foreground">{pair.name}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="stock" className="flex-1 overflow-y-auto m-0 px-1 py-2">
                  <div className="space-y-1">
                    {filteredPairs.filter(pair => pair.type === 'stock').map((pair) => (
                      <Button
                        key={pair.symbol}
                        variant={selectedPair.symbol === pair.symbol ? "secondary" : "ghost"}
                        className="w-full justify-between h-11 px-2"
                        onClick={() => setSelectedPair(pair)}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            <TrendingUp className="h-3.5 w-3.5" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">{pair.symbol}</div>
                            <div className="text-xs text-muted-foreground">{pair.name}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="forex" className="flex-1 overflow-y-auto m-0 p-2">
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Compass className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{t('Forex pairs coming soon')}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main chart area */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col">
              {/* Chart header */}
              <div className="p-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mr-2 md:hidden"
                      onClick={() => setMarketExpanded(!marketExpanded)}
                    >
                      <SquareStack className="h-4 w-4" />
                    </Button>
                    
                    <h2 className="font-bold">{selectedPair.symbol}</h2>
                    
                    {marketData && (
                      <div className="ml-4 flex items-center">
                        <span className="text-lg font-bold">
                          {marketData.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        <Badge 
                          variant={marketData.changePercent >= 0 ? "outline" : "destructive"}
                          className={cn("ml-2", marketData.changePercent >= 0 ? "text-success" : "")}
                        >
                          {marketData.changePercent >= 0 ? "+" : ""}
                          {marketData.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Drawing tools */}
                    <div className="border rounded-md flex">
                      {drawingTools.slice(0, 4).map(tool => (
                        <Button
                          key={tool.id}
                          variant={activeDrawingTool === tool.id ? "secondary" : "ghost"}
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setActiveDrawingTool(tool.id)}
                          title={tool.name}
                        >
                          {tool.icon}
                        </Button>
                      ))}
                      <Select>
                        <SelectTrigger className="h-8 border-0 w-9">
                          <ChevronDown className="h-4 w-4" />
                        </SelectTrigger>
                        <SelectContent>
                          {drawingTools.slice(4).map(tool => (
                            <SelectItem 
                              key={tool.id} 
                              value={tool.id}
                              onClick={() => setActiveDrawingTool(tool.id)}
                            >
                              <div className="flex items-center">
                                {tool.icon}
                                <span className="ml-2">{tool.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Indicators dropdown */}
                    <Select>
                      <SelectTrigger className="h-8 w-auto">
                        <div className="flex items-center gap-1">
                          <BarChart2 className="h-4 w-4" />
                          <span>{t('Indicators')}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="w-60">
                        <div className="mb-2">
                          <Input 
                            placeholder={t("Search indicators...")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredIndicators.map(indicator => (
                            <div 
                              key={indicator.id}
                              className="flex items-center justify-between py-1.5 px-2 hover:bg-accent rounded"
                              onClick={() => toggleIndicator(indicator.id)}
                            >
                              <div>
                                <div className="text-sm font-medium">{indicator.name}</div>
                                <div className="text-xs text-muted-foreground">{indicator.category}</div>
                              </div>
                              <div>
                                <Switch 
                                  checked={activeIndicators.includes(indicator.id)}
                                  onCheckedChange={() => toggleIndicator(indicator.id)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    
                    {/* Chart type */}
                    <Select defaultValue="candle">
                      <SelectTrigger className="h-8 w-auto">
                        <div className="flex items-center gap-1">
                          <CandlestickChart className="h-4 w-4" />
                          <span>{t('Candlestick')}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candle">
                          <div className="flex items-center">
                            <CandlestickChart className="h-4 w-4 mr-2" />
                            {t('Candlestick')}
                          </div>
                        </SelectItem>
                        <SelectItem value="line">
                          <div className="flex items-center">
                            <LineChart className="h-4 w-4 mr-2" />
                            {t('Line')}
                          </div>
                        </SelectItem>
                        <SelectItem value="area">
                          <div className="flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2" />
                            {t('Area')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Timeframe - mobile only */}
                    <div className="sm:hidden">
                      <Select 
                        value={selectedTimeframe} 
                        onValueChange={setSelectedTimeframe}
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue placeholder="Timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1m">1m</SelectItem>
                          <SelectItem value="5m">5m</SelectItem>
                          <SelectItem value="15m">15m</SelectItem>
                          <SelectItem value="30m">30m</SelectItem>
                          <SelectItem value="1h">1h</SelectItem>
                          <SelectItem value="4h">4h</SelectItem>
                          <SelectItem value="1D">1D</SelectItem>
                          <SelectItem value="1W">1W</SelectItem>
                          <SelectItem value="1M">1M</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Settings */}
                    <Button variant="ghost" size="sm" className="h-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Chart component */}
              <div className="flex-grow overflow-hidden">
                <TradingViewChart 
                  symbol={selectedPair.symbol}
                  initialPrice={selectedPair.initialPrice}
                  className="h-full"
                />
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right sidebar - Trading panel */}
          <ResizablePanel defaultSize={22} minSize={18} maxSize={30} className="bg-card border-l">
            <div className="h-full flex flex-col">
              <Tabs defaultValue="trade" className="h-full flex flex-col">
                <TabsList className="w-full justify-start px-2 pt-2 bg-transparent">
                  <TabsTrigger value="trade" className="text-xs">{t('Trade')}</TabsTrigger>
                  <TabsTrigger value="info" className="text-xs">{t('Info')}</TabsTrigger>
                  <TabsTrigger value="positions" className="text-xs">{t('Positions')}</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">{t('History')}</TabsTrigger>
                </TabsList>
                
                {/* Trading Form */}
                <TabsContent value="trade" className="flex-1 overflow-y-auto m-0 p-3">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Button 
                        variant={orderSide === 'buy' ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          orderSide === 'buy' && "bg-success hover:bg-success/90 text-success-foreground"
                        )}
                        onClick={() => setOrderSide('buy')}
                      >
                        {t('Buy')}
                      </Button>
                      <Button 
                        variant={orderSide === 'sell' ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          orderSide === 'sell' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        )}
                        onClick={() => setOrderSide('sell')}
                      >
                        {t('Sell')}
                      </Button>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label>{t('Order Type')}</Label>
                      </div>
                      <Select value={orderType} onValueChange={setOrderType}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select order type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market">{t('Market')}</SelectItem>
                          <SelectItem value="limit">{t('Limit')}</SelectItem>
                          <SelectItem value="stop">{t('Stop')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label>{t('Amount')}</Label>
                        <div className="flex items-center space-x-1 text-xs">
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-1.5" onClick={() => setOrderAmount('250')}>25%</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-1.5" onClick={() => setOrderAmount('500')}>50%</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-1.5" onClick={() => setOrderAmount('750')}>75%</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-1.5" onClick={() => setOrderAmount('1000')}>100%</Button>
                        </div>
                      </div>
                      <Input 
                        value={orderAmount}
                        onChange={(e) => setOrderAmount(e.target.value)}
                        type="number"
                        min="0"
                      />
                    </div>
                    
                    {orderType !== 'market' && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label>{t('Price')}</Label>
                          {marketData && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 text-xs px-1.5"
                              onClick={() => setOrderPrice(marketData.price.toString())}
                            >
                              {t('Current')}
                            </Button>
                          )}
                        </div>
                        <Input 
                          value={orderPrice}
                          onChange={(e) => setOrderPrice(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label>{t('Take Profit')}</Label>
                        </div>
                        <Input 
                          value={orderTakeProfit}
                          onChange={(e) => setOrderTakeProfit(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={t('Optional')}
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label>{t('Stop Loss')}</Label>
                        </div>
                        <Input 
                          value={orderStopLoss}
                          onChange={(e) => setOrderStopLoss(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={t('Optional')}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        className={cn(
                          "w-full", 
                          orderSide === 'buy' ? 
                            "bg-success hover:bg-success/90 text-success-foreground" : 
                            "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        )}
                        onClick={handleOrderSubmit}
                      >
                        {orderSide === 'buy' ? t('Buy') : t('Sell')} {selectedPair.symbol}
                      </Button>
                    </div>
                    
                    <div className="mt-6">
                      <div className="text-sm font-medium mb-2">{t('Order Summary')}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('Asset')}:</span>
                          <span>{selectedPair.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('Order Type')}:</span>
                          <span className="capitalize">{orderType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('Side')}:</span>
                          <span className="capitalize">{orderSide}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('Amount')}:</span>
                          <span>${orderAmount}</span>
                        </div>
                        {orderType !== 'market' && orderPrice && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('Price')}:</span>
                            <span>${orderPrice}</span>
                          </div>
                        )}
                        {orderTakeProfit && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('Take Profit')}:</span>
                            <span>${orderTakeProfit}</span>
                          </div>
                        )}
                        {orderStopLoss && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('Stop Loss')}:</span>
                            <span>${orderStopLoss}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Symbol Information */}
                <TabsContent value="info" className="flex-1 overflow-y-auto m-0 p-3">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold">{selectedPair.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPair.type === 'crypto' ? t('Cryptocurrency') : t('Stock')}
                      </p>
                    </div>
                    
                    {marketData && (
                      <div className="grid grid-cols-2 gap-2">
                        <Card className="p-2">
                          <div className="text-xs text-muted-foreground">{t('Price')}</div>
                          <div className="text-lg font-bold">${marketData.price.toLocaleString()}</div>
                        </Card>
                        <Card className="p-2">
                          <div className="text-xs text-muted-foreground">{t('24h Change')}</div>
                          <div className={cn(
                            "text-lg font-bold",
                            marketData.changePercent >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {marketData.changePercent >= 0 ? "+" : ""}
                            {marketData.changePercent.toFixed(2)}%
                          </div>
                        </Card>
                        <Card className="p-2">
                          <div className="text-xs text-muted-foreground">{t('24h High')}</div>
                          <div className="text-lg font-bold">${marketData.high.toLocaleString()}</div>
                        </Card>
                        <Card className="p-2">
                          <div className="text-xs text-muted-foreground">{t('Market Cap')}</div>
                          <div className="text-lg font-bold">
                            {selectedPair.type === 'crypto' ? 
                              "$" + (marketData.price * 21000000).toLocaleString() : 
                              "$" + (marketData.price * 16730000000).toLocaleString()}
                          </div>
                        </Card>
                      </div>
                    )}
                    
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="description">
                        <AccordionTrigger className="text-sm">{t('Description')}</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground">
                            {selectedPair.type === 'crypto' ? 
                              t('Digital currency operating on a decentralized network.') : 
                              t('Publicly traded company on major stock exchanges.')}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="specs">
                        <AccordionTrigger className="text-sm">{t('Market Specifications')}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('Trading Hours')}:</span>
                              <span>
                                {selectedPair.type === 'crypto' ? 
                                  t('24/7') : 
                                  t('9:30 AM - 4:00 PM ET')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('Min. Order')}:</span>
                              <span>$1.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('Leverage')}:</span>
                              <span>
                                {selectedPair.type === 'crypto' ? 
                                  '1:5' : 
                                  '1:4'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('Fee')}:</span>
                              <span>0.1%</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="risk">
                        <AccordionTrigger className="text-sm">{t('Risk Disclosure')}</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground">
                            {t('Trading contains substantial risk and is not for every investor. An investor could potentially lose all or more than their initial investment.')}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </TabsContent>
                
                {/* Open Positions */}
                <TabsContent value="positions" className="flex-1 overflow-y-auto m-0 p-3">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{t('Open Positions')}</h3>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <Switch
                            checked={showPositions}
                            onCheckedChange={setShowPositions}
                            id="show-positions"
                          />
                          <Label htmlFor="show-positions" className="ml-2 text-xs">
                            {t('Show Positions')}
                          </Label>
                        </div>
                        <div className="flex items-center">
                          <Switch
                            checked={showOrders}
                            onCheckedChange={setShowOrders}
                            id="show-orders"
                          />
                          <Label htmlFor="show-orders" className="ml-2 text-xs">
                            {t('Show Orders')}
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    {showPositions && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">{t('Positions')}</h4>
                        <div className="flex flex-col items-center justify-center h-24 border rounded-md">
                          <p className="text-muted-foreground text-sm">{t('No open positions')}</p>
                          <Button variant="link" size="sm" className="text-xs">
                            {t('Place a trade to see positions here')}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {showOrders && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">{t('Orders')}</h4>
                        <div className="flex flex-col items-center justify-center h-24 border rounded-md">
                          <p className="text-muted-foreground text-sm">{t('No open orders')}</p>
                          <Button variant="link" size="sm" className="text-xs">
                            {t('Place a limit or stop order to see it here')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Trade History */}
                <TabsContent value="history" className="flex-1 overflow-y-auto m-0 p-3">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{t('Trade History')}</h3>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue placeholder={t('Filter')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('All Trades')}</SelectItem>
                          <SelectItem value="buy">{t('Buy Only')}</SelectItem>
                          <SelectItem value="sell">{t('Sell Only')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center h-40 border rounded-md">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t('No trade history')}</p>
                      <Button variant="link" size="sm" className="text-xs">
                        {t('Your completed trades will appear here')}
                      </Button>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" className="text-xs">
                        {t('Export Trade History')}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Bottom panel - Optional for discussion, alerts etc. */}
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={85} minSize={70}>
          <div className="h-full"></div> {/* This is a placeholder; content is already defined above */}
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={15} minSize={10} maxSize={30} className="border-t">
          <Tabs defaultValue="discussion" className="h-full">
            <TabsList className="w-full justify-start px-2 pt-2 bg-transparent">
              <TabsTrigger value="discussion" className="text-xs">
                <MessagesSquare className="h-4 w-4 mr-1" />
                {t('Discussion')}
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">
                <BookOpen className="h-4 w-4 mr-1" />
                {t('Notes')}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">
                <Bell className="h-4 w-4 mr-1" />
                {t('Alerts')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="discussion" className="p-2 h-full overflow-y-auto">
              <div className="flex flex-col items-center justify-center h-full">
                <Users2 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">{t('Discussion forum coming soon')}</p>
                <p className="text-xs text-muted-foreground">{t('Share ideas and strategies with other traders')}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="p-2 h-full overflow-y-auto">
              <textarea 
                className="w-full h-full p-2 border rounded-md resize-none bg-background" 
                placeholder={t('Add your trading notes here...')}
              ></textarea>
            </TabsContent>
            
            <TabsContent value="alerts" className="p-2 h-full overflow-y-auto">
              <div className="flex flex-col items-center justify-center h-full">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">{t('No active alerts')}</p>
                <Button size="sm" className="mt-2">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  {t('Create Alert')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

// Bell icon for alerts tab
const Bell = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
  </svg>
);

export default TradingEnvironment;