import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TradingViewSymbolSearch, type TradingViewSymbol } from './TradingViewSymbolSearch';
import { TradingViewIndicatorSelector, type TradingViewIndicator } from './TradingViewIndicatorSelector';
import { TradingViewReplayController } from './TradingViewReplayController';
import {
  BarChart2,
  Bookmark,
  ChevronDown,
  Clock,
  History,
  Maximize2,
  Minimize2,
  Pencil,
  Bell,
  Search,
  Settings,
  Crosshair,
  Trash2,
  Layout as LayoutIcon,
  Square,
  Circle,
  AlertTriangle,
  SplitSquareVertical,
  LineChart,
  CandlestickChart,
  BarChart
} from 'lucide-react';

// Interface for the widget props
interface ProTradingViewWidgetProps {
  initialSymbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  timezone?: string;
  includeWatchlist?: boolean;
  includeBottomToolbar?: boolean;
  onSymbolChange?: (symbol: string) => void;
  onIntervalChange?: (interval: string) => void;
  onReplayModeChange?: (isReplayMode: boolean) => void;
  isFullScreen?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  className?: string;
}

// Define interval options
const intervalOptions = [
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

// Define chart style options
const chartStyleOptions = [
  { value: '1', label: 'Candles', icon: <CandlestickChart className="h-4 w-4" /> },
  { value: '2', label: 'Bars', icon: <BarChart className="h-4 w-4" /> },
  { value: '3', label: 'Line', icon: <LineChart className="h-4 w-4" /> },
  { value: '4', label: 'Area', icon: <SplitSquareVertical className="h-4 w-4" /> },
];

export function ProTradingViewWidget({
  initialSymbol = 'BINANCE:BTCUSDT',
  interval = 'D',
  theme = 'dark',
  width = '100%',
  height = '600px',
  timezone = 'Etc/UTC',
  includeWatchlist = true,
  includeBottomToolbar = true,
  onSymbolChange,
  onIntervalChange,
  onReplayModeChange,
  isFullScreen = false,
  onFullScreenChange,
  className = ''
}: ProTradingViewWidgetProps) {
  const { t, i18n } = useTranslation();
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol);
  const [symbolDisplay, setSymbolDisplay] = useState('BTC/USDT');
  const [currentInterval, setCurrentInterval] = useState<string>(interval);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [currentChartStyle, setCurrentChartStyle] = useState<string>('1'); // Default to candles
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showIndicatorSelector, setShowIndicatorSelector] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA', 'VOLUME']);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tvScriptRef = useRef<HTMLScriptElement | null>(null);
  const widgetRef = useRef<any>(null);
  
  // Format the display symbol from the actual symbol
  useEffect(() => {
    // Parse the symbol for display
    const parts = currentSymbol.split(':');
    if (parts.length > 1) {
      const exchange = parts[0];
      const ticker = parts[1];
      
      // Special handling for crypto
      if (exchange === 'BINANCE') {
        if (ticker.endsWith('USDT')) {
          const base = ticker.slice(0, -4);
          setSymbolDisplay(`${base}/USDT`);
        } else if (ticker.endsWith('USD')) {
          const base = ticker.slice(0, -3);
          setSymbolDisplay(`${base}/USD`);
        } else {
          setSymbolDisplay(ticker);
        }
      } else {
        setSymbolDisplay(ticker);
      }
    } else {
      setSymbolDisplay(currentSymbol);
    }
  }, [currentSymbol]);
  
  // Initialize TradingView widget
  useEffect(() => {
    // Clean up any existing widget
    if (tvScriptRef.current && containerRef.current) {
      containerRef.current.innerHTML = '';
      document.head.removeChild(tvScriptRef.current);
      tvScriptRef.current = null;
    }
    
    if (!containerRef.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!containerRef.current) return;
      
      if (typeof window.TradingView !== 'undefined') {
        // Create new widget
        widgetRef.current = new window.TradingView.widget({
          container: containerRef.current,
          symbol: currentSymbol,
          interval: currentInterval,
          timezone,
          theme: theme,
          style: currentChartStyle,
          locale: i18n.language === 'he' ? 'he_IL' : 'en',
          toolbar_bg: '#131722',
          enable_publishing: false,
          allow_symbol_change: false,
          save_image: true,
          studies: ['MASimple@tv-basicstudies', 'Volume@tv-basicstudies'],
          disabled_features: [
            'header_symbol_search',
            'header_indicators',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'header_saveload',
            'use_localstorage_for_settings',
            'timeframes_toolbar',
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode',
            'show_trading_notifications_history',
            'header_settings',
            'create_volume_indicator_by_default',
            'display_market_status',
            'border_around_the_chart',
            'chart_crosshair_menu',
            'charts_auto_save',
            'seconds_resolution',
            'right_bar_stays_on_scroll',
            'symbol_info',
            'drawing_tools_on_chart',
          ],
          fullscreen: false,
          autosize: true,
          loading_screen: { backgroundColor: "#131722", foregroundColor: "#2962FF" },
          overrides: {
            "mainSeriesProperties.style": parseInt(currentChartStyle),
            "mainSeriesProperties.candleStyle.upColor": "#089981",
            "mainSeriesProperties.candleStyle.downColor": "#F23645",
            "mainSeriesProperties.candleStyle.borderUpColor": "#089981",
            "mainSeriesProperties.candleStyle.borderDownColor": "#F23645",
            "mainSeriesProperties.candleStyle.wickUpColor": "#089981",
            "mainSeriesProperties.candleStyle.wickDownColor": "#F23645",
          },
          time_frames: [
            { text: "1D", resolution: "D", description: "1 Day" },
            { text: "5D", resolution: "D", description: "5 Days" },
            { text: "1M", resolution: "D", description: "1 Month" },
            { text: "3M", resolution: "W", description: "3 Months" },
            { text: "6M", resolution: "W", description: "6 Months" },
            { text: "YTD", resolution: "D", description: "Year to Date" },
            { text: "1Y", resolution: "W", description: "1 Year" },
            { text: "5Y", resolution: "M", description: "5 Years" },
            { text: "ALL", resolution: "M", description: "All Time" },
          ],
        });
        
        // Add event listener for symbol change
        widgetRef.current.onChartReady(() => {
          const chart = widgetRef.current.chart();
          
          // Subscribe to symbol change
          chart.onSymbolChanged().subscribe(null, (symbolInfo: any) => {
            const newSymbol = symbolInfo.full_name;
            setCurrentSymbol(newSymbol);
            if (onSymbolChange) {
              onSymbolChange(newSymbol);
            }
          });
          
          // Subscribe to interval change
          chart.onIntervalChanged().subscribe(null, (interval: string) => {
            setCurrentInterval(interval);
            if (onIntervalChange) {
              onIntervalChange(interval);
            }
          });
          
          // Setup periodic price updates
          setInterval(() => {
            try {
              const symbol = chart.symbol();
              const lastPrice = parseFloat(chart.lastPrice(symbol));
              if (!isNaN(lastPrice)) {
                setCurrentPrice(lastPrice);
              }
            } catch (err) {
              console.error('Error getting price:', err);
            }
          }, 1000);
          
          // Add active indicators
          activeIndicators.forEach(indicatorId => {
            const indicator = indicatorsData.find(ind => ind.id === indicatorId);
            if (indicator && indicator.scriptName) {
              chart.createStudy(indicator.scriptName, false, false);
            }
          });
        });
      }
    };
    
    // Add script to document
    document.head.appendChild(script);
    tvScriptRef.current = script;
    
    // Clean up
    return () => {
      if (tvScriptRef.current) {
        document.head.removeChild(tvScriptRef.current);
      }
    };
  }, [currentSymbol, currentInterval, currentChartStyle, theme, i18n.language, timezone, activeIndicators]);
  
  // Handle replay mode changes
  useEffect(() => {
    if (onReplayModeChange) {
      onReplayModeChange(isReplayMode);
    }
  }, [isReplayMode, onReplayModeChange]);
  
  // Handle symbol selection from search
  const handleSymbolSelect = (symbol: TradingViewSymbol) => {
    // Format the symbol for TradingView
    let formattedSymbol = symbol.symbol;
    
    if (symbol.fullName) {
      formattedSymbol = symbol.fullName;
    } else if (symbol.exchange) {
      formattedSymbol = `${symbol.exchange}:${symbol.symbol}`;
    }
    
    setCurrentSymbol(formattedSymbol);
    if (onSymbolChange) {
      onSymbolChange(formattedSymbol);
    }
    
    // If we have a widget, update it directly
    if (widgetRef.current) {
      const chart = widgetRef.current.chart();
      chart.setSymbol(formattedSymbol);
    }
  };
  
  // Handle indicator selection
  const handleIndicatorSelect = (indicator: TradingViewIndicator) => {
    // Add indicator to active list if not already there
    if (!activeIndicators.includes(indicator.id)) {
      setActiveIndicators([...activeIndicators, indicator.id]);
      
      // Add to chart if widget is ready
      if (widgetRef.current && indicator.scriptName) {
        const chart = widgetRef.current.chart();
        chart.createStudy(indicator.scriptName, false, false);
      }
    }
  };
  
  // Handle replay mode toggle
  const toggleReplayMode = () => {
    setIsReplayMode(!isReplayMode);
  };
  
  // Handle full screen toggle
  const toggleFullScreen = () => {
    if (onFullScreenChange) {
      onFullScreenChange(!isFullScreen);
    }
  };
  
  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setCurrentInterval(newInterval);
    if (onIntervalChange) {
      onIntervalChange(newInterval);
    }
    
    // If we have a widget, update it directly
    if (widgetRef.current) {
      const chart = widgetRef.current.chart();
      chart.setResolution(newInterval);
    }
  };
  
  // Handle chart style change
  const handleChartStyleChange = (style: string) => {
    setCurrentChartStyle(style);
    
    // If we have a widget, update it directly
    if (widgetRef.current) {
      const chart = widgetRef.current.chart();
      chart.setChartType(parseInt(style));
    }
  };
  
  // List of common indicators for the data
  const indicatorsData: TradingViewIndicator[] = [
    { id: 'MA', name: 'Moving Average', description: 'Moving average helps identify trend direction', category: 'trend', scriptName: 'MASimple@tv-basicstudies' },
    { id: 'EMA', name: 'Exponential Moving Average', description: 'EMA places more weight on recent price data', category: 'trend', scriptName: 'MAExp@tv-basicstudies' },
    { id: 'VOLUME', name: 'Volume', description: 'Shows trading volume', category: 'volume', scriptName: 'Volume@tv-basicstudies' },
    { id: 'RSI', name: 'Relative Strength Index', description: 'Momentum oscillator measuring overbought and oversold levels', category: 'oscillator', scriptName: 'RSI@tv-basicstudies' },
    { id: 'MACD', name: 'Moving Average Convergence/Divergence', description: 'Trend-following momentum indicator', category: 'oscillator', scriptName: 'MACD@tv-basicstudies' },
    { id: 'BB', name: 'Bollinger Bands', description: 'Volatility bands placed above and below a moving average', category: 'trend', scriptName: 'BB@tv-basicstudies' },
  ];
  
  // Active drawing tools
  const drawingTools = [
    { id: 'crosshair', name: 'Crosshair', icon: <Crosshair className="h-4 w-4" /> },
    { id: 'line', name: 'Line', icon: <Pencil className="h-4 w-4" /> },
    { id: 'rectangle', name: 'Rectangle', icon: <Square className="h-4 w-4" /> },
    { id: 'circle', name: 'Circle', icon: <Circle className="h-4 w-4" /> },
    { id: 'trend', name: 'Trend Line', icon: <LineChart className="h-4 w-4" /> },
  ];
  
  return (
    <div 
      className={`pro-trading-view-widget relative h-full flex flex-col bg-[#131722] border border-[#2A2E39] overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-[#2A2E39] px-2 py-1 h-9 flex-shrink-0">
        <div className="flex items-center space-x-2">
          {/* Symbol Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 flex items-center space-x-1 text-white hover:bg-[#2A2E39]"
            onClick={() => setShowSymbolSearch(true)}
          >
            <span className="font-medium">{symbolDisplay}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {/* Intervals */}
          <div className="flex items-center border border-[#2A2E39] rounded-sm overflow-hidden h-7">
            {intervalOptions.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className={`h-7 px-2 py-0 rounded-none ${
                  currentInterval === option.value
                    ? "bg-[#2962FF] text-white"
                    : "text-[#9598A1] hover:bg-[#2A2E39]"
                }`}
                onClick={() => handleIntervalChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* Chart Style */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[#9598A1] hover:bg-[#2A2E39]"
                  onClick={() => {
                    // Toggle through chart styles
                    const currentIndex = chartStyleOptions.findIndex(opt => opt.value === currentChartStyle);
                    const nextIndex = (currentIndex + 1) % chartStyleOptions.length;
                    handleChartStyleChange(chartStyleOptions[nextIndex].value);
                  }}
                >
                  {chartStyleOptions.find(opt => opt.value === currentChartStyle)?.icon || <CandlestickChart className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chart Style</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Indicators */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[#9598A1] hover:bg-[#2A2E39] flex items-center space-x-1"
                  onClick={() => setShowIndicatorSelector(true)}
                >
                  <BarChart2 className="h-4 w-4" />
                  <span>Indicators</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Indicators</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Alert */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[#9598A1] hover:bg-[#2A2E39]"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Alert</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Replay */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 ${isReplayMode ? "text-[#2962FF]" : "text-[#9598A1]"} hover:bg-[#2A2E39] flex items-center space-x-1`}
                  onClick={toggleReplayMode}
                >
                  <History className="h-4 w-4" />
                  <span>Replay</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Replay Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Current Price */}
          <div className="text-white text-sm font-medium">
            {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
          </div>
          
          {/* Settings */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-[#9598A1] hover:bg-[#2A2E39]"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Full Screen */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-[#9598A1] hover:bg-[#2A2E39]"
                  onClick={toggleFullScreen}
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Main Chart Container */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Toolbar - Drawing Tools */}
        <div className="border-r border-[#2A2E39] bg-[#131722] w-8 py-1">
          <TooltipProvider>
            <div className="flex flex-col space-y-1">
              {drawingTools.map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-8 h-8 p-0 rounded-none ${
                        activeDrawingTool === tool.id ? "bg-[#2A2E39]" : ""
                      }`}
                      onClick={() => setActiveDrawingTool(tool.id === activeDrawingTool ? null : tool.id)}
                    >
                      {tool.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{tool.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              
              {/* More tools section */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-none"
                    onClick={() => setShowDrawingTools(prev => !prev)}
                  >
                    <ChevronDown className="h-4 w-4 text-[#9598A1]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>More Tools</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Clear Drawing Tools */}
              <div className="mt-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 rounded-none"
                    >
                      <Trash2 className="h-4 w-4 text-[#9598A1]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Remove Drawings</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
        
        {/* Main Chart */}
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className="trading-view-container w-full h-full overflow-hidden"
          />
        </div>
      </div>
      
      {/* Bottom Toolbar */}
      {includeBottomToolbar && (
        <div className="border-t border-[#2A2E39] px-2 py-1 h-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-[#9598A1] text-xs">
            <Clock className="h-3 w-3" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-[#9598A1] hover:bg-[#2A2E39]"
            >
              <LayoutIcon className="h-3 w-3 mr-1" />
              <span>Layout</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-[#9598A1] hover:bg-[#2A2E39]"
            >
              <Bookmark className="h-3 w-3 mr-1" />
              <span>Save</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Symbol Search Modal */}
      <TradingViewSymbolSearch
        isOpen={showSymbolSearch}
        onClose={() => setShowSymbolSearch(false)}
        onSymbolSelect={handleSymbolSelect}
      />
      
      {/* Indicator Selector Modal */}
      <TradingViewIndicatorSelector
        isOpen={showIndicatorSelector}
        onClose={() => setShowIndicatorSelector(false)}
        onIndicatorSelect={handleIndicatorSelect}
        activeIndicators={activeIndicators}
      />
      
      {/* Replay Controller */}
      <TradingViewReplayController
        isActive={isReplayMode}
        onToggleReplay={toggleReplayMode}
        symbol={symbolDisplay}
        onDateChange={(date) => {
          console.log('Replay date changed:', date);
          // Here you would implement the actual replay date change in the widget
          // This requires TradingView's Professional paid API
        }}
      />
    </div>
  );
}

// Add window interface for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}

export default ProTradingViewWidget;