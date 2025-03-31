import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EnhancedTradingViewWidget, { TradingViewRef } from './EnhancedTradingViewWidget';
import { ProTradingPanel } from './ProTradingPanel';
import { Position } from '@/types/trading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Switch
} from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Maximize2,
  Minimize2,
  Search,
  Star,
  Clock,
  BarChart3,
  Settings,
  List,
  Eye,
  Save,
  RefreshCw,
  ChevronsUp,
  ChevronsDown,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  Bookmark,
  FileCog,
  Calendar,
  ArrowLeftRight,
  PlayCircle,
  Layers,
  Bell,
  XCircle,
  CheckCircle,
} from 'lucide-react';

// Available trading pairs
const tradingPairs = [
  // Cryptocurrencies
  { value: 'BINANCE:BTCUSDT', label: 'Bitcoin (BTC/USDT)' },
  { value: 'BINANCE:ETHUSDT', label: 'Ethereum (ETH/USDT)' },
  { value: 'BINANCE:SOLUSDT', label: 'Solana (SOL/USDT)' },
  { value: 'BINANCE:BNBUSDT', label: 'Binance Coin (BNB/USDT)' },
  { value: 'BINANCE:ADAUSDT', label: 'Cardano (ADA/USDT)' },
  { value: 'BINANCE:XRPUSDT', label: 'Ripple (XRP/USDT)' },
  { value: 'BINANCE:DOGEUSDT', label: 'Dogecoin (DOGE/USDT)' },
  { value: 'BINANCE:DOTUSDT', label: 'Polkadot (DOT/USDT)' },
  { value: 'BINANCE:LINKUSDT', label: 'Chainlink (LINK/USDT)' },
  { value: 'BINANCE:AVAXUSDT', label: 'Avalanche (AVAX/USDT)' },
  
  // Stocks - Major Tech
  { value: 'NASDAQ:AAPL', label: 'Apple (AAPL)' },
  { value: 'NASDAQ:MSFT', label: 'Microsoft (MSFT)' },
  { value: 'NASDAQ:GOOGL', label: 'Google (GOOGL)' },
  { value: 'NASDAQ:AMZN', label: 'Amazon (AMZN)' },
  { value: 'NASDAQ:META', label: 'Meta (META)' },
  { value: 'NASDAQ:TSLA', label: 'Tesla (TSLA)' },
  { value: 'NASDAQ:NVDA', label: 'NVIDIA (NVDA)' },
  { value: 'NYSE:DIS', label: 'Disney (DIS)' },
  { value: 'NYSE:BA', label: 'Boeing (BA)' },
  { value: 'NYSE:JPM', label: 'JPMorgan Chase (JPM)' },
  
  // Indices
  { value: 'AMEX:SPY', label: 'S&P 500 (SPY)' },
  { value: 'AMEX:QQQ', label: 'Nasdaq 100 (QQQ)' },
  { value: 'INDEX:DJI', label: 'Dow Jones (DJI)' },
  { value: 'INDEX:IXIC', label: 'Nasdaq Composite (IXIC)' },
  { value: 'INDEX:RUT', label: 'Russell 2000 (RUT)' },
  
  // Forex Pairs
  { value: 'FX:EURUSD', label: 'EUR/USD' },
  { value: 'FX:GBPUSD', label: 'GBP/USD' },
  { value: 'FX:USDJPY', label: 'USD/JPY' },
  { value: 'FX:USDCHF', label: 'USD/CHF' },
  { value: 'FX:AUDUSD', label: 'AUD/USD' },
  { value: 'FX:NZDUSD', label: 'NZD/USD' },
  
  // Commodities
  { value: 'COMEX:GC1!', label: 'Gold Futures (GC)' },
  { value: 'NYMEX:CL1!', label: 'Crude Oil (CL)' },
  { value: 'COMEX:SI1!', label: 'Silver Futures (SI)' },
  { value: 'NYMEX:NG1!', label: 'Natural Gas (NG)' },
];

// Available timeframes
const timeframes = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
  { value: 'M', label: '1M' },
];

// Chart styles
const chartStyles = [
  { value: '1', label: 'Candles' },
  { value: '2', label: 'Bars' },
  { value: '3', label: 'Line' },
  { value: '4', label: 'Area' },
];

interface FullTradingEnvironmentProps {
  initialPositions?: Position[];
  onPositionCreated?: (position: Position) => void;
  onPositionClosed?: (position: Position) => void;
  onPositionUpdated?: (position: Position) => void;
  fullScreenMode?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  className?: string;
  showPositionsPanel?: boolean;
}

export function FullTradingEnvironment({
  initialPositions = [],
  onPositionCreated,
  onPositionClosed,
  onPositionUpdated,
  fullScreenMode = false,
  onFullScreenChange,
  className = '',
  showPositionsPanel = true,
}: FullTradingEnvironmentProps) {
  const { t, i18n } = useTranslation();
  const [selectedSymbol, setSelectedSymbol] = useState<string>(tradingPairs[0].value);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('D');
  const [selectedChartStyle, setSelectedChartStyle] = useState<string>('1');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(fullScreenMode);
  const [showSymbolSearch, setShowSymbolSearch] = useState<boolean>(false);
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([
    'BINANCE:BTCUSDT', 
    'NASDAQ:AAPL', 
    'AMEX:SPY'
  ]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [tvSettings, setTVSettings] = useState({
    showVolume: true,
    showGrid: true,
    showDateRanges: true,
    autoScale: true,
    showWatermark: false,
    showBorders: true,
    showLeftAxis: true,
    showRightAxis: true,
  });
  
  const tradingViewRef = useRef<TradingViewRef>(null);
  
  // Initialize positions from props
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);
  
  // Handle price updates from TradingView
  const handlePriceUpdate = (price: number) => {
    setCurrentPrice(price);
    
    // Update P/L for active positions
    if (positions.length > 0) {
      const updatedPositions = positions.map(position => {
        if (position.status === 'active') {
          let profitLoss = 0;
          
          // Calculate P/L based on position type
          if (position.type === 'long') {
            profitLoss = (price - position.entryPrice) * position.amount * position.leverage;
          } else { // short
            profitLoss = (position.entryPrice - price) * position.amount * position.leverage;
          }
          
          // Clone the position to avoid reference issues
          const updatedPosition = { ...position, profitLoss };
          
          // Check if we need to close based on stop loss or take profit
          if (position.stopLoss !== null && position.type === 'long' && price <= position.stopLoss) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          } else if (position.stopLoss !== null && position.type === 'short' && price >= position.stopLoss) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          } else if (position.takeProfit !== null && position.type === 'long' && price >= position.takeProfit) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          } else if (position.takeProfit !== null && position.type === 'short' && price <= position.takeProfit) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          }
          
          return updatedPosition;
        }
        return position;
      });
      
      setPositions(updatedPositions);
    }
  };
  
  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (onFullScreenChange) {
      onFullScreenChange(!isFullScreen);
    }
  };
  
  // Handle creating a new position
  const handleCreatePosition = (newPosition: Omit<Position, 'id' | 'status' | 'entryTime'>) => {
    // Generate a unique ID
    const id = `pos_${Date.now()}`;
    const entryTime = new Date().toISOString();
    
    // Create the full position object
    const fullPosition: Position = {
      id,
      status: 'active',
      entryTime,
      exitPrice: undefined,
      exitTime: undefined,
      profitLoss: 0,
      ...newPosition
    };
    
    // Update local state
    setPositions(prev => [...prev, fullPosition]);
    
    // Notify parent if callback exists
    if (onPositionCreated) {
      onPositionCreated(fullPosition);
    }
  };
  
  // Handle closing a position
  const handleClosePosition = (positionId: string) => {
    const positionIndex = positions.findIndex(p => p.id === positionId);
    
    if (positionIndex !== -1) {
      const position = positions[positionIndex];
      
      // Update position with close data
      const updatedPosition: Position = {
        ...position,
        status: 'closed',
        exitPrice: currentPrice,
        exitTime: new Date().toISOString(),
        profitLoss: position.type === 'long' 
          ? (currentPrice - position.entryPrice) * position.amount * position.leverage
          : (position.entryPrice - currentPrice) * position.amount * position.leverage
      };
      
      // Update local state
      const updatedPositions = [...positions];
      updatedPositions[positionIndex] = updatedPosition;
      setPositions(updatedPositions);
      
      // Notify parent if callback exists
      if (onPositionClosed) {
        onPositionClosed(updatedPosition);
      }
    }
  };
  
  // Handle updating a position
  const handleUpdatePosition = (updatedPosition: Position) => {
    const positionIndex = positions.findIndex(p => p.id === updatedPosition.id);
    
    if (positionIndex !== -1) {
      // Update local state
      const updatedPositions = [...positions];
      updatedPositions[positionIndex] = updatedPosition;
      setPositions(updatedPositions);
      
      // Notify parent if callback exists
      if (onPositionUpdated) {
        onPositionUpdated(updatedPosition);
      }
    }
  };
  
  // Toggle favorite symbols
  const toggleFavorite = (symbol: string) => {
    if (favoriteSymbols.includes(symbol)) {
      setFavoriteSymbols(favoriteSymbols.filter(s => s !== symbol));
    } else {
      setFavoriteSymbols([...favoriteSymbols, symbol]);
    }
  };
  
  // Filter symbols based on search query
  const filteredSymbols = searchQuery
    ? tradingPairs.filter(pair => 
        pair.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tradingPairs;
  
  // Function to get the display name for a symbol
  const getSymbolDisplayName = (symbolValue: string) => {
    const found = tradingPairs.find(pair => pair.value === symbolValue);
    return found ? found.label : symbolValue;
  };
  
  // Settings that will be passed to the TradingView widget
  const disabledFeatures = [
    'header_symbol_search',
    'header_indicators',
    'header_compare',
    'header_undo_redo',
    'header_saveload',
    'header_settings',
    ...(tvSettings.showVolume ? [] : ['volume']),
    ...(tvSettings.showGrid ? [] : ['grid']),
    ...(tvSettings.showDateRanges ? [] : ['timeframes_toolbar']),
    ...(tvSettings.autoScale ? [] : ['auto_scale_button']),
    ...(tvSettings.showWatermark ? [] : ['symbol_watermark']),
    ...(tvSettings.showBorders ? [] : ['border_around_the_chart']),
    ...(tvSettings.showLeftAxis ? [] : ['left_toolbar']),
    ...(tvSettings.showRightAxis ? [] : ['right_toolbar']),
  ];
  
  const enabledFeatures = [
    'study_templates',
    'use_localstorage_for_settings',
    'side_toolbar_in_fullscreen_mode',
    'show_trading_notifications_history',
  ];
  
  // List of TradingView indicators to be loaded when the chart is initialized
  const defaultStudies = [
    'MASimple@tv-basicstudies',
    'BB@tv-basicstudies',
    'MACD@tv-basicstudies',
  ];
  
  return (
    <div 
      className={`full-trading-environment ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
      style={{ height: isFullScreen ? '100vh' : '800px' }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b p-2">
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
              <ScrollArea className="h-[300px]">
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
                  <div className="space-y-1">
                    {filteredSymbols.map(pair => (
                      <div 
                        key={pair.value} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setSelectedSymbol(pair.value);
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
              </ScrollArea>
            </PopoverContent>
          </Popover>
          
          {/* Timeframe Selector */}
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
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
          <Select value={selectedChartStyle} onValueChange={setSelectedChartStyle}>
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
                    
                    <div className="p-2 border rounded-md hover:bg-muted cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Stochastic</span>
                        <Badge variant="outline">Stoch</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Compares closing price to price range over a period')}
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
                    
                    <div className="p-2 border rounded-md hover:bg-muted cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Money Flow Index</span>
                        <Badge variant="outline">MFI</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('Volume-weighted RSI that measures money flow')}
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
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-2 border rounded-md bg-muted flex justify-between items-center">
                    <span>Bollinger Bands (20, 2)</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-2 border rounded-md bg-muted flex justify-between items-center">
                    <span>MACD (12, 26, 9)</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <SheetFooter>
                <Button className="w-full">
                  {t('Apply')}
                </Button>
              </SheetFooter>
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
                      {t('Show Borders')}
                    </label>
                    <Switch 
                      checked={tvSettings.showBorders}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showBorders: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Left Axis')}
                    </label>
                    <Switch 
                      checked={tvSettings.showLeftAxis}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showLeftAxis: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('Show Right Axis')}
                    </label>
                    <Switch 
                      checked={tvSettings.showRightAxis}
                      onCheckedChange={(checked: boolean) => setTVSettings({...tvSettings, showRightAxis: checked})}
                    />
                  </div>
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="submit">{t('Apply Settings')}</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Current Price Indicator */}
          <Badge className="text-sm">
            {currentPrice.toFixed(2)}
          </Badge>
          
          {/* Alerts Button */}
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          
          {/* Fullscreen Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleFullScreen}>
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-12 h-[calc(100%-48px)]">
        {/* Chart Area */}
        <div className={`${showPositionsPanel ? 'col-span-9' : 'col-span-12'} h-full border-r relative`}>
          <EnhancedTradingViewWidget
            ref={tradingViewRef}
            symbol={selectedSymbol}
            interval={selectedTimeframe}
            theme="dark"
            style={selectedChartStyle}
            width="100%"
            height="100%"
            locale={i18n.language === 'he' ? 'he_IL' : 'en'}
            toolbar_bg="#1E1E1E"
            hide_side_toolbar={false}
            allow_symbol_change={false}
            save_image={true}
            studies={defaultStudies}
            disabled_features={disabledFeatures}
            enabled_features={enabledFeatures}
            debug={false}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>
        
        {/* Trading Panel */}
        {showPositionsPanel && (
          <div className="col-span-3 h-full overflow-auto">
            <ProTradingPanel
              currentPrice={currentPrice}
              symbol={getSymbolDisplayName(selectedSymbol)}
              positions={positions}
              onCreatePosition={handleCreatePosition}
              onClosePosition={handleClosePosition}
              onUpdatePosition={handleUpdatePosition}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FullTradingEnvironment;