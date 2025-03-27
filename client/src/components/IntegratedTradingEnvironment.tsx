import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, SplitSquareVertical, CandlestickChart, LineChart, BarChart2,
  Maximize2, Crosshair, ArrowLeft, TrendingUp, Compass, BookMarked,
  ChevronLeft, ChevronDown, Settings, Play, Pause, Clock, PlusCircle,
  RotateCcw, PencilRuler, CircleDollarSign, Info, LayoutDashboard
} from "lucide-react";

import TradingViewChart from './TradingViewChart';
import TimeController from './TimeController';
import { useQuery } from '@tanstack/react-query';
import { getStockData, getCryptoData, getForexData, getGoldData, getMultipleMarketData } from '@/services/marketService';
import { Trade } from '@shared/schema';

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

interface IntegratedTradingEnvironmentProps {
  onClose?: () => void;
  onSaveTrade?: (trade: any) => void;
  fullScreen?: boolean;
  initialPositions?: Position[];
  demoMode?: boolean;
  onPositionClose?: (position: Position) => void;
}

// Trading pairs available for analysis
const tradingPairs = [
  // Cryptocurrencies
  { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', initialPrice: 40000 },
  { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', initialPrice: 2200 },
  { symbol: 'XRP/USD', name: 'Ripple', type: 'crypto', initialPrice: 0.5 },
  { symbol: 'SOL/USD', name: 'Solana', type: 'crypto', initialPrice: 120 },
  { symbol: 'ADA/USD', name: 'Cardano', type: 'crypto', initialPrice: 0.4 },
  { symbol: 'DOT/USD', name: 'Polkadot', type: 'crypto', initialPrice: 6 },

  // US Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', initialPrice: 170 },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock', initialPrice: 320 },
  { symbol: 'GOOG', name: 'Google', type: 'stock', initialPrice: 135 },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', initialPrice: 240 },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock', initialPrice: 130 },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock', initialPrice: 330 },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock', initialPrice: 420 },
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', initialPrice: 175 },
  
  // Indices
  { symbol: 'SPY', name: 'S&P 500', type: 'index', initialPrice: 500 },
  { symbol: 'QQQ', name: 'NASDAQ', type: 'index', initialPrice: 400 },
  { symbol: 'DIA', name: 'Dow Jones', type: 'index', initialPrice: 380 },
  { symbol: 'IWM', name: 'Russell 2000', type: 'index', initialPrice: 200 },
  
  // Commodities
  { symbol: 'GLD', name: 'Gold', type: 'commodity', initialPrice: 2000 },
  { symbol: 'SLV', name: 'Silver', type: 'commodity', initialPrice: 25 },
  { symbol: 'USO', name: 'Oil', type: 'commodity', initialPrice: 75 },
  
  // Forex
  { symbol: 'EUR/USD', name: 'Euro/US Dollar', type: 'forex', initialPrice: 1.08 },
  { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', type: 'forex', initialPrice: 150 },
  { symbol: 'GBP/USD', name: 'British Pound/US Dollar', type: 'forex', initialPrice: 1.26 },
  { symbol: 'USD/CHF', name: 'US Dollar/Swiss Franc', type: 'forex', initialPrice: 0.90 },
  { symbol: 'USD/CAD', name: 'US Dollar/Canadian Dollar', type: 'forex', initialPrice: 1.37 },
];

// List of technical indicators
const indicators = [
  { id: 'ma', name: 'Moving Average', category: 'trend' },
  { id: 'ema', name: 'Exponential MA', category: 'trend' },
  { id: 'macd', name: 'MACD', category: 'momentum' },
  { id: 'rsi', name: 'RSI', category: 'momentum' },
  { id: 'bollinger', name: 'Bollinger Bands', category: 'volatility' },
  { id: 'vol', name: 'Volume', category: 'volume' },
  { id: 'fibonacci', name: 'Fibonacci', category: 'pattern' },
  { id: 'wyckoffVS', name: 'Wyckoff Volume Spread', category: 'wyckoff' },
];

// Drawing tools
const drawingTools = [
  { id: 'cursor', name: 'Cursor', icon: <Crosshair className="h-4 w-4" /> },
  { id: 'trendline', name: 'Trend Line', icon: <LineChart className="h-4 w-4" /> },
  { id: 'rectangle', name: 'Rectangle', icon: <SplitSquareVertical className="h-4 w-4" /> },
];

const IntegratedTradingEnvironment: React.FC<IntegratedTradingEnvironmentProps> = ({
  onClose,
  onSaveTrade,
  fullScreen = false,
  initialPositions = [],
  demoMode = false,
  onPositionClose
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [timeControllerDate, setTimeControllerDate] = useState(new Date());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState('cursor');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['ma']);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [orderType, setOrderType] = useState('market');
  const [orderSide, setOrderSide] = useState('long');
  const [orderAmount, setOrderAmount] = useState('1000');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderTakeProfit, setOrderTakeProfit] = useState('');
  const [orderStopLoss, setOrderStopLoss] = useState('');
  const [showHistoricalOnly, setShowHistoricalOnly] = useState(false);
  const [leverage, setLeverage] = useState(1);
  const [showTools, setShowTools] = useState(true);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showVolume, setShowVolume] = useState(true);

  // Fetch market data for current symbol
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['marketData', selectedPair.symbol],
    queryFn: async () => {
      switch(selectedPair.type) {
        case 'crypto':
          return await getCryptoData(selectedPair.symbol.split('/')[0]);
        case 'forex':
          if (selectedPair.symbol.includes('/')) {
            const [base, quote] = selectedPair.symbol.split('/');
            return await getForexData(base, quote);
          }
          return await getStockData(selectedPair.symbol);
        case 'commodity':
          if (selectedPair.symbol === 'GLD') {
            return await getGoldData();
          }
          return await getStockData(selectedPair.symbol);
        case 'index':
        case 'stock':
        default:
          return await getStockData(selectedPair.symbol);
      }
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });

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

  // Update displayed data based on time controller
  useEffect(() => {
    // In a real implementation, this would fetch historical data for the selected date
    // For now, we're just logging the date change
    console.log('Fetching data for date:', timeControllerDate.toISOString());
    
    // If playing, we'd set up an interval to advance time
    if (isPlaying) {
      const interval = setInterval(() => {
        const newDate = new Date(timeControllerDate);
        // Move forward in time at the specified speed
        newDate.setMinutes(newDate.getMinutes() + (1 * playbackSpeed));
        setTimeControllerDate(newDate);
      }, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [timeControllerDate, isPlaying, playbackSpeed]);

  // Create a new position
  const handleCreatePosition = () => {
    if (!marketData) return;
    
    const price = orderType === 'market' 
      ? marketData.price 
      : parseFloat(orderPrice);
      
    const newPosition: Position = {
      id: `position-${Date.now()}`,
      type: orderSide as 'long' | 'short',
      entryPrice: price,
      entryTime: new Date().toISOString(),
      stopLoss: orderStopLoss ? parseFloat(orderStopLoss) : null,
      takeProfit: orderTakeProfit ? parseFloat(orderTakeProfit) : null,
      amount: parseFloat(orderAmount),
      leverage: leverage,
      status: 'active',
    };
    
    setPositions([...positions, newPosition]);
    
    // Reset form
    setOrderPrice('');
    setOrderTakeProfit('');
    setOrderStopLoss('');
    
    toast({
      title: t("Position Created"),
      description: `${orderSide === 'long' ? 'Long' : 'Short'} position opened at ${price}`,
    });
  };

  // Close a position
  const handleClosePosition = (position: Position) => {
    if (!marketData) return;
    
    const currentPrice = marketData.price;
    let pnl = 0;
    
    // Calculate P/L
    if (position.type === 'long') {
      pnl = (currentPrice - position.entryPrice) * position.amount * position.leverage;
    } else {
      pnl = (position.entryPrice - currentPrice) * position.amount * position.leverage;
    }
    
    // Update position
    const updatedPosition: Position = {
      ...position,
      status: 'closed',
      exitPrice: currentPrice,
      exitTime: new Date().toISOString(),
      profitLoss: pnl
    };
    
    // Update positions list
    setPositions(positions.map(p => 
      p.id === position.id ? updatedPosition : p
    ));
    
    // Notify parent component
    if (onPositionClose) {
      onPositionClose(updatedPosition);
    }
    
    toast({
      title: t("Position Closed"),
      description: `${position.type === 'long' ? 'Long' : 'Short'} position closed with P/L: $${pnl.toFixed(2)}`,
      variant: pnl >= 0 ? "default" : "destructive",
    });
  };

  // Save current analysis as a trade
  const handleSaveTrade = () => {
    if (!onSaveTrade) return;
    
    const trade = {
      pair: selectedPair.symbol,
      entryPrice: positions.length > 0 ? positions[0].entryPrice : marketData?.price,
      exitPrice: null,
      amount: positions.length > 0 ? positions[0].amount : 1000,
      tradeType: positions.length > 0 ? positions[0].type : 'long',
      strategy: activeIndicators.join(','),
      date: new Date().toISOString(),
      status: 'active',
      profitLoss: null,
      notes: `Analysis using ${activeIndicators.join(', ')} at ${timeControllerDate.toLocaleString()}`,
    };
    
    onSaveTrade(trade);
    
    toast({
      title: t("Trade Saved"),
      description: t("Your analysis has been saved as a new trade"),
    });
  };

  return (
    <div className={`bg-background ${fullScreen ? 'fixed inset-0 z-50' : 'h-full w-full'}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between p-2 border-b bg-card">
        <div className="flex items-center space-x-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("Back")}
            </Button>
          )}
          <h2 className="text-lg font-semibold">{t("Trading Environment")}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select 
            value={selectedPair.symbol} 
            onValueChange={(value) => {
              const pair = tradingPairs.find(p => p.symbol === value);
              if (pair) setSelectedPair(pair);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("Select Symbol")} />
            </SelectTrigger>
            <SelectContent>
              {tradingPairs.map((pair) => (
                <SelectItem key={pair.symbol} value={pair.symbol}>
                  {pair.name} ({pair.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!demoMode && (
            <Button variant="outline" size="sm" onClick={handleSaveTrade}>
              <Save className="h-4 w-4 mr-1" />
              {t("Save Analysis")}
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={() => setShowTools(!showTools)}>
            <Settings className="h-4 w-4" />
          </Button>
          
          {fullScreen && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <LayoutDashboard className="h-4 w-4 mr-1" />
              {t("Exit Fullscreen")}
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="h-[calc(100%-4rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chart panel */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <div className="h-full flex flex-col">
              {/* Time control bar */}
              <div className="border-b p-2 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder={t("Timeframe")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5M">5M</SelectItem>
                        <SelectItem value="15M">15M</SelectItem>
                        <SelectItem value="1H">1H</SelectItem>
                        <SelectItem value="4H">4H</SelectItem>
                        <SelectItem value="1D">1D</SelectItem>
                        <SelectItem value="1W">1W</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant={chartType === 'candle' ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setChartType('candle')}
                      >
                        <CandlestickChart className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant={chartType === 'line' ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setChartType('line')}
                      >
                        <LineChart className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center">
                      <Switch 
                        checked={showVolume} 
                        onCheckedChange={setShowVolume} 
                        id="show-volume"
                      />
                      <Label htmlFor="show-volume" className="ml-2">
                        {t("Volume")}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {drawingTools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant={activeDrawingTool === tool.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveDrawingTool(tool.id)}
                      >
                        {tool.icon}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Chart area */}
              <div className="flex-grow">
                <div className="flex h-full">
                  <div className="h-full w-full">
                    <TradingViewChart 
                      symbol={selectedPair.symbol}
                      initialPrice={selectedPair.initialPrice}
                      className="h-full w-full"
                      initialPositions={positions}
                    />
                  </div>
                  
                  {/* Indicator sidebar - only show when tools are enabled */}
                  {showTools && (
                    <div className="w-64 border-l p-2 bg-card overflow-y-auto">
                      <h3 className="font-medium mb-2">{t("Indicators")}</h3>
                      <div className="space-y-2">
                        {indicators.map((indicator) => (
                          <div key={indicator.id} className="flex items-center">
                            <Switch
                              checked={activeIndicators.includes(indicator.id)}
                              onCheckedChange={() => toggleIndicator(indicator.id)}
                              id={`indicator-${indicator.id}`}
                            />
                            <Label htmlFor={`indicator-${indicator.id}`} className="ml-2">
                              {indicator.name}
                            </Label>
                            <Badge className="ml-auto" variant="outline">
                              {indicator.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Right panel - positions and controls */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <Tabs defaultValue="trading">
              <TabsList className="w-full">
                <TabsTrigger value="trading">{t("Trading")}</TabsTrigger>
                <TabsTrigger value="time">{t("Time Control")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trading" className="p-0">
                <div className="p-4 space-y-4">
                  <h3 className="font-medium">{t("Create Position")}</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={orderSide === 'long' ? "default" : "outline"}
                      className={orderSide === 'long' ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => setOrderSide('long')}
                    >
                      {t("Long")}
                    </Button>
                    <Button 
                      variant={orderSide === 'short' ? "default" : "outline"}
                      className={orderSide === 'short' ? "bg-red-600 hover:bg-red-700" : ""}
                      onClick={() => setOrderSide('short')}
                    >
                      {t("Short")}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t("Amount ($)")}</Label>
                    <Input 
                      id="amount" 
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      type="number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="leverage">{t("Leverage")}</Label>
                      <Badge variant="outline">{leverage}x</Badge>
                    </div>
                    <Slider 
                      id="leverage"
                      min={1} 
                      max={10} 
                      step={1}
                      value={[leverage]}
                      onValueChange={(values) => setLeverage(values[0])} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="take-profit">{t("Take Profit ($)")}</Label>
                    <Input 
                      id="take-profit" 
                      value={orderTakeProfit}
                      onChange={(e) => setOrderTakeProfit(e.target.value)}
                      type="number"
                      placeholder={orderSide === 'long' ? "Higher than entry" : "Lower than entry"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stop-loss">{t("Stop Loss ($)")}</Label>
                    <Input 
                      id="stop-loss" 
                      value={orderStopLoss}
                      onChange={(e) => setOrderStopLoss(e.target.value)}
                      type="number"
                      placeholder={orderSide === 'long' ? "Lower than entry" : "Higher than entry"}
                    />
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleCreatePosition}
                    disabled={isLoading || !marketData}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("Create Position")}
                  </Button>
                  
                  <Separator />
                  
                  <h3 className="font-medium">{t("Active Positions")}</h3>
                  {positions.filter(p => p.status === 'active').length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {t("No active positions")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {positions
                        .filter(p => p.status === 'active')
                        .map((position) => (
                          <Card key={position.id}>
                            <CardContent className="p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <Badge 
                                    variant={position.type === 'long' ? "default" : "destructive"}
                                    className={position.type === 'long' ? "bg-green-600" : ""}
                                  >
                                    {position.type === 'long' ? t("Long") : t("Short")}
                                  </Badge>
                                  <div className="text-sm mt-1">
                                    {selectedPair.symbol} • ${position.amount.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t("Entry")}: ${position.entryPrice.toFixed(2)}
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleClosePosition(position)}
                                >
                                  {t("Close")}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                  
                  {positions.filter(p => p.status === 'closed').length > 0 && (
                    <>
                      <Separator />
                      <Accordion type="single" collapsible>
                        <AccordionItem value="closed-positions">
                          <AccordionTrigger>
                            {t("Closed Positions")} ({positions.filter(p => p.status === 'closed').length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 mt-2">
                              {positions
                                .filter(p => p.status === 'closed')
                                .map((position) => (
                                  <Card key={position.id}>
                                    <CardContent className="p-3">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <Badge 
                                            variant={position.type === 'long' ? "default" : "destructive"}
                                            className={position.type === 'long' ? "bg-green-600" : ""}
                                          >
                                            {position.type === 'long' ? t("Long") : t("Short")}
                                          </Badge>
                                          <div className="text-sm mt-1">
                                            {selectedPair.symbol} • ${position.amount.toFixed(2)}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {t("Result")}: ${position.profitLoss?.toFixed(2) || '0.00'}
                                          </div>
                                        </div>
                                        <Badge 
                                          variant={(position.profitLoss || 0) >= 0 ? "default" : "destructive"}
                                          className={(position.profitLoss || 0) >= 0 ? "bg-green-600" : ""}
                                        >
                                          {(position.profitLoss || 0) >= 0 ? t("Profit") : t("Loss")}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="time" className="p-0">
                <div className="p-4">
                  <TimeController 
                    onTimeChange={setTimeControllerDate}
                    onSpeedChange={setPlaybackSpeed}
                    onPlayingChange={setIsPlaying}
                    initialDate={timeControllerDate}
                  />
                  
                  <div className="mt-4">
                    <div className="flex items-center mb-2">
                      <Switch 
                        checked={showHistoricalOnly} 
                        onCheckedChange={setShowHistoricalOnly} 
                        id="historical-only"
                      />
                      <Label htmlFor="historical-only" className="ml-2">
                        {t("Show historical data only")}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("Hide future data to practice backtesting without seeing the outcome")}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default IntegratedTradingEnvironment;