import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EnhancedTradingViewWidget, { TradingViewRef } from './EnhancedTradingViewWidget';
import { ProTradingViewPanel } from './ProTradingViewPanel';
import { AIWyckoffCoach } from './AIWyckoffCoach';
import { ChartImageUploader } from './ChartImageUploader';
import { Position, WyckoffAnalysisResult } from '@/types/trading';
import aiService from '@/services/aiService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Maximize2,
  Minimize2,
  ChevronDown,
  Bell,
} from 'lucide-react';

// Available trading pairs
const tradingPairs = [
  // Cryptocurrencies
  { value: 'BINANCE:BTCUSDT', label: 'Bitcoin (BTC/USDT)' },
  { value: 'BINANCE:ETHUSDT', label: 'Ethereum (ETH/USDT)' },
  { value: 'BINANCE:SOLUSDT', label: 'Solana (SOL/USDT)' },
  { value: 'BINANCE:BNBUSDT', label: 'Binance Coin (BNB/USDT)' },
  { value: 'BINANCE:ADAUSDT', label: 'Cardano (ADA/USDT)' },
  
  // Stocks - Major Tech
  { value: 'NASDAQ:AAPL', label: 'Apple (AAPL)' },
  { value: 'NASDAQ:MSFT', label: 'Microsoft (MSFT)' },
  { value: 'NASDAQ:GOOGL', label: 'Google (GOOGL)' },
  { value: 'NASDAQ:AMZN', label: 'Amazon (AMZN)' },
  { value: 'NASDAQ:META', label: 'Meta (META)' },
  
  // Indices
  { value: 'AMEX:SPY', label: 'S&P 500 (SPY)' },
  { value: 'AMEX:QQQ', label: 'Nasdaq 100 (QQQ)' },
  { value: 'INDEX:DJI', label: 'Dow Jones (DJI)' },
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
    'header_settings'
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
                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => {
                              setSelectedSymbol(found.value);
                              setShowSymbolSearch(false);
                            }}
                          >
                            <span>{found.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-4">
                      {t('No favorite symbols added yet')}
                    </div>
                  )}
                  
                  <h4 className="text-sm font-medium mb-2">{t('All Symbols')}</h4>
                  <div className="space-y-1">
                    {filteredSymbols.map(pair => (
                      <div 
                        key={pair.value} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setSelectedSymbol(pair.value);
                          setShowSymbolSearch(false);
                        }}
                      >
                        <span>{pair.label}</span>
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
              <SelectValue placeholder={selectedTimeframe} />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map(tf => (
                <SelectItem key={tf.value} value={tf.value}>
                  {t(tf.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Chart Style Selector */}
          <Select value={selectedChartStyle} onValueChange={setSelectedChartStyle}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={chartStyles.find(s => s.value === selectedChartStyle)?.label || selectedChartStyle} />
            </SelectTrigger>
            <SelectContent>
              {chartStyles.map(style => (
                <SelectItem key={style.value} value={style.value}>
                  {t(style.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Indicators Button removed - TradingView already provides indicators */}
          
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
          
          {/* AI Wyckoff Coach Button */}
          <Dialog>
            <AIWyckoffCoach 
              tradingViewRef={tradingViewRef} 
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
              onAnalysisComplete={(analysis: WyckoffAnalysisResult) => {
                console.log("Wyckoff analysis completed:", analysis);
                // You could save analysis to state or perform other actions
              }}
            />
          </Dialog>

          {/* Chart Image Upload & Analysis */}
          <ChartImageUploader 
            onImageAnalysis={async (imageBase64, notes) => {
              try {
                // Call the AI service to analyze the chart image
                const result = await aiService.analyzeChartImage(imageBase64, notes);
                console.log("Chart image analysis completed:", result);
                return result;
              } catch (error) {
                console.error("Error analyzing chart image:", error);
                throw error;
              }
            }}
          />
          
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
            <ProTradingViewPanel
              currentPrice={currentPrice}
              symbol={getSymbolDisplayName(selectedSymbol)}
              onOrderSubmit={handleCreatePosition}
              accountBalance={150000}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FullTradingEnvironment;