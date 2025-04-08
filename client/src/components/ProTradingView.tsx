import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define interface for TradingView widget
export interface TradingViewRef {
  widget: any;
  toggleReplayMode: () => void;
  isInReplayMode: () => boolean;
  captureChartImage: () => Promise<string>;
}

interface ProTradingViewProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  locale?: string;
  toolbar_bg?: string;
  style?: string;
  timezone?: string;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  save_image?: boolean;
  width?: string | number;
  height?: string | number;
  studies?: string[];
  disabled_features?: string[];
  enabled_features?: string[];
  debug?: boolean;
  onPriceUpdate?: (price: number) => void;
  onChartReady?: () => void;
  onReplayModeChange?: (isInReplayMode: boolean) => void;
}

// Create the TradingView component with forwarded ref for parent access
const ProTradingView = forwardRef<TradingViewRef, ProTradingViewProps>((props, ref) => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tradingViewWidget, setTradingViewWidget] = useState<any>(null);
  const [isInReplayMode, setIsInReplayMode] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState(props.interval || '1D');
  const [replayControlsVisible, setReplayControlsVisible] = useState(false);
  const [layoutsDialogOpen, setLayoutsDialogOpen] = useState(false);
  const [indicatorsDialogOpen, setIndicatorsDialogOpen] = useState(false);
  const [showDrawingToolbar, setShowDrawingToolbar] = useState(false);
  
  // Expose methods to the parent component
  useImperativeHandle(ref, () => ({
    widget: tradingViewWidget,
    toggleReplayMode: () => {
      setIsInReplayMode(!isInReplayMode);
      setReplayControlsVisible(!isInReplayMode);
      
      if (props.onReplayModeChange) {
        props.onReplayModeChange(!isInReplayMode);
      }
    },
    isInReplayMode: () => isInReplayMode,
    captureChartImage: async () => {
      // This would be a real implementation using TradingView's API
      // For now we'll return a placeholder
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }
  }));

  // Initialize the TradingView widget
  useEffect(() => {
    // This would be where we would initialize the real TradingView widget
    // For now we'll create a mock implementation
    const mockWidget = {
      activeChart: () => ({
        symbolExt: () => ({ full_name: props.symbol }),
        resolution: () => props.interval,
        onSymbolChanged: {
          subscribe: (callback: any) => {
            // Mock implementation
          }
        },
        onIntervalChanged: {
          subscribe: (callback: any) => {
            // Mock implementation
          }
        },
        setTimezone: (timezone: string) => {
          // Mock implementation
        },
        dataReady: (callback: any) => {
          // Mock implementation
          setTimeout(callback, 500);
        },
        crossHairMoved: {
          subscribe: (callback: any) => {
            // Mock implementation
            // Simulate price updates
            const interval = setInterval(() => {
              if (props.onPriceUpdate) {
                // Generate a realistic BTC price with some volatility
                const basePrice = 68000;
                const volatility = 2000;
                const price = basePrice + (Math.random() * volatility * 2 - volatility);
                props.onPriceUpdate(price);
              }
            }, 3000);
            
            return () => clearInterval(interval);
          }
        }
      })
    };
    
    setTradingViewWidget(mockWidget);
    
    if (props.onChartReady) {
      props.onChartReady();
    }
    
    // Clean up
    return () => {
      // This would be where we would clean up the real TradingView widget
    };
  }, [props.symbol, props.interval]);
  
  // Handle tool selection
  const handleToolSelect = (tool: string) => {
    if (activeTools.includes(tool)) {
      setActiveTools(activeTools.filter(t => t !== tool));
    } else {
      setActiveTools([...activeTools, tool]);
    }
  };
  
  // Handle timeframe selection
  const handleTimeframeSelect = (timeframe: string) => {
    setActiveTimeframe(timeframe);
  };
  
  // Toggle replay mode
  const toggleReplayMode = () => {
    setIsInReplayMode(!isInReplayMode);
    setReplayControlsVisible(!isInReplayMode);
    
    if (props.onReplayModeChange) {
      props.onReplayModeChange(!isInReplayMode);
    }
  };
  
  return (
    <div className="trading-view-pro flex flex-col h-full bg-[#131722] text-white overflow-hidden">
      {/* Top Toolbar - Matching exactly the TradingView style */}
      <div className="tv-top-toolbar flex items-center h-9 bg-[#131722] border-b border-[#2A2E39] px-2">
        <div className="flex items-center space-x-1">
          {/* Symbol button */}
          <div className="flex items-center">
            <div className="mr-1">
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="text-[#F7A600]">
                <circle cx="9" cy="9" r="9" fill="currentColor"/>
                <path d="M9 4.5V13.5" stroke="white" strokeWidth="1.2"/>
                <path d="M4.5 9H13.5" stroke="white" strokeWidth="1.2"/>
              </svg>
            </div>
            <Button variant="ghost" size="sm" className="text-white font-medium h-7 px-2 hover:bg-[#2A2E39]">
              {props.symbol?.split(':').pop() || 'BTCUSD'}
            </Button>
          </div>
          
          {/* Timeframe buttons */}
          <div className="flex border rounded overflow-hidden border-[#2A2E39]">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 py-0 rounded-none border-r border-[#2A2E39] ${activeTimeframe === '5m' ? 'bg-[#2962FF] text-white' : 'text-[#B2B5BE] hover:bg-[#2A2E39]'}`}
              onClick={() => handleTimeframeSelect('5m')}
            >
              5m
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 py-0 rounded-none border-r border-[#2A2E39] ${activeTimeframe === '15m' ? 'bg-[#2962FF] text-white' : 'text-[#B2B5BE] hover:bg-[#2A2E39]'}`}
              onClick={() => handleTimeframeSelect('15m')}
            >
              15m
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 py-0 rounded-none border-r border-[#2A2E39] ${activeTimeframe === '1h' ? 'bg-[#2962FF] text-white' : 'text-[#B2B5BE] hover:bg-[#2A2E39]'}`}
              onClick={() => handleTimeframeSelect('1h')}
            >
              1h
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 py-0 rounded-none border-r border-[#2A2E39] ${activeTimeframe === '4h' ? 'bg-[#2962FF] text-white' : 'text-[#B2B5BE] hover:bg-[#2A2E39]'}`}
              onClick={() => handleTimeframeSelect('4h')}
            >
              4h
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 py-0 rounded-none border-r border-[#2A2E39] ${activeTimeframe === '1D' ? 'bg-[#2962FF] text-white' : 'text-[#B2B5BE] hover:bg-[#2A2E39]'}`}
              onClick={() => handleTimeframeSelect('1D')}
            >
              1D
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 py-0 rounded-none ${activeTimeframe === '1W' ? 'bg-[#2962FF] text-white' : 'text-[#B2B5BE] hover:bg-[#2A2E39]'}`}
              onClick={() => handleTimeframeSelect('1W')}
            >
              1W
            </Button>
          </div>
          
          {/* Chart style button */}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V15M3 12H15M7 12V7M11 12V5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </Button>
          
          {/* Indicators button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39]"
            onClick={() => setIndicatorsDialogOpen(true)}
          >
            <div className="flex items-center gap-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9.5H5.5L7.5 6.5L10.5 11.5L12.5 8.5H15" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span>Indicators</span>
              <svg width="7" height="5" viewBox="0 0 7 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L3.5 3.5L6 1" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </div>
          </Button>
          
          {/* Alert button */}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39]">
            <div className="flex items-center gap-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2V3M9 15V16M16 9H15M3 9H2M13.5 4.5L12.8 5.2M5.2 12.8L4.5 13.5M13.5 13.5L12.8 12.8M5.2 5.2L4.5 4.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span>Alert</span>
            </div>
          </Button>
          
          {/* Replay button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-2 ${isInReplayMode ? 'text-[#2962FF]' : 'text-[#B2B5BE]'} hover:bg-[#2A2E39]`}
            onClick={toggleReplayMode}
          >
            <div className="flex items-center gap-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3.5H15M3 14.5H15M9 4V14M4 9L6.5 7.25V10.75L4 9ZM14 9L11.5 7.25V10.75L14 9Z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span>Replay</span>
            </div>
          </Button>
        </div>
      </div>
      
      {/* Main Chart Area with Side Toolbar */}
      <div className="flex-1 relative flex">
        {/* Left Side Toolbar */}
        <div className="side-toolbar flex flex-col bg-[#131722] border-r border-[#2A2E39] w-8 py-1">
          <TooltipProvider>
            {/* Crosshair Tool */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-8 p-0 flex justify-center items-center rounded-none ${activeTools.includes('crosshair') ? 'bg-[#2A2E39]' : ''}`}
                  onClick={() => handleToolSelect('crosshair')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 2V16M2 9H16" stroke="#B2B5BE" strokeWidth="1.2"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Crosshair (Alt+C)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Drawing Tools */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-8 p-0 flex justify-center items-center rounded-none ${showDrawingToolbar ? 'bg-[#2A2E39]' : ''}`}
                  onClick={() => setShowDrawingToolbar(!showDrawingToolbar)}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 15L15 3M11 15H15V11" stroke="#B2B5BE" strokeWidth="1.2"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Line Tool (Alt+L)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Text Tool */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-8 p-0 flex justify-center items-center rounded-none ${activeTools.includes('text') ? 'bg-[#2A2E39]' : ''}`}
                  onClick={() => handleToolSelect('text')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H14M9 4V14M6 14H12" stroke="#B2B5BE" strokeWidth="1.2"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Text (Alt+T)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Measure Tool */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-8 p-0 flex justify-center items-center rounded-none ${activeTools.includes('measure') ? 'bg-[#2A2E39]' : ''}`}
                  onClick={() => handleToolSelect('measure')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8V10M6 6V12M9 5V13M12 6V12M15 8V10" stroke="#B2B5BE" strokeWidth="1.2"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Measure (Alt+M)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Zoom Tool */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-8 p-0 flex justify-center items-center rounded-none ${activeTools.includes('zoom') ? 'bg-[#2A2E39]' : ''}`}
                  onClick={() => handleToolSelect('zoom')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="5" stroke="#B2B5BE" strokeWidth="1.2"/>
                    <path d="M12 12L15 15" stroke="#B2B5BE" strokeWidth="1.2"/>
                    <path d="M6 8H10M8 6V10" stroke="#B2B5BE" strokeWidth="1.2"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Zoom (Alt+Z)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Eraser Tool */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full h-8 p-0 flex justify-center items-center rounded-none ${activeTools.includes('eraser') ? 'bg-[#2A2E39]' : ''}`}
                  onClick={() => handleToolSelect('eraser')}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L12 6L15 9L9 15H4L6 12Z" stroke="#B2B5BE" strokeWidth="1.2"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Eraser (Alt+E)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* More Drawing Tools - Dropdown button at bottom */}
            <div className="mt-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 p-0 flex justify-center items-center rounded-none"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 7H14M4 11H14" stroke="#B2B5BE" strokeWidth="1.2"/>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>More Tools</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
        
        {/* Chart Content Area */}
        <div 
          ref={containerRef}
          className="chart-container flex-1 relative overflow-hidden"
          style={{ 
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%23131722"/><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="%23182030" stroke-width="0.5"/></pattern><rect width="100%" height="100%" fill="url(%23grid)"/></svg>')`,
            backgroundSize: '20px 20px'
          }}
        >
          {/* For visual display in this sample implementation */}
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-3xl font-bold text-[#B2B5BE] mb-4 opacity-20">
              {props.symbol?.replace(':', ' - ') || 'BTCUSD'}
            </div>
            <div className="flex flex-col items-center justify-center text-[#B2B5BE] text-sm opacity-50">
              <div className="mb-1">TradingView Chart Area</div>
              <div>Actual chart would be rendered here</div>
            </div>
            
            {/* Overlay Indicators and Chart Elements */}
            <div className="absolute top-4 left-4 text-[#B2B5BE] text-sm opacity-60">
              {/* Various indicators would be displayed here */}
              <div className="flex flex-col gap-1">
                <div>Vol - BTC: 14.78K</div>
                <div>SMA 50 close: 84,739</div>
                <div>SMA 200 close: 59,039</div>
                <div>SMA 150 close: 60,865</div>
              </div>
            </div>
            
            {/* Overlay Price Labels */}
            <div className="absolute top-4 right-4 text-white text-sm">
              <div className="bg-[#1E222D] px-2 py-1 rounded flex flex-col">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[#F7A600]">79,894</span>
                  <span className="text-[#F23645]">SELL</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[#F7A600]">79,895</span>
                  <span className="text-[#089981]">BUY</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Drawing tools popup */}
          {showDrawingToolbar && (
            <div className="absolute top-0 left-8 bg-[#1E222D] border border-[#2A2E39] rounded shadow-lg z-10">
              <div className="px-2 py-1 border-b border-[#2A2E39] text-xs font-medium text-[#B2B5BE]">
                Drawing Tools
              </div>
              <div className="grid grid-cols-3 gap-1 p-1">
                {['Line', 'Trend Line', 'Ray', 'Arrow', 'Rectangle', 'Circle', 'Triangle', 'Fibonacci', 'Pitchfork', 'Brush'].map((tool) => (
                  <Button
                    key={tool}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-[#B2B5BE] hover:bg-[#2A2E39] text-xs"
                  >
                    {tool}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Replay Controls (visible when in replay mode) */}
      {replayControlsVisible && (
        <div className="replay-controls border-t border-[#2A2E39] bg-[#131722] p-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 px-2 text-[#B2B5BE] hover:bg-[#2A2E39]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5L13 9L5 13V5Z" fill="currentColor"/>
              </svg>
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-[#B2B5BE] hover:bg-[#2A2E39]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 5V13M12 5V13" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </Button>
            <div className="text-[#B2B5BE] text-sm font-medium px-2 bg-[#1E222D] rounded">
              2023-12-15 14:30
            </div>
            <div className="text-[#B2B5BE] text-xs">
              Speed: 1.0x
            </div>
            <div className="w-20 h-1 bg-[#2A2E39] rounded-full">
              <div className="h-full w-1/4 bg-[#2962FF] rounded-full"></div>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 px-3 bg-transparent border-[#2A2E39] text-white hover:bg-[#2A2E39] hover:text-white"
            onClick={toggleReplayMode}
          >
            Exit Replay
          </Button>
        </div>
      )}
      
      {/* Time Navigation Bar at Bottom */}
      {!replayControlsVisible && (
        <div className="time-nav border-t border-[#2A2E39] bg-[#131722] p-1 flex items-center gap-2">
          <div className="flex">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-r-none border-r border-[#2A2E39]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M4 8H12" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-l-none">
              Select bar
            </Button>
          </div>
          
          <div className="flex border border-[#2A2E39] rounded overflow-hidden">
            <Button variant="ghost" size="sm" className="h-7 px-1 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3L4 7L8 11" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-1 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-none border-x border-[#2A2E39]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7H10" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-1 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3L10 7L6 11" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Button>
          </div>
          
          <div className="flex border border-[#2A2E39] rounded overflow-hidden">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-none">
              10x
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-none border-x border-[#2A2E39]">
              D
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[#B2B5BE] hover:bg-[#2A2E39] rounded-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 11L11 3M7 11H11V7" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Button>
          </div>
          
          {/* Trade Buttons - Buy and Sell */}
          <div className="ml-auto flex gap-2">
            <Button size="sm" className="bg-[#F23645] hover:bg-[#F23645]/80 h-7 px-4">
              Sell
            </Button>
            <Button size="sm" className="bg-[#089981] hover:bg-[#089981]/80 h-7 px-4">
              Buy
            </Button>
            <Button size="sm" variant="outline" className="bg-transparent border-[#2A2E39] text-white hover:bg-[#2A2E39] hover:text-white h-7 px-3">
              Flatten
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProTradingView;