import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TradingViewWidget } from './TradingViewWidget';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Position } from '@/types/trading';
import { 
  ArrowLeft, 
  Minimize2, 
  Maximize2, 
  Settings, 
  History, 
  LineChart, 
  AreaChart,
  CandlestickChart,
  BarChart,
  PanelTop, 
  PanelBottom,
  Bell,
  ChevronDown,
  Search,
  Star,
  BookMarked,
  TrendingUp,
  Play
} from 'lucide-react';

interface ProTradingViewIntegrationProps {
  symbol: string;
  initialPositions?: Position[];
  onPositionCreated?: (position: Position) => void;
  onPositionClosed?: (position: Position) => void;
  onPositionModified?: (position: Position) => void;
  fullScreen?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  onClose?: () => void;
  className?: string;
  height?: string | number;
}

/**
 * Professional TradingView Integration Component
 * 
 * This component provides a full-featured TradingView Pro experience
 * with additional functionality specific to our backtesting platform
 */
export function ProTradingViewIntegration({
  symbol,
  initialPositions = [],
  onPositionCreated,
  onPositionClosed,
  onPositionModified,
  fullScreen = false,
  onFullScreenChange,
  onClose,
  className = '',
  height = '600px'
}: ProTradingViewIntegrationProps) {
  const { t } = useTranslation();
  const [selectedInterval, setSelectedInterval] = useState('1D');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('dark');
  const [selectedStyle, setSelectedStyle] = useState<'1' | '2' | '3' | '4'>('1');
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [showStudiesPanel, setShowStudiesPanel] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // Map symbol to TradingView format
  const formatSymbol = (sym: string): string => {
    // Handle crypto pairs (e.g., BTC/USD -> BINANCE:BTCUSD)
    if (sym.includes('/')) {
      const [base, quote] = sym.split('/');
      return `BINANCE:${base}${quote}`;
    }
    
    // Handle stock symbols (e.g., AAPL -> NASDAQ:AAPL)
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA'].includes(sym)) {
      return `NASDAQ:${sym}`;
    }
    
    // Handle indices
    if (sym === 'SPY') {
      return 'AMEX:SPY';  // S&P 500 ETF
    }
    
    // Default return the symbol as is
    return sym;
  };
  
  // Handle position creation from TradingView
  const handlePositionCreated = (newPosition: Position) => {
    setPositions(prev => [...prev, newPosition]);
    if (onPositionCreated) {
      onPositionCreated(newPosition);
    }
  };
  
  // Handle position closing
  const handlePositionClosed = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (position) {
      const updatedPosition = {
        ...position,
        status: 'closed' as const,
        exitTime: new Date().toISOString(),
        exitPrice: 0, // This will be updated with the actual price
      };
      
      setPositions(prev => 
        prev.map(p => p.id === positionId ? updatedPosition : p)
      );
      
      if (onPositionClosed) {
        onPositionClosed(updatedPosition);
      }
    }
  };
  
  // Toggle fullscreen with browser API
  const toggleFullScreen = () => {
    const elem = document.documentElement;
    
    // Define a type for browsers with vendor prefixes
    type HTMLElementWithFullscreen = HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    
    type DocumentWithFullscreen = Document & {
      webkitFullscreenElement?: Element;
      msFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };
    
    const docWithPrefix = document as DocumentWithFullscreen;
    const elemWithPrefix = elem as HTMLElementWithFullscreen;
    
    if (!docWithPrefix.fullscreenElement && 
        !docWithPrefix.webkitFullscreenElement && 
        !docWithPrefix.msFullscreenElement) {
      // Enter fullscreen
      if (elemWithPrefix.requestFullscreen) {
        elemWithPrefix.requestFullscreen();
      } else if (elemWithPrefix.webkitRequestFullscreen) { /* Safari */
        elemWithPrefix.webkitRequestFullscreen();
      } else if (elemWithPrefix.msRequestFullscreen) { /* IE11 */
        elemWithPrefix.msRequestFullscreen();
      }
      
      if (onFullScreenChange) {
        onFullScreenChange(true);
      }
    } else {
      // Exit fullscreen
      if (docWithPrefix.exitFullscreen) {
        docWithPrefix.exitFullscreen();
      } else if (docWithPrefix.webkitExitFullscreen) { /* Safari */
        docWithPrefix.webkitExitFullscreen();
      } else if (docWithPrefix.msExitFullscreen) { /* IE11 */
        docWithPrefix.msExitFullscreen();
      }
      
      if (onFullScreenChange) {
        onFullScreenChange(false);
      }
    }
  };
  
  // Listen for fullscreen change events
  useEffect(() => {
    // Using the same cross-browser type definition
    type DocumentWithFullscreen = Document & {
      webkitFullscreenElement?: Element;
      msFullscreenElement?: Element;
      mozFullscreenElement?: Element;
    };
    
    const handleFullscreenChange = () => {
      const doc = document as DocumentWithFullscreen;
      const isFullScreenNow = !!(
        doc.fullscreenElement || 
        doc.webkitFullscreenElement || 
        doc.msFullscreenElement || 
        doc.mozFullscreenElement
      );
      
      if (onFullScreenChange && isFullScreenNow !== fullScreen) {
        onFullScreenChange(isFullScreenNow);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [fullScreen, onFullScreenChange]);
  
  // Available timeframes
  const intervals = [
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
    { id: '1', name: t('Candles'), icon: <CandlestickChart size={16} /> },
    { id: '2', name: t('Bars'), icon: <BarChart size={16} /> },
    { id: '3', name: t('Line'), icon: <LineChart size={16} /> },
    { id: '4', name: t('Area'), icon: <AreaChart size={16} /> },
  ];
  
  // All available indicators for trading
  const allIndicators = [
    { id: 'MASimple@tv-basicstudies', name: 'Moving Average', category: 'trend' },
    { id: 'MAExp@tv-basicstudies', name: 'EMA', category: 'trend' },
    { id: 'MAWeighted@tv-basicstudies', name: 'WMA', category: 'trend' },
    { id: 'RSI@tv-basicstudies', name: 'RSI', category: 'momentum' },
    { id: 'MACD@tv-basicstudies', name: 'MACD', category: 'momentum' },
    { id: 'BB@tv-basicstudies', name: 'Bollinger Bands', category: 'volatility' },
    { id: 'Stochastic@tv-basicstudies', name: 'Stochastic', category: 'momentum' },
    { id: 'StochasticRSI@tv-basicstudies', name: 'Stochastic RSI', category: 'momentum' },
    { id: 'IchimokuCloud@tv-basicstudies', name: 'Ichimoku Cloud', category: 'trend' },
    { id: 'ADX@tv-basicstudies', name: 'ADX', category: 'trend' },
    { id: 'ATR@tv-basicstudies', name: 'ATR', category: 'volatility' },
    { id: 'OBV@tv-basicstudies', name: 'On Balance Volume', category: 'volume' },
    { id: 'MFI@tv-basicstudies', name: 'Money Flow Index', category: 'volume' },
    { id: 'CCI@tv-basicstudies', name: 'CCI', category: 'momentum' },
    { id: 'WilliamsR@tv-basicstudies', name: 'Williams %R', category: 'momentum' },
    { id: 'HV@tv-basicstudies', name: 'Historical Volatility', category: 'volatility' },
    { id: 'VWAP@tv-basicstudies', name: 'VWAP', category: 'trend' },
    { id: 'ZigZag@tv-basicstudies', name: 'Zig Zag', category: 'pattern' },
    { id: 'PSAR@tv-basicstudies', name: 'Parabolic SAR', category: 'trend' },
    { id: 'SuperTrend@tv-basicstudies', name: 'SuperTrend', category: 'trend' },
    { id: 'Pivot@tv-basicstudies', name: 'Pivot Points', category: 'levels' },
    { id: 'Volume@tv-basicstudies', name: 'Volume', category: 'volume' },
    { id: 'VolumeProfile@tv-basicstudies', name: 'Volume Profile', category: 'volume' },
    { id: 'Fibonacci@tv-basicstudies', name: 'Fibonacci Retracement', category: 'fibonacci' }
  ];
  
  // Selected indicators
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    'MASimple@tv-basicstudies',
    'RSI@tv-basicstudies',
    'MACD@tv-basicstudies',
    'BB@tv-basicstudies'
  ]);
  
  // Indicator search
  const [indicatorSearch, setIndicatorSearch] = useState('');
  
  // Filtered indicators based on search
  const filteredIndicators = indicatorSearch 
    ? allIndicators.filter(ind => 
        ind.name.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
        ind.category.toLowerCase().includes(indicatorSearch.toLowerCase())
      )
    : allIndicators;
  
  // Disabled features to customize the TradingView widget
  const disabledFeatures = [
    'header_symbol_search',
    'header_indicators',
    'header_compare',
    'header_undo_redo',
    'header_saveload',
    'header_settings'
  ];
  
  // Enabled features for trading functionality
  const enabledFeatures = [
    'study_templates',
    'use_localstorage_for_settings',
    'side_toolbar_in_fullscreen_mode',
    'show_trading_notifications_history'
  ];
  
  // State for alert dialog
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  // State for indicators dialog - separate from the sidebar panel
  const [indicatorsDialogOpen, setIndicatorsDialogOpen] = useState(false);
  // State for replay dialog
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  
  // Alert settings
  const [alertSettings, setAlertSettings] = useState({
    condition: 'price_crosses',
    value: '',
    frequency: 'once',
    notification: 'sound',
    expiration: '1d',
  });
  
  // Alert conditions based on TradingView
  const alertConditions = [
    { value: 'price_crosses', label: t('Price Crosses') },
    { value: 'price_greater', label: t('Price Rises Above') },
    { value: 'price_less', label: t('Price Falls Below') },
    { value: 'moving_avg_cross', label: t('Moving Average Cross') },
    { value: 'vol_greater', label: t('Volume Greater Than') },
    { value: 'high_low', label: t('New High/Low') },
  ];
  
  return (
    <div className={`pro-tradingview-integration ${fullScreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
         style={{ height: fullScreen ? '100vh' : height }}
    >
      <div className="flex flex-col h-full">
        {/* Trading Chart Header */}
        <div className="flex items-center justify-between p-2 bg-card border-b">
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('Back')}
              </Button>
            )}
            
            <div className="font-medium">{symbol}</div>
            
            <Select value={selectedInterval} onValueChange={setSelectedInterval}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={selectedInterval} />
              </SelectTrigger>
              <SelectContent>
                {intervals.map(interval => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-md">
              {chartStyles.map(style => (
                <Button
                  key={style.id}
                  variant={selectedStyle === style.id ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSelectedStyle(style.id as '1' | '2' | '3' | '4')}
                  title={style.name}
                >
                  {style.icon}
                </Button>
              ))}
            </div>
            
            {/* TradingView-style Indicators Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setIndicatorsDialogOpen(true)}
            >
              <LineChart className="h-4 w-4" />
              {t('Indicators')}
              <ChevronDown className="h-3 w-3" />
            </Button>
            

          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowStudiesPanel(!showStudiesPanel)} title={t('Studies Panel')}>
              <PanelTop className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={() => setReplayDialogOpen(true)} 
              title={t('Replay Mode')}
            >
              <Play className="h-4 w-4 mr-1" />
              {t('Replay')}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setShowInfo(!showInfo)} title={t('Information')}>
              <PanelBottom className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
              onClick={toggleFullScreen} 
              title={fullScreen ? t('Exit Full Screen') : t('Full Screen')}
            >
              {fullScreen ? <Minimize2 className="h-4 w-4 mr-1" /> : <Maximize2 className="h-4 w-4 mr-1" />}
              {fullScreen ? t('Exit Full Screen') : t('Full Screen')}
            </Button>
            
            <div className="flex items-center ml-2">
              <Switch
                id="theme-switch"
                checked={selectedTheme === 'dark'}
                onCheckedChange={checked => setSelectedTheme(checked ? 'dark' : 'light')}
              />
              <Label htmlFor="theme-switch" className="ml-2">
                {selectedTheme === 'dark' ? t('Dark') : t('Light')}
              </Label>
            </div>
          </div>
        </div>
        
        {/* Main Chart Area with indicators panel */}
        <div className="flex-grow relative flex">
          {/* Indicators Panel (optional) */}
          {showStudiesPanel && (
            <div className="w-64 bg-card border-r overflow-y-auto flex flex-col h-full">
              <div className="p-3 border-b">
                <h3 className="font-medium mb-2">{t('Indicators')}</h3>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder={t('Search indicators...')}
                    value={indicatorSearch}
                    onChange={(e) => setIndicatorSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto">
                {filteredIndicators.map(indicator => (
                  <div key={indicator.id} className="px-3 py-1.5 border-b hover:bg-accent/50 flex items-center">
                    <input
                      type="checkbox"
                      id={`indicator-${indicator.id}`}
                      checked={selectedIndicators.includes(indicator.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIndicators([...selectedIndicators, indicator.id]);
                        } else {
                          setSelectedIndicators(selectedIndicators.filter(id => id !== indicator.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`indicator-${indicator.id}`} className="ml-2 block text-sm">
                      {indicator.name}
                    </label>
                    <span className="ml-auto text-xs text-muted-foreground rounded-full px-2 py-0.5 bg-muted">
                      {indicator.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Main Chart */}
          <div className="flex-grow">
            <TradingViewWidget
              symbol={formatSymbol(symbol)}
              interval={selectedInterval}
              theme={selectedTheme}
              style={selectedStyle}
              toolbar_bg="#1c3d86"
              hide_side_toolbar={false}
              studies={selectedIndicators}
              autosize={true}
              save_image={true}
              disabled_features={disabledFeatures}
              enabled_features={enabledFeatures}
              width="100%"
              height="100%"
            />
          </div>
        </div>
        
        {/* Position Information Panel (optional) */}
        {showInfo && positions.length > 0 && (
          <div className="border-t bg-card p-2">
            <Tabs defaultValue="positions">
              <TabsList>
                <TabsTrigger value="positions">{t('Positions')}</TabsTrigger>
                <TabsTrigger value="history">{t('History')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="positions" className="max-h-32 overflow-auto">
                <div className="text-sm">
                  {positions.filter(p => p.status === 'active').map(position => (
                    <div key={position.id} className="flex justify-between items-center py-1 border-b">
                      <div>
                        <span className={position.type === 'long' ? 'text-green-500' : 'text-red-500'}>
                          {position.type === 'long' ? t('Long') : t('Short')}
                        </span>
                        <span className="ml-2">{symbol}</span>
                      </div>
                      <div>
                        {t('Entry')}: {position.entryPrice}
                      </div>
                      <div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handlePositionClosed(position.id)}
                        >
                          {t('Close')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="max-h-32 overflow-auto">
                <div className="text-sm">
                  {positions.filter(p => p.status === 'closed').map(position => (
                    <div key={position.id} className="flex justify-between items-center py-1 border-b">
                      <div>
                        <span className={position.type === 'long' ? 'text-green-500' : 'text-red-500'}>
                          {position.type === 'long' ? t('Long') : t('Short')}
                        </span>
                        <span className="ml-2">{symbol}</span>
                      </div>
                      <div>
                        {t('P/L')}: 
                        <span className={(position.profitLoss || 0) >= 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                          {(position.profitLoss || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Indicators Dialog */}
        <Dialog open={indicatorsDialogOpen} onOpenChange={setIndicatorsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('Indicators')}</DialogTitle>
              <DialogDescription>
                {t('Add technical indicators to your chart')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center py-4">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search indicators...')}
                  className="pl-8"
                  value={indicatorSearch}
                  onChange={(e) => setIndicatorSearch(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-0.5">
                {filteredIndicators.map(indicator => (
                  <div 
                    key={indicator.id} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => {
                      if (selectedIndicators.includes(indicator.id)) {
                        setSelectedIndicators(selectedIndicators.filter(id => id !== indicator.id));
                      } else {
                        setSelectedIndicators([...selectedIndicators, indicator.id]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 flex items-center justify-center rounded-sm border ${selectedIndicators.includes(indicator.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                        {selectedIndicators.includes(indicator.id) && <TrendingUp className="h-3 w-3" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{indicator.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{indicator.category}</span>
                      </div>
                    </div>
                    {selectedIndicators.includes(indicator.id) && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <DialogFooter className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedIndicators.length} {t('indicators selected')}
              </div>
              <Button type="submit" onClick={() => setIndicatorsDialogOpen(false)}>
                {t('Apply')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Replay Mode Dialog */}
        <Dialog open={replayDialogOpen} onOpenChange={setReplayDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('Start Replay Session')}</DialogTitle>
              <DialogDescription>
                {t('Choose a time range to replay market data for')} {symbol}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="preset" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">{t('Preset Ranges')}</TabsTrigger>
                <TabsTrigger value="custom">{t('Custom Range')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preset" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Last 7 days
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 7);
                      // Handle replay start
                    }}
                  >
                    {t('Last 7 Days')}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Last 30 days
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 30);
                      // Handle replay start
                    }}
                  >
                    {t('Last 30 Days')}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Last 3 months
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(end.getMonth() - 3);
                      // Handle replay start
                    }}
                  >
                    {t('Last 3 Months')}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Last year
                      const end = new Date();
                      const start = new Date();
                      start.setFullYear(end.getFullYear() - 1);
                      // Handle replay start
                    }}
                  >
                    {t('Last Year')}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">{t('Start Date')}</h4>
                    <Calendar
                      mode="single"
                      selected={new Date(new Date().setMonth(new Date().getMonth() - 3))}
                      onSelect={(date) => {
                        // Handle start date selection
                      }}
                      disabled={(date) => date > new Date()}
                    />
                  </div>
                  
                  <div>
                    <h4 className="mb-2 text-sm font-medium">{t('End Date')}</h4>
                    <Calendar
                      mode="single"
                      selected={new Date()}
                      onSelect={(date) => {
                        // Handle end date selection
                      }}
                      disabled={(date) => date > new Date()}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setReplayDialogOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button 
                onClick={() => {
                  // Start replay mode here
                  setReplayDialogOpen(false);
                  
                  // Open TimeController dialog or switch to replay mode
                  // This would typically navigate to a replay interface
                  window.location.href = '/replay?symbol=' + encodeURIComponent(symbol);
                }} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <Play className="h-4 w-4 mr-2" />
                {t('Start Replay')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ProTradingViewIntegration;