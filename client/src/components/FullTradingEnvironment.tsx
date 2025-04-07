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
import {
  Maximize2,
  Minimize2,
  ChevronDown,
  Check,
  BarChart,
  Image,
  BrainCircuit,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  
  // Indices
  { value: 'AMEX:SPY', label: 'S&P 500 (SPY)' },
  { value: 'AMEX:QQQ', label: 'Nasdaq 100 (QQQ)' },
  { value: 'INDEX:DJI', label: 'Dow Jones (DJI)' },
  
  // Forex Pairs
  { value: 'FX:EURUSD', label: 'EUR/USD' },
  { value: 'FX:GBPUSD', label: 'GBP/USD' },
  { value: 'FX:USDJPY', label: 'USD/JPY' },
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
    // We'll manage these ourselves
    'header_symbol_search',
    'header_indicators',
    'header_compare'
  ];
  
  const enabledFeatures = [
    // Essential TradingView Pro features
    'study_templates',
    'use_localstorage_for_settings',
    'side_toolbar_in_fullscreen_mode',
    'show_trading_notifications_history',
    'header_settings',
    'header_screenshot',
    'create_volume_indicator_by_default',
    'header_undo_redo',
    'header_saveload',
    'display_market_status',
    'border_around_the_chart',
    'chart_crosshair_menu',
    'charts_auto_save',
    'seconds_resolution',
    'right_bar_stays_on_scroll',
    'symbol_info',
    'drawing_tools_on_chart',
    'go_to_date',
  ];
  
  // List of TradingView indicators to be loaded when the chart is initialized
  const defaultStudies = [
    'MASimple@tv-basicstudies',
    'MACD@tv-basicstudies',
    'RSI@tv-basicstudies',
  ];
  
  return (
    <div 
      className={`full-trading-environment ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
      style={{ height: isFullScreen ? '100vh' : '800px' }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-[#2a2e39] bg-[#1E222D] p-2">
        <div className="flex items-center space-x-3">
          {/* Symbol Selector */}
          <Popover open={showSymbolSearch} onOpenChange={setShowSymbolSearch}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-1 bg-[#131722] border-[#2a2e39] hover:bg-[#181B25] hover:border-[#363A45]">
                <span>{getSymbolDisplayName(selectedSymbol)}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#1E222D] border-[#2a2e39]" align="start">
              <div className="p-2 border-b border-[#2a2e39]">
                <Input
                  placeholder={t('Search symbols...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#131722] border-[#2a2e39]"
                  autoFocus
                />
              </div>
              <div className="max-h-[300px] overflow-auto">
                <div className="p-2">
                  <h4 className="text-sm font-medium mb-2 text-[#B2B5BE]">{t('Favorites')}</h4>
                  {favoriteSymbols.length > 0 ? (
                    <div className="space-y-1 mb-4">
                      {favoriteSymbols.map(symbol => {
                        const found = tradingPairs.find(pair => pair.value === symbol);
                        if (!found) return null;
                        
                        return (
                          <div 
                            key={symbol} 
                            className="flex items-center justify-between p-2 rounded-md hover:bg-[#131722] cursor-pointer"
                            onClick={() => {
                              setSelectedSymbol(found.value);
                              setShowSymbolSearch(false);
                            }}
                          >
                            <span className="text-white">{found.label}</span>
                            <button
                              className="text-yellow-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(symbol);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-[#6A6E78] mb-4">
                      {t('No favorite symbols added yet')}
                    </div>
                  )}
                  
                  <h4 className="text-sm font-medium mb-2 text-[#B2B5BE]">{t('All Symbols')}</h4>
                  <div className="space-y-1">
                    {filteredSymbols.map(pair => (
                      <div 
                        key={pair.value} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-[#131722] cursor-pointer"
                        onClick={() => {
                          setSelectedSymbol(pair.value);
                          setShowSymbolSearch(false);
                        }}
                      >
                        <span className="text-white">{pair.label}</span>
                        <button
                          className={`${favoriteSymbols.includes(pair.value) ? 'text-yellow-400' : 'text-[#6A6E78]'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pair.value);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Timeframe Selector */}
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[80px] bg-[#131722] border-[#2a2e39] hover:bg-[#181B25] hover:border-[#363A45]">
              <SelectValue placeholder={timeframes.find(tf => tf.value === selectedTimeframe)?.label || selectedTimeframe} />
            </SelectTrigger>
            <SelectContent className="bg-[#1E222D] border-[#2a2e39]">
              {timeframes.map(tf => (
                <SelectItem 
                  key={tf.value} 
                  value={tf.value}
                  className="hover:bg-[#131722]"
                >
                  {t(tf.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Chart Style Selector */}
          <Select value={selectedChartStyle} onValueChange={setSelectedChartStyle}>
            <SelectTrigger className="w-[100px] bg-[#131722] border-[#2a2e39] hover:bg-[#181B25] hover:border-[#363A45]">
              <SelectValue placeholder={chartStyles.find(s => s.value === selectedChartStyle)?.label || selectedChartStyle} />
            </SelectTrigger>
            <SelectContent className="bg-[#1E222D] border-[#2a2e39]">
              {chartStyles.map(style => (
                <SelectItem 
                  key={style.value} 
                  value={style.value}
                  className="hover:bg-[#131722]"
                >
                  {t(style.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Current Price Indicator */}
          <Badge variant="outline" className="text-sm bg-[#131722] border-[#2a2e39] text-white px-3 py-1">
            {currentPrice.toFixed(2)}
          </Badge>
          
          {/* Chart Analysis Button */}
          <Button variant="outline" size="sm" className="gap-1 bg-[#131722] border-[#2a2e39] hover:bg-[#181B25] hover:border-[#363A45]">
            <BarChart className="h-4 w-4" />
            <span>Analysis</span>
          </Button>
          
          {/* AI Wyckoff Coach Button */}
          <AIWyckoffCoach 
            tradingViewRef={tradingViewRef} 
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            onAnalysisComplete={(analysis: WyckoffAnalysisResult) => {
              console.log("Wyckoff analysis completed:", analysis);
            }}
          />

          {/* Chart Image Upload & Analysis */}
          <ChartImageUploader 
            onImageAnalysis={async (imageBase64, notes) => {
              try {
                const result = await aiService.analyzeChartImage(imageBase64, notes);
                return result;
              } catch (error) {
                console.error("Error analyzing chart image:", error);
                throw error;
              }
            }}
          />
          
          {/* Fullscreen Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFullScreen}
            className="bg-[#131722] border-[#2a2e39] hover:bg-[#181B25] hover:border-[#363A45]"
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-12 h-[calc(100%-48px)]">
        {/* Chart Area */}
        <div className={`${showPositionsPanel ? 'col-span-9' : 'col-span-12'} h-full relative`}>
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
          <div className="col-span-3 h-full overflow-hidden">
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