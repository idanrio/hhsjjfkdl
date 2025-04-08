import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProTradingView, { TradingViewRef } from './ProTradingView';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutGrid, 
  Maximize2, 
  Minimize2, 
  Plus, 
  X, 
  GripVertical,
  Copy,
  Save,
  Settings
} from 'lucide-react';

// Layout configuration types
type LayoutType = '1x1' | '1x2' | '2x1' | '2x2';

interface ChartConfig {
  id: string;
  symbol: string;
  interval: string;
  studies: string[];
}

interface ProTradingViewLayoutProps {
  defaultLayout?: LayoutType;
  defaultCharts?: ChartConfig[];
  isFullScreen?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  onPriceUpdate?: (symbol: string, price: number) => void;
  className?: string;
}

export function ProTradingViewLayout({
  defaultLayout = '1x1',
  defaultCharts = [{ id: 'chart1', symbol: 'BINANCE:BTCUSDT', interval: '1D', studies: [] }],
  isFullScreen = false,
  onFullScreenChange,
  onPriceUpdate,
  className = ''
}: ProTradingViewLayoutProps) {
  const { t } = useTranslation();
  const [layout, setLayout] = useState<LayoutType>(defaultLayout);
  const [activeTab, setActiveTab] = useState('chart-layout');
  const [charts, setCharts] = useState<ChartConfig[]>(defaultCharts);
  const [fullScreen, setFullScreen] = useState(isFullScreen);
  
  // References to TradingView widgets
  const chartRefs = useRef<{ [key: string]: TradingViewRef | null }>({});
  
  // Toggle full screen mode
  const toggleFullScreen = () => {
    const newState = !fullScreen;
    setFullScreen(newState);
    if (onFullScreenChange) {
      onFullScreenChange(newState);
    }
  };
  
  // Set the layout configuration
  const changeLayout = (newLayout: LayoutType) => {
    setLayout(newLayout);
    
    // If new layout needs more charts than currently available, add them
    const requiredChartCount = newLayout === '1x1' ? 1 : newLayout === '1x2' || newLayout === '2x1' ? 2 : 4;
    if (charts.length < requiredChartCount) {
      const newCharts = [...charts];
      for (let i = charts.length; i < requiredChartCount; i++) {
        newCharts.push({
          id: `chart${i + 1}`,
          symbol: 'BINANCE:BTCUSDT',
          interval: '1D',
          studies: []
        });
      }
      setCharts(newCharts);
    }
  };
  
  // Add a new chart
  const addChart = () => {
    const newChartId = `chart${charts.length + 1}`;
    setCharts([...charts, {
      id: newChartId,
      symbol: 'BINANCE:BTCUSDT',
      interval: '1D',
      studies: []
    }]);
    
    // Update layout to fit the new chart if needed
    if (charts.length === 0) setLayout('1x1');
    else if (charts.length === 1) setLayout('1x2');
    else if (charts.length === 2) setLayout('2x2');
  };
  
  // Remove a chart
  const removeChart = (chartId: string) => {
    const newCharts = charts.filter(chart => chart.id !== chartId);
    setCharts(newCharts);
    
    // Update layout if needed
    if (newCharts.length === 1) setLayout('1x1');
    else if (newCharts.length === 2) setLayout('1x2');
    else if (newCharts.length === 0) addChart(); // Always keep at least one chart
  };
  
  // Update chart configuration
  const updateChart = (chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(charts.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
  };
  
  // Handle price updates from individual charts
  const handlePriceUpdate = (chartId: string, price: number) => {
    const chart = charts.find(c => c.id === chartId);
    if (chart && onPriceUpdate) {
      onPriceUpdate(chart.symbol, price);
    }
  };
  
  // Layout specific grid classes
  const getGridClass = () => {
    switch (layout) {
      case '1x1': return 'grid-cols-1 grid-rows-1';
      case '1x2': return 'grid-cols-1 grid-rows-2';
      case '2x1': return 'grid-cols-2 grid-rows-1';
      case '2x2': return 'grid-cols-2 grid-rows-2';
      default: return 'grid-cols-1 grid-rows-1';
    }
  };
  
  return (
    <div 
      className={`pro-trading-view-layout bg-[#131722] border border-[#2A2E39] ${fullScreen ? 'fixed inset-0 z-50' : 'relative'} ${className}`}
      style={{ height: fullScreen ? '100vh' : '800px' }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-[#2A2E39] bg-[#131722] p-2">
        <div className="flex items-center gap-2">
          {/* Chart Name */}
          <div className="font-medium text-white">
            {t('Trading View Pro')}
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="chart-layout" value={activeTab} onValueChange={setActiveTab} className="ml-4">
            <TabsList className="bg-[#1E222D] border border-[#2A2E39]">
              <TabsTrigger 
                value="chart-layout" 
                className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white px-3 py-1"
              >
                {t('Charts')}
              </TabsTrigger>
              <TabsTrigger 
                value="scanner" 
                className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white px-3 py-1"
              >
                {t('Scanner')}
              </TabsTrigger>
              <TabsTrigger 
                value="script-editor" 
                className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white px-3 py-1"
              >
                {t('Editor')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Layout Controls */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
                  onClick={() => changeLayout('1x1')}
                >
                  <div className="w-full h-full border border-current p-0.5">
                    <div className="bg-current w-full h-full"></div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Single Chart</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
                  onClick={() => changeLayout('1x2')}
                >
                  <div className="w-full h-full border border-current p-0.5 flex flex-col gap-0.5">
                    <div className="bg-current w-full h-1/2"></div>
                    <div className="bg-current w-full h-1/2"></div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Two Charts (Vertical)</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
                  onClick={() => changeLayout('2x1')}
                >
                  <div className="w-full h-full border border-current p-0.5 flex gap-0.5">
                    <div className="bg-current w-1/2 h-full"></div>
                    <div className="bg-current w-1/2 h-full"></div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Two Charts (Horizontal)</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
                  onClick={() => changeLayout('2x2')}
                >
                  <div className="w-full h-full border border-current p-0.5 grid grid-cols-2 grid-rows-2 gap-0.5">
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Four Charts (Grid)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Save & Load Layouts */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
                >
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Layout</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chart Settings</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Fullscreen Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
                  onClick={toggleFullScreen}
                >
                  {fullScreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Chart Layout Area */}
      <div className={`grid ${getGridClass()} h-[calc(100%-48px)] gap-px bg-[#2A2E39]`}>
        {charts.slice(0, layout === '1x1' ? 1 : layout === '1x2' || layout === '2x1' ? 2 : 4).map((chart, index) => (
          <div key={chart.id} className="relative flex flex-col bg-[#131722]">
            {/* Chart Title Bar */}
            <div className="h-8 flex items-center justify-between px-2 bg-[#1E222D] border-b border-[#2A2E39]">
              <div className="text-[#B2B5BE] font-medium text-sm flex items-center">
                <GripVertical className="h-4 w-4 mr-1 cursor-move opacity-60" />
                {chart.symbol.split(':').pop()}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-[#B2B5BE] hover:bg-[#2A2E39]"
                  onClick={() => {
                    const chartToDuplicate = charts.find(c => c.id === chart.id);
                    if (chartToDuplicate) {
                      addChart();
                      const lastChart = charts[charts.length];
                      if (lastChart) {
                        updateChart(lastChart.id, {
                          symbol: chartToDuplicate.symbol,
                          interval: chartToDuplicate.interval,
                          studies: [...chartToDuplicate.studies]
                        });
                      }
                    }
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-[#B2B5BE] hover:bg-[#2A2E39]"
                  onClick={() => removeChart(chart.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            {/* The actual chart */}
            <div className="flex-1">
              <ProTradingView
                ref={(ref) => chartRefs.current[chart.id] = ref}
                symbol={chart.symbol}
                interval={chart.interval}
                theme="dark"
                autosize={true}
                studies={chart.studies}
                onPriceUpdate={(price) => handlePriceUpdate(chart.id, price)}
              />
            </div>
          </div>
        ))}
        
        {/* Add Chart Button */}
        {charts.length < 4 && (
          <div className="flex items-center justify-center bg-[#131722]">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-transparent border-[#2A2E39] text-[#B2B5BE] hover:bg-[#2A2E39]"
              onClick={addChart}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t('Add Chart')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProTradingViewLayout;