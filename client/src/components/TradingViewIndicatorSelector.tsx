import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Info, Star, BarChart2, TrendingUp, Activity } from 'lucide-react';

// Define interface for an indicator
export interface TradingViewIndicator {
  id: string;
  name: string;
  description: string;
  category: 'trend' | 'oscillator' | 'volume' | 'volatility' | 'momentum' | 'custom' | 'favorite';
  scriptName?: string;
  isPremium?: boolean;
}

interface TradingViewIndicatorSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onIndicatorSelect: (indicator: TradingViewIndicator) => void;
  activeIndicators?: string[]; // Currently active indicators
}

// Sample indicators data matching TradingView
const indicatorsData: TradingViewIndicator[] = [
  // Trend Indicators
  { id: 'MA', name: 'Moving Average', description: 'Moving average helps identify the trend direction', category: 'trend', scriptName: 'MASimple@tv-basicstudies' },
  { id: 'EMA', name: 'Exponential Moving Average', description: 'EMA places more weight on recent price data', category: 'trend', scriptName: 'MAExp@tv-basicstudies' },
  { id: 'VWAP', name: 'Volume Weighted Average Price', description: 'Average price weighted by volume', category: 'trend', scriptName: 'VWAP@tv-basicstudies' },
  { id: 'BB', name: 'Bollinger Bands', description: 'Volatility bands placed above and below a moving average', category: 'trend', scriptName: 'BB@tv-basicstudies' },
  { id: 'Ichimoku', name: 'Ichimoku Cloud', description: 'Multiple averages with cloud formations', category: 'trend', scriptName: 'IchimokuCloud@tv-basicstudies' },
  { id: 'Parabolic', name: 'Parabolic SAR', description: 'Trend following indicator', category: 'trend', scriptName: 'PSAR@tv-basicstudies' },
  { id: 'Keltner', name: 'Keltner Channels', description: 'Volatility based envelope set above and below an EMA', category: 'trend', scriptName: 'KC@tv-basicstudies' },
  
  // Oscillator Indicators
  { id: 'RSI', name: 'Relative Strength Index', description: 'Momentum oscillator measuring speed and change of price movements', category: 'oscillator', scriptName: 'RSI@tv-basicstudies' },
  { id: 'MACD', name: 'Moving Average Convergence/Divergence', description: 'Trend-following momentum indicator', category: 'oscillator', scriptName: 'MACD@tv-basicstudies' },
  { id: 'Stoch', name: 'Stochastic', description: 'Compares closing price to its price range over a period', category: 'oscillator', scriptName: 'Stochastic@tv-basicstudies' },
  { id: 'CCI', name: 'Commodity Channel Index', description: 'Oscillator used to identify cyclical trends', category: 'oscillator', scriptName: 'CCI@tv-basicstudies' },
  { id: 'ADX', name: 'Average Directional Index', description: 'Measures trend strength without direction', category: 'oscillator', scriptName: 'ADX@tv-basicstudies' },
  { id: 'ATR', name: 'Average True Range', description: 'Market volatility indicator', category: 'oscillator', scriptName: 'ATR@tv-basicstudies' },
  { id: 'WILLR', name: 'Williams %R', description: 'Momentum indicator measuring overbought/oversold levels', category: 'oscillator', scriptName: 'WilliamsR@tv-basicstudies' },
  
  // Volume Indicators
  { id: 'VOLUME', name: 'Volume', description: 'Shows trading volume', category: 'volume', scriptName: 'Volume@tv-basicstudies' },
  { id: 'OBV', name: 'On Balance Volume', description: 'Relates volume to price change', category: 'volume', scriptName: 'OBV@tv-basicstudies' },
  { id: 'CMF', name: 'Chaikin Money Flow', description: 'Measures Money Flow Volume over a period', category: 'volume', scriptName: 'CMF@tv-basicstudies' },
  { id: 'ADL', name: 'Accumulation/Distribution Line', description: 'Cumulative indicator using volume and price', category: 'volume', scriptName: 'AccDist@tv-basicstudies' },
  
  // Momentum Indicators
  { id: 'MOM', name: 'Momentum', description: 'Difference between current price and price n periods ago', category: 'momentum', scriptName: 'MOM@tv-basicstudies' },
  { id: 'ROC', name: 'Rate of Change', description: 'Percentage price change over time', category: 'momentum', scriptName: 'ROC@tv-basicstudies' },
  { id: 'TSI', name: 'True Strength Index', description: 'Double-smoothed indicator showing momentum', category: 'momentum', scriptName: 'TSI@tv-basicstudies' },
  
  // Volatility Indicators
  { id: 'BBW', name: 'Bollinger Bands Width', description: 'Measures the width of Bollinger Bands', category: 'volatility', scriptName: 'BollingerBandsWidth@tv-basicstudies' },
  { id: 'STDDEV', name: 'Standard Deviation', description: 'Measures market volatility', category: 'volatility', scriptName: 'StdDev@tv-basicstudies' },
  { id: 'ATRP', name: 'Average True Range Percent', description: 'ATR as percentage of closing price', category: 'volatility', scriptName: 'ATRP@tv-basicstudies' },
  
  // Custom Indicators (will be populated by user scripts)
  { id: 'WyckoffVolume', name: 'Wyckoff Volume Analysis', description: 'Custom volume analysis based on Wyckoff method', category: 'custom', scriptName: 'WyckoffVolume@custom' },
  { id: 'WyckoffWave', name: 'Wyckoff Wave', description: 'Custom Wyckoff wave calculation', category: 'custom', scriptName: 'WyckoffWave@custom' },
];

export function TradingViewIndicatorSelector({
  isOpen,
  onClose,
  onIndicatorSelect,
  activeIndicators = []
}: TradingViewIndicatorSelectorProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('trend');
  const [filteredIndicators, setFilteredIndicators] = useState<TradingViewIndicator[]>([]);
  const [favoriteIndicators, setFavoriteIndicators] = useState<string[]>(['RSI', 'MACD', 'BB']); // Default favorites
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);
  
  // Filter indicators based on search term and active tab
  useEffect(() => {
    let results = indicatorsData;
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(indicator => 
        indicator.id.toLowerCase().includes(lowerSearchTerm) || 
        indicator.name.toLowerCase().includes(lowerSearchTerm) ||
        indicator.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Filter by indicator category (tab)
    if (activeTab === 'favorite') {
      results = results.filter(indicator => favoriteIndicators.includes(indicator.id));
    } else if (activeTab !== 'all') {
      results = results.filter(indicator => indicator.category === activeTab);
    }
    
    setFilteredIndicators(results);
  }, [searchTerm, activeTab, favoriteIndicators]);
  
  // Handle indicator click
  const handleIndicatorClick = (indicator: TradingViewIndicator) => {
    onIndicatorSelect(indicator);
  };
  
  // Toggle favorite status for an indicator
  const toggleFavorite = (indicatorId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavoriteIndicators(prev => 
      prev.includes(indicatorId)
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId]
    );
  };
  
  // If not open, don't render
  if (!isOpen) return null;
  
  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trend': return <TrendingUp className="h-4 w-4 mr-2" />;
      case 'oscillator': return <Activity className="h-4 w-4 mr-2" />;
      case 'volume': return <BarChart2 className="h-4 w-4 mr-2" />;
      case 'favorite': return <Star className="h-4 w-4 mr-2" />;
      default: return <BarChart2 className="h-4 w-4 mr-2" />;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-2xl bg-[#131722] border border-[#2A2E39] rounded-md shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2E39] flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Indicators</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="p-4 border-b border-[#2A2E39] bg-[#1C2030]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9598A1] h-4 w-4" />
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search indicators..."
              className="pl-10 bg-[#131722] border-[#2A2E39] text-white py-5"
            />
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="border-b border-[#2A2E39]">
          <Tabs defaultValue="trend" value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full whitespace-nowrap" type="scroll">
              <TabsList className="bg-transparent px-2 border-b-0">
                <TabsTrigger value="favorite" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1 flex items-center">
                  <Star className="h-4 w-4 mr-1.5" />
                  Favorite
                </TabsTrigger>
                <TabsTrigger value="trend" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  Trend
                </TabsTrigger>
                <TabsTrigger value="oscillator" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1 flex items-center">
                  <Activity className="h-4 w-4 mr-1.5" />
                  Oscillator
                </TabsTrigger>
                <TabsTrigger value="volume" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1 flex items-center">
                  <BarChart2 className="h-4 w-4 mr-1.5" />
                  Volume
                </TabsTrigger>
                <TabsTrigger value="volatility" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Volatility
                </TabsTrigger>
                <TabsTrigger value="momentum" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Momentum
                </TabsTrigger>
                <TabsTrigger value="custom" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Custom
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  All
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </Tabs>
        </div>
        
        {/* Results */}
        <ScrollArea className="flex-1 overflow-auto">
          {filteredIndicators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#2A2E39]">
              {filteredIndicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className={`p-3 bg-[#131722] hover:bg-[#1E222D] cursor-pointer ${
                    activeIndicators.includes(indicator.id) ? 'border-l-4 border-[#2962FF]' : ''
                  }`}
                  onClick={() => handleIndicatorClick(indicator)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getCategoryIcon(indicator.category)}
                      <span className="text-white font-medium">{indicator.name}</span>
                      {indicator.isPremium && (
                        <span className="ml-2 text-xs bg-yellow-500 text-black px-1 rounded">PRO</span>
                      )}
                    </div>
                    <button 
                      className={`text-lg ${favoriteIndicators.includes(indicator.id) ? 'text-yellow-500' : 'text-[#9598A1]'}`}
                      onClick={(e) => toggleFavorite(indicator.id, e)}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#9598A1] mt-1">{indicator.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-[#9598A1]">
              {searchTerm ? `No indicators found for "${searchTerm}"` : 'No indicators available for this category'}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer with Active Indicators */}
        <div className="p-3 text-left text-[#9598A1] text-xs border-t border-[#2A2E39]">
          <div className="font-semibold text-white mb-1">Active Indicators:</div>
          <div className="flex flex-wrap gap-2">
            {activeIndicators.length > 0 ? (
              activeIndicators.map(id => {
                const indicator = indicatorsData.find(ind => ind.id === id);
                return indicator && (
                  <div key={id} className="bg-[#1E222D] text-white px-2 py-1 rounded text-xs">
                    {indicator.name}
                  </div>
                );
              })
            ) : (
              <div className="text-[#9598A1]">No active indicators</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradingViewIndicatorSelector;