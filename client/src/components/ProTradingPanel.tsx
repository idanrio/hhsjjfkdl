import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// Import UI components individually since @/components/ui might not be available
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Button } from "@radix-ui/react-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@radix-ui/react-dialog";
import { Switch } from "@radix-ui/react-switch";
import { Input } from "@radix-ui/react-popover";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@radix-ui/react-dialog";
import { Badge } from "@radix-ui/react-badge";
import { Separator } from "@radix-ui/react-separator";

import { 
  BarChart3, 
  ChevronDown, 
  Settings, 
  Maximize2, 
  Minimize2,
  Star,
  Pencil,
  MessageSquare,
} from 'lucide-react';

import ProfessionalTradingView, { TradingViewRef } from './ProfessionalTradingView';
import AIWyckoffCoach from './AIWyckoffCoach';
import { Position, TradeDirection, TradeStatus } from '../types/trading';

// Define trading pair options
const tradingPairs = [
  { value: 'BINANCE:BTCUSDT', label: 'Bitcoin (BTC/USDT)' },
  { value: 'BINANCE:ETHUSDT', label: 'Ethereum (ETH/USDT)' },
  { value: 'BINANCE:SOLUSDT', label: 'Solana (SOL/USDT)' },
  { value: 'BINANCE:BNBUSDT', label: 'Binance Coin (BNB/USDT)' },
  { value: 'BINANCE:ADAUSDT', label: 'Cardano (ADA/USDT)' },
  { value: 'BINANCE:DOGEUSDT', label: 'Dogecoin (DOGE/USDT)' },
  { value: 'BINANCE:DOTUSDT', label: 'Polkadot (DOT/USDT)' },
  { value: 'BINANCE:MATICUSDT', label: 'Polygon (MATIC/USDT)' },
  { value: 'BINANCE:XRPUSDT', label: 'XRP (XRP/USDT)' },
  { value: 'BINANCE:AVAXUSDT', label: 'Avalanche (AVAX/USDT)' },
];

// Define timeframe options
const timeframes = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
];

// Chart style options
const chartStyles = [
  { value: '1', label: 'Candles' },
  { value: '0', label: 'Bars' },
  { value: '2', label: 'Line' },
  { value: '3', label: 'Area' },
];

interface ProTradingPanelProps {
  initialPositions?: Position[];
  onPositionCreated?: (position: Position) => void;
  onPositionClosed?: (position: Position) => void;
  onPositionUpdated?: (position: Position) => void;
  fullScreenMode?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  className?: string;
  showPositionsPanel?: boolean;
  accountBalance?: number;
}

const ProTradingPanel: React.FC<ProTradingPanelProps> = ({
  initialPositions = [],
  onPositionCreated,
  onPositionClosed,
  onPositionUpdated,
  fullScreenMode = false,
  onFullScreenChange,
  className = '',
  showPositionsPanel = true,
  accountBalance = 150000,
}) => {
  const { t, i18n } = useTranslation();
  
  // State for chart settings
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1D');
  const [selectedChartStyle, setSelectedChartStyle] = useState<string>('1');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(fullScreenMode);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  // State for UI panels
  const [activeTab, setActiveTab] = useState<string>('orders');
  const [showSymbolSearch, setShowSymbolSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT']);
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // State for chart settings
  const [tvSettings, setTVSettings] = useState({
    showVolume: true,
    showGrid: true,
    showDateRanges: true,
    autoScale: true,
    showWatermark: false,
    showBorder: true,
    showLegend: true,
  });
  
  // State for trade execution
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop_limit'>('market');
  const [orderAmount, setOrderAmount] = useState<string>('');
  const [orderLeverage, setOrderLeverage] = useState<string>('1');
  const [takeProfitEnabled, setTakeProfitEnabled] = useState<boolean>(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossEnabled, setStopLossEnabled] = useState<boolean>(false);
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [reduceOnly, setReduceOnly] = useState<boolean>(false);
  const [amountUnit, setAmountUnit] = useState<'token' | 'usd'>('usd');
  
  // State for positions
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [showWyckoffCoach, setShowWyckoffCoach] = useState<boolean>(false);
  
  // Trading view reference
  const tradingViewRef = useRef<TradingViewRef>(null);
  
  // Handle fullscreen change
  useEffect(() => {
    if (onFullScreenChange) {
      onFullScreenChange(isFullScreen);
    }
  }, [isFullScreen, onFullScreenChange]);
  
  // Filter symbols based on search query
  const filteredSymbols = tradingPairs.filter(pair => 
    pair.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.value.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle favorite symbol
  const toggleFavorite = (symbol: string) => {
    if (favoriteSymbols.includes(symbol)) {
      setFavoriteSymbols(favoriteSymbols.filter(s => s !== symbol));
    } else {
      setFavoriteSymbols([...favoriteSymbols, symbol]);
    }
  };
  
  // Get display name for symbol
  const getSymbolDisplayName = (symbol: string) => {
    const pair = tradingPairs.find(p => p.value === symbol);
    return pair ? pair.label : symbol;
  };
  
  // Calculate effective order value
  const calculateOrderValue = (): string => {
    if (!orderAmount || currentPrice <= 0) return '0.00';
    
    const amount = parseFloat(orderAmount);
    if (isNaN(amount)) return '0.00';
    
    if (amountUnit === 'token') {
      return (amount * currentPrice).toFixed(2);
    } else {
      return amount.toFixed(2);
    }
  };
  
  // Calculate effective position size
  const calculatePositionSize = (): string => {
    if (!orderAmount || currentPrice <= 0) return '0.00';
    
    const amount = parseFloat(orderAmount);
    if (isNaN(amount)) return '0.00';
    
    const leverage = parseFloat(orderLeverage) || 1;
    
    if (amountUnit === 'token') {
      return (amount * currentPrice * leverage).toFixed(2);
    } else {
      return (amount * leverage).toFixed(2);
    }
  };
  
  // Handle order execution
  const executeOrder = (direction: TradeDirection) => {
    if (!orderAmount || parseFloat(orderAmount) <= 0 || currentPrice <= 0) {
      return;
    }
    
    // Calculate order details
    const amount = parseFloat(orderAmount);
    const leverage = parseFloat(orderLeverage) || 1;
    let entryPrice = currentPrice;
    
    if (orderType === 'limit') {
      // For limit orders, we would typically get the price from a price input
      // For this demo, we'll just use the current price
      entryPrice = currentPrice;
    }
    
    // Create new position
    const newPosition: Position = {
      id: `pos_${Math.random().toString(36).substring(2, 9)}`,
      symbol: selectedSymbol,
      direction,
      entryPrice,
      amount: amountUnit === 'token' ? amount : amount / currentPrice,
      leverage,
      liquidationPrice: direction === 'long' 
        ? entryPrice * (1 - (1 / leverage)) 
        : entryPrice * (1 + (1 / leverage)),
      status: 'active' as TradeStatus,
      openTime: new Date().toISOString(),
      takeProfitPrice: takeProfitEnabled && takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
      stopLossPrice: stopLossEnabled && stopLossPrice ? parseFloat(stopLossPrice) : undefined,
      unrealizedPnl: 0,
      pnlPercentage: 0,
    };
    
    // Update positions state
    setPositions([...positions, newPosition]);
    
    // Call callback if provided
    if (onPositionCreated) {
      onPositionCreated(newPosition);
    }
    
    // Reset order form
    setOrderAmount('');
    setTakeProfitEnabled(false);
    setTakeProfitPrice('');
    setStopLossEnabled(false);
    setStopLossPrice('');
    setReduceOnly(false);
  };
  
  // Handle closing a position
  const closePosition = (positionId: string) => {
    const positionToClose = positions.find(p => p.id === positionId);
    if (!positionToClose) return;
    
    // Calculate PnL based on current price
    const directionMultiplier = positionToClose.direction === 'long' ? 1 : -1;
    const priceDifference = (currentPrice - positionToClose.entryPrice) * directionMultiplier;
    const rawPnl = priceDifference * positionToClose.amount * positionToClose.leverage;
    const pnlPercentage = (priceDifference / positionToClose.entryPrice) * 100 * positionToClose.leverage;
    
    // Update position
    const updatedPosition: Position = {
      ...positionToClose,
      status: TradeStatus.Closed,
      closeTime: new Date().toISOString(),
      exitPrice: currentPrice,
      realizedPnl: rawPnl,
      pnlPercentage,
    };
    
    // Update positions state
    setPositions(positions.map(p => p.id === positionId ? updatedPosition : p));
    
    // Call callback if provided
    if (onPositionClosed) {
      onPositionClosed(updatedPosition);
    }
  };
  
  // Update unrealized PnL for open positions
  useEffect(() => {
    if (currentPrice <= 0) return;
    
    const updatedPositions = positions.map(position => {
      if (position.status !== TradeStatus.Active) return position;
      
      const directionMultiplier = position.direction === 'long' ? 1 : -1;
      const priceDifference = (currentPrice - position.entryPrice) * directionMultiplier;
      const rawPnl = priceDifference * position.amount * position.leverage;
      const pnlPercentage = (priceDifference / position.entryPrice) * 100 * position.leverage;
      
      return {
        ...position,
        unrealizedPnl: rawPnl,
        pnlPercentage,
        currentPrice,
      };
    });
    
    setPositions(updatedPositions);
    
    // Notify about position updates if callback provided
    if (onPositionUpdated && updatedPositions.some(p => p.status === TradeStatus.Active)) {
      updatedPositions
        .filter(p => p.status === TradeStatus.Active)
        .forEach(p => {
          if (onPositionUpdated) onPositionUpdated(p);
        });
    }
  }, [currentPrice, positions, onPositionUpdated]);
  
  // Calculate account statistics
  const calculateAccountStats = () => {
    const totalEquity = accountBalance + positions.reduce((sum, position) => {
      if (position.status === TradeStatus.Active && position.unrealizedPnl) {
        return sum + position.unrealizedPnl;
      }
      return sum;
    }, 0);
    
    const availableBalance = accountBalance - positions.reduce((sum, position) => {
      if (position.status === TradeStatus.Active) {
        const positionValue = position.amount * position.entryPrice / position.leverage;
        return sum + positionValue;
      }
      return sum;
    }, 0);
    
    const totalPnl = positions.reduce((sum, position) => {
      if (position.status === TradeStatus.Active && position.unrealizedPnl) {
        return sum + position.unrealizedPnl;
      } else if (position.status === TradeStatus.Closed && position.realizedPnl) {
        return sum + position.realizedPnl;
      }
      return sum;
    }, 0);
    
    return {
      totalEquity: totalEquity.toFixed(2),
      availableBalance: availableBalance.toFixed(2),
      totalPnl: totalPnl.toFixed(2),
      pnlPercentage: ((totalPnl / accountBalance) * 100).toFixed(2),
    };
  };
  
  // Account stats
  const accountStats = calculateAccountStats();
  
  // Filter active and closed positions
  const activePositions = positions.filter(p => p.status === TradeStatus.Active);
  const closedPositions = positions.filter(p => p.status === TradeStatus.Closed);
  
  // Handle Wyckoff analysis results
  const handleWyckoffAnalysis = (analysis: any) => {
    console.log('Wyckoff Analysis:', analysis);
    // Implement handling of analysis results here
  };
  
  return (
    <div 
      className={`pro-trading-panel ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
      style={{ height: isFullScreen ? '100vh' : '800px' }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b p-2 bg-background">
        <div className="flex items-center space-x-2">
          {/* Symbol Selector */}
          <Popover open={showSymbolSearch} onOpenChange={setShowSymbolSearch}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-1">
                <span>{getSymbolDisplayName(selectedSymbol)}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-2 border-b">
                <Input
                  placeholder={t('Search symbols...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="p-2">
                <h4 className="text-sm font-medium mb-2">{t('Favorites')}</h4>
                {favoriteSymbols.length > 0 ? (
                  <div className="space-y-1 mb-4">
                    {favoriteSymbols.map(symbol => {
                      const found = tradingPairs.find(pair => pair.value === symbol);
                      if (!found) return null;
                      
                      return (
                        <div 
                          key={symbol} 
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setSelectedSymbol(symbol);
                            if (tradingViewRef.current) {
                              tradingViewRef.current.changeSymbol(symbol);
                            }
                            setShowSymbolSearch(false);
                          }}
                        >
                          <span>{found.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(symbol);
                            }}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('No favorite symbols. Click the star to add.')}
                  </p>
                )}
                
                <h4 className="text-sm font-medium mb-2">{t('All Symbols')}</h4>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {filteredSymbols.map(pair => (
                    <div 
                      key={pair.value} 
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedSymbol(pair.value);
                        if (tradingViewRef.current) {
                          tradingViewRef.current.changeSymbol(pair.value);
                        }
                        setShowSymbolSearch(false);
                      }}
                    >
                      <span>{pair.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(pair.value);
                        }}
                      >
                        <Star 
                          className={`h-4 w-4 ${favoriteSymbols.includes(pair.value) ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                        />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Timeframe Selector */}
          <Select 
            value={selectedTimeframe} 
            onValueChange={(value) => {
              setSelectedTimeframe(value);
              if (tradingViewRef.current) {
                tradingViewRef.current.changeInterval(value);
              }
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map(timeframe => (
                <SelectItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Chart Style Selector */}
          <Select 
            value={selectedChartStyle} 
            onValueChange={setSelectedChartStyle}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chartStyles.map(style => (
                <SelectItem key={style.value} value={style.value}>
                  {t(style.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Indicators Button */}
          <Sheet open={showIndicators} onOpenChange={setShowIndicators}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                {t('Indicators')}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[350px] sm:w-[450px]">
              <SheetHeader>
                <SheetTitle>{t('Indicators & Studies')}</SheetTitle>
                <SheetDescription>
                  {t('Add technical indicators to your chart')}
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4">
                <Input 
                  placeholder={t('Search indicators...')}
                  className="mb-4"
                />
                
                <Tabs defaultValue="popular">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="popular">{t('Popular')}</TabsTrigger>
                    <TabsTrigger value="oscillators">{t('Oscillators')}</TabsTrigger>
                    <TabsTrigger value="volume">{t('Volume')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="popular" className="space-y-2">
                    <div className="p-2 border rounded-md hover:bg-muted cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Moving Average</span>
                        <Badge variant="outline">MA</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Simple moving average of price')}
                      </p>
                    </div>
                    
                    <div className="p-2 border rounded-md hover:bg-muted cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Bollinger Bands</span>
                        <Badge variant="outline">BB</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Volatility bands based on standard deviation')}
                      </p>
                    </div>
                    
                    <div className="p-2 border rounded-md hover:bg-muted cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">MACD</span>
                        <Badge variant="outline">MACD</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Moving Average Convergence/Divergence')}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="oscillators" className="space-y-2">
                    <div className="p-2 border rounded-md hover:bg-muted cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Relative Strength Index</span>
                        <Badge variant="outline">RSI</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Momentum oscillator that measures speed of price changes')}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="volume" className="space-y-2">
                    <div className="p-2 border rounded-md hover:bg-muted cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">On-Balance Volume</span>
                        <Badge variant="outline">OBV</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Cumulative volume indicator related to price changes')}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">{t('Active Indicators')}</h4>
                  <Badge variant="outline">3 {t('indicators selected')}</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="p-2 border rounded-md bg-muted flex justify-between items-center">
                    <span>Moving Average (20)</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Chart Settings */}
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t('Chart Settings')}</SheetTitle>
                <SheetDescription>
                  {t('Customize your trading chart appearance')}
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Volume')}
                    </label>
                    <Switch 
                      checked={tvSettings.showVolume}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showVolume: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Grid')}
                    </label>
                    <Switch 
                      checked={tvSettings.showGrid}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showGrid: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Date Ranges')}
                    </label>
                    <Switch 
                      checked={tvSettings.showDateRanges}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showDateRanges: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Auto Scale')}
                    </label>
                    <Switch 
                      checked={tvSettings.autoScale}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, autoScale: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Watermark')}
                    </label>
                    <Switch 
                      checked={tvSettings.showWatermark}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showWatermark: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Border')}
                    </label>
                    <Switch 
                      checked={tvSettings.showBorder}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showBorder: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Legend')}
                    </label>
                    <Switch 
                      checked={tvSettings.showLegend}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showLegend: checked})}
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Current Price */}
          <div className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium">
            {currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          
          {/* Wyckoff Coach Button */}
          <Dialog open={showWyckoffCoach} onOpenChange={setShowWyckoffCoach}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-[#22a1e2] border-[#22a1e2] hover:bg-[#22a1e2]/10 hover:text-[#22a1e2] hover:border-[#22a1e2]">
                <MessageSquare className="h-4 w-4 mr-1" />
                {t('Wyckoff Coach')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t('Wyckoff Analysis Coach')}</DialogTitle>
                <DialogDescription>
                  {t('Get AI-powered Wyckoff analysis for your current chart')}
                </DialogDescription>
              </DialogHeader>
              
              <AIWyckoffCoach
                tradingViewRef={tradingViewRef}
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                onAnalysisComplete={handleWyckoffAnalysis}
              />
              
              <DialogFooter>
                <Button onClick={() => setShowWyckoffCoach(false)}>
                  {t('Close')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row h-[calc(100%-4rem)]">
        {/* Chart Area */}
        <div className={`flex-grow ${showPositionsPanel ? 'md:w-2/3' : 'w-full'}`}>
          <ProfessionalTradingView
            ref={tradingViewRef}
            symbol={selectedSymbol}
            interval={selectedTimeframe}
            theme="dark"
            width="100%"
            height="100%"
            showVolume={tvSettings.showVolume}
            showGrid={tvSettings.showGrid}
            showDateRanges={tvSettings.showDateRanges}
            includeTradingViewBranding={false}
            timezone="Etc/UTC"
            locale={i18n.language === 'he' ? 'he_IL' : 'en'}
            studies={['Volume@tv-basicstudies']}
            onPriceUpdate={(price) => setCurrentPrice(price)}
          />
        </div>
        
        {/* Trading Panel */}
        {showPositionsPanel && (
          <div className="border-t md:border-t-0 md:border-l md:w-1/3 flex flex-col h-full overflow-hidden">
            {/* Account Info Bar */}
            <div className="p-2 border-b bg-muted/50 flex flex-wrap text-xs">
              <div className="flex flex-col mr-4 mb-1">
                <span className="text-muted-foreground">{t('Account Balance')}</span>
                <span className="font-medium">${accountBalance.toLocaleString()}</span>
              </div>
              <div className="flex flex-col mr-4 mb-1">
                <span className="text-muted-foreground">{t('Equity')}</span>
                <span className="font-medium">${accountStats.totalEquity}</span>
              </div>
              <div className="flex flex-col mr-4 mb-1">
                <span className="text-muted-foreground">{t('Available')}</span>
                <span className="font-medium">${accountStats.availableBalance}</span>
              </div>
              <div className="flex flex-col mb-1">
                <span className="text-muted-foreground">{t('P&L')}</span>
                <span className={`font-medium ${parseFloat(accountStats.totalPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${accountStats.totalPnl} ({accountStats.pnlPercentage}%)
                </span>
              </div>
            </div>
            
            {/* Trading Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col h-full">
              <TabsList className="grid grid-cols-2 mb-0 p-0">
                <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#22a1e2]">
                  {t('Orders')}
                </TabsTrigger>
                <TabsTrigger value="positions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#22a1e2]">
                  {t('Positions')}
                </TabsTrigger>
              </TabsList>
              
              {/* Orders Tab Content */}
              <TabsContent value="orders" className="flex-grow flex flex-col mt-0 p-0">
                <div className="p-3">
                  {/* Order Type Selection */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      {t('Order Type')}
                    </label>
                    <Select value={orderType} onValueChange={(val) => setOrderType(val as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select Type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">{t('Market')}</SelectItem>
                        <SelectItem value="limit">{t('Limit')}</SelectItem>
                        <SelectItem value="stop">{t('Stop')}</SelectItem>
                        <SelectItem value="stop_limit">{t('Stop Limit')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Amount Input */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium">
                        {t('Amount')}
                      </label>
                      <div className="text-xs text-muted-foreground">
                        <label className="inline-flex items-center cursor-pointer">
                          <span className={`mr-1 ${amountUnit === 'usd' ? 'text-primary' : 'text-muted-foreground'}`}>
                            {t('USD')}
                          </span>
                          <Switch 
                            checked={amountUnit === 'token'} 
                            onCheckedChange={(checked) => setAmountUnit(checked ? 'token' : 'usd')}
                            className="mr-1"
                          />
                          <span className={amountUnit === 'token' ? 'text-primary' : 'text-muted-foreground'}>
                            {t('Tokens')}
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        value={orderAmount}
                        onChange={(e) => setOrderAmount(e.target.value)}
                        placeholder={amountUnit === 'usd' ? '0.00 USD' : '0.00 Tokens'}
                        className="flex-grow"
                      />
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-0 h-6"
                          onClick={() => {
                            const availableBalance = parseFloat(accountStats.availableBalance);
                            if (amountUnit === 'usd') {
                              setOrderAmount((availableBalance * (percent / 100)).toFixed(2));
                            } else {
                              const tokenAmount = (availableBalance * (percent / 100)) / currentPrice;
                              setOrderAmount(tokenAmount.toFixed(6));
                            }
                          }}
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Leverage Slider */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      {t('Leverage')}:
                      <span className="ml-1 font-bold">{orderLeverage}x</span>
                    </label>
                    <div className="flex space-x-2">
                      {[1, 5, 10, 20].map((lev) => (
                        <Button
                          key={lev}
                          variant={orderLeverage === lev.toString() ? 'default' : 'outline'}
                          size="sm"
                          className={`flex-1 text-xs ${orderLeverage === lev.toString() ? 'bg-[#22a1e2]' : ''}`}
                          onClick={() => setOrderLeverage(lev.toString())}
                        >
                          {lev}x
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Take Profit & Stop Loss */}
                  <div className="space-y-3 mb-3">
                    <div className="flex items-center">
                      <Switch
                        id="take-profit"
                        checked={takeProfitEnabled}
                        onCheckedChange={setTakeProfitEnabled}
                        className="mr-2"
                      />
                      <label htmlFor="take-profit" className="text-sm font-medium cursor-pointer flex-grow">
                        {t('Take Profit')}
                      </label>
                      {takeProfitEnabled && (
                        <Input
                          type="number"
                          value={takeProfitPrice}
                          onChange={(e) => setTakeProfitPrice(e.target.value)}
                          placeholder="Price"
                          className="w-24"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Switch
                        id="stop-loss"
                        checked={stopLossEnabled}
                        onCheckedChange={setStopLossEnabled}
                        className="mr-2"
                      />
                      <label htmlFor="stop-loss" className="text-sm font-medium cursor-pointer flex-grow">
                        {t('Stop Loss')}
                      </label>
                      {stopLossEnabled && (
                        <Input
                          type="number"
                          value={stopLossPrice}
                          onChange={(e) => setStopLossPrice(e.target.value)}
                          placeholder="Price"
                          className="w-24"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Switch
                        id="reduce-only"
                        checked={reduceOnly}
                        onCheckedChange={setReduceOnly}
                        className="mr-2"
                      />
                      <label htmlFor="reduce-only" className="text-sm font-medium cursor-pointer">
                        {t('Reduce Only')}
                      </label>
                    </div>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Order Value')}:</span>
                      <span>${calculateOrderValue()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Leverage')}:</span>
                      <span>{orderLeverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Effective Position Size')}:</span>
                      <span>${calculatePositionSize()}</span>
                    </div>
                  </div>
                  
                  {/* Order Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className="bg-green-500 hover:bg-green-600 text-white h-12"
                      onClick={() => executeOrder('long')}
                      disabled={!orderAmount || parseFloat(orderAmount) <= 0}
                    >
                      {t('Buy / Long')}
                    </Button>
                    <Button 
                      className="bg-red-500 hover:bg-red-600 text-white h-12"
                      onClick={() => executeOrder('short')}
                      disabled={!orderAmount || parseFloat(orderAmount) <= 0}
                    >
                      {t('Sell / Short')}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              {/* Positions Tab Content */}
              <TabsContent value="positions" className="flex-grow flex flex-col mt-0 p-0 overflow-hidden">
                <div className="p-3 border-b flex justify-between items-center">
                  <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="active">{t('Active Positions')}</TabsTrigger>
                      <TabsTrigger value="closed">{t('Closed Positions')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="pt-3">
                      {activePositions.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {activePositions.map(position => (
                            <div key={position.id} className="border rounded-md p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <Badge
                                    className={position.direction === 'long' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}
                                  >
                                    {position.direction === 'long' ? t('Long') : t('Short')}
                                  </Badge>
                                  <span className="ml-2 font-medium">
                                    {getSymbolDisplayName(position.symbol)}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(position.openTime).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Size')}:</span>
                                  <span>{position.amount.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Value')}:</span>
                                  <span>${(position.amount * position.entryPrice).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Entry')}:</span>
                                  <span>${position.entryPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Leverage')}:</span>
                                  <span>{position.leverage}x</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Liquidation')}:</span>
                                  <span>${position.liquidationPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Current')}:</span>
                                  <span>${currentPrice.toFixed(2)}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-muted-foreground mr-1">{t('P&L')}:</span>
                                  <span className={position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    ${position.unrealizedPnl.toFixed(2)} ({position.pnlPercentage.toFixed(2)}%)
                                  </span>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => closePosition(position.id)}
                                >
                                  {t('Close')}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>{t('No active positions')}</p>
                          <p className="text-sm">{t('Create a position from the Orders tab')}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="closed" className="pt-3">
                      {closedPositions.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {closedPositions.map(position => (
                            <div key={position.id} className="border rounded-md p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <Badge
                                    className={position.direction === 'long' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}
                                  >
                                    {position.direction === 'long' ? t('Long') : t('Short')}
                                  </Badge>
                                  <span className="ml-2 font-medium">
                                    {getSymbolDisplayName(position.symbol)}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(position.openTime).toLocaleDateString()} - {position.closeTime ? new Date(position.closeTime).toLocaleDateString() : ''}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Entry')}:</span>
                                  <span>${position.entryPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Exit')}:</span>
                                  <span>${position.exitPrice?.toFixed(2) || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Size')}:</span>
                                  <span>{position.amount.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Leverage')}:</span>
                                  <span>{position.leverage}x</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-muted-foreground mr-1">{t('P&L')}:</span>
                                  <span className={position.realizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    ${position.realizedPnl.toFixed(2)} ({position.pnlPercentage.toFixed(2)}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>{t('No closed positions')}</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

// Export both default and named for backwards compatibility
export { ProTradingPanel };
export default ProTradingPanel;