import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search, Star, Clock, Plus, Settings } from 'lucide-react';

// TradingView Indicator Categories
const INDICATOR_CATEGORIES = [
  { id: 'favorites', label: 'Favorites', icon: <Star className="h-4 w-4" /> },
  { id: 'recently', label: 'Recently Used', icon: <Clock className="h-4 w-4" /> },
  { id: 'trending', label: 'Trending', icon: null },
  { id: 'all', label: 'All', icon: null },
  { id: 'oscillators', label: 'Oscillators', icon: null },
  { id: 'momentum', label: 'Momentum', icon: null },
  { id: 'trend', label: 'Trend', icon: null },
  { id: 'volume', label: 'Volume', icon: null },
  { id: 'volatility', label: 'Volatility', icon: null },
];

// Sample indicator data - in a real implementation this would come from TradingView's API
const INDICATORS = [
  // Trending indicators
  { 
    id: 'rsi', 
    name: 'Relative Strength Index', 
    shortName: 'RSI',
    categories: ['trending', 'oscillators', 'all'],
    description: 'Momentum oscillator that measures the speed and change of price movements.',
    isFavorite: true,
    isRecent: true,
  },
  { 
    id: 'macd', 
    name: 'Moving Average Convergence Divergence', 
    shortName: 'MACD',
    categories: ['trending', 'momentum', 'all'],
    description: 'Trend-following momentum indicator that shows the relationship between two moving averages of a security's price.',
    isFavorite: true,
    isRecent: true,
  },
  { 
    id: 'bb', 
    name: 'Bollinger Bands', 
    shortName: 'BB',
    categories: ['trending', 'volatility', 'all'],
    description: 'Volatility bands placed above and below a moving average.',
    isFavorite: true,
    isRecent: false,
  },
  
  // Oscillators
  { 
    id: 'stoch', 
    name: 'Stochastic Oscillator', 
    shortName: 'Stoch',
    categories: ['oscillators', 'all'],
    description: 'Momentum indicator comparing a particular closing price of a security to a range of its prices over a certain period of time.',
    isFavorite: false,
    isRecent: true,
  },
  { 
    id: 'cci', 
    name: 'Commodity Channel Index', 
    shortName: 'CCI',
    categories: ['oscillators', 'all'],
    description: 'Oscillator that measures the current price level relative to an average price level over a given period of time.',
    isFavorite: false,
    isRecent: false,
  },
  { 
    id: 'williams', 
    name: 'Williams %R', 
    shortName: 'Williams %R',
    categories: ['oscillators', 'all'],
    description: 'Momentum indicator that measures overbought and oversold levels.',
    isFavorite: false,
    isRecent: false,
  },
  
  // Trend indicators
  { 
    id: 'ma', 
    name: 'Moving Average', 
    shortName: 'MA',
    categories: ['trend', 'all'],
    description: 'Shows the average price over a specified period of time.',
    isFavorite: true,
    isRecent: true,
  },
  { 
    id: 'ema', 
    name: 'Exponential Moving Average', 
    shortName: 'EMA',
    categories: ['trend', 'all'],
    description: 'Type of moving average that places a greater weight and significance on the most recent data points.',
    isFavorite: false,
    isRecent: true,
  },
  { 
    id: 'sma', 
    name: 'Simple Moving Average', 
    shortName: 'SMA',
    categories: ['trend', 'all'],
    description: 'Arithmetic moving average calculated by adding recent prices and dividing by the number of periods.',
    isFavorite: false,
    isRecent: false,
  },
  { 
    id: 'parabolic', 
    name: 'Parabolic SAR', 
    shortName: 'PSAR',
    categories: ['trend', 'all'],
    description: 'Technical indicator used to determine the price direction of an asset, as well as draw attention to when the price direction is changing.',
    isFavorite: false,
    isRecent: false,
  },
  
  // Volume indicators
  { 
    id: 'obv', 
    name: 'On-Balance Volume', 
    shortName: 'OBV',
    categories: ['volume', 'all'],
    description: 'Momentum technical indicator that uses volume flow to predict changes in stock price.',
    isFavorite: false,
    isRecent: false,
  },
  { 
    id: 'cmf', 
    name: 'Chaikin Money Flow', 
    shortName: 'CMF',
    categories: ['volume', 'all'],
    description: 'Volume-weighted average of accumulation and distribution over a specified period.',
    isFavorite: false,
    isRecent: false,
  },
  { 
    id: 'volume', 
    name: 'Volume', 
    shortName: 'Volume',
    categories: ['volume', 'all'],
    description: 'Shows the number of shares or contracts traded in a security or market during a given period of time.',
    isFavorite: true,
    isRecent: true,
  },
  
  // Volatility indicators
  { 
    id: 'atr', 
    name: 'Average True Range', 
    shortName: 'ATR',
    categories: ['volatility', 'all'],
    description: 'Market volatility indicator used in technical analysis.',
    isFavorite: false,
    isRecent: false,
  },
  { 
    id: 'sd', 
    name: 'Standard Deviation', 
    shortName: 'SD',
    categories: ['volatility', 'all'],
    description: 'Measures the dispersion of a dataset relative to its mean.',
    isFavorite: false,
    isRecent: false,
  },
  
  // Momentum indicators
  { 
    id: 'adx', 
    name: 'Average Directional Index', 
    shortName: 'ADX',
    categories: ['momentum', 'all'],
    description: 'Used to determine the strength of a trend, not its direction.',
    isFavorite: false,
    isRecent: false,
  },
  { 
    id: 'roc', 
    name: 'Rate of Change', 
    shortName: 'ROC',
    categories: ['momentum', 'all'],
    description: 'Calculates the percentage change between the current price and the price n periods ago.',
    isFavorite: false,
    isRecent: false,
  },
];

interface IndicatorsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIndicator: (indicator: any) => void;
}

const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({
  isOpen,
  onClose,
  onAddIndicator
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('trending');
  const [filteredIndicators, setFilteredIndicators] = useState(INDICATORS);
  
  // Filter indicators based on search term and active category
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    let indicators = [...INDICATORS];
    
    // Filter by category
    if (activeCategory === 'favorites') {
      indicators = indicators.filter(indicator => indicator.isFavorite);
    } else if (activeCategory === 'recently') {
      indicators = indicators.filter(indicator => indicator.isRecent);
    } else {
      indicators = indicators.filter(indicator => 
        indicator.categories.includes(activeCategory)
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      indicators = indicators.filter(indicator => 
        indicator.name.toLowerCase().includes(term) || 
        indicator.shortName.toLowerCase().includes(term)
      );
    }
    
    setFilteredIndicators(indicators);
  }, [searchTerm, activeCategory, isOpen]);
  
  // If not open, don't render
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative w-[700px] max-h-[80vh] bg-[#131722] border border-[#2A2E39] rounded-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2A2E39]">
          <h2 className="text-lg font-medium text-white">{t('Indicators')}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#2A2E39]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex h-[500px]">
          {/* Left sidebar - categories */}
          <div className="w-48 border-r border-[#2A2E39] bg-[#1E222D] p-2">
            <div className="space-y-1">
              {INDICATOR_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full justify-start h-8 ${
                    activeCategory === category.id
                      ? 'bg-[#2962FF] text-white hover:bg-[#2962FF]/90'
                      : 'text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white'
                  }`}
                >
                  {category.icon && <span className="mr-2">{category.icon}</span>}
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Right content - indicators list */}
          <div className="flex-1 flex flex-col">
            {/* Search bar */}
            <div className="p-3 border-b border-[#2A2E39]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search indicators..."
                  className="pl-10 bg-[#1E222D] border-[#2A2E39] text-white h-9"
                />
              </div>
            </div>
            
            {/* Indicators list */}
            <ScrollArea className="flex-1">
              {filteredIndicators.length > 0 ? (
                <div className="p-2 space-y-1">
                  {filteredIndicators.map((indicator) => (
                    <div 
                      key={indicator.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#2A2E39] cursor-pointer group"
                      onClick={() => onAddIndicator(indicator)}
                    >
                      <div>
                        <div className="text-white font-medium flex items-center">
                          {indicator.shortName}
                          {indicator.isFavorite && (
                            <Star className="h-3.5 w-3.5 ml-2 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-[#848E9C] text-xs mt-0.5">{indicator.name}</div>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-[#B2B5BE] hover:bg-[#2A2E39]/50 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle favorite
                          }}
                        >
                          <Star className={`h-4 w-4 ${indicator.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-[#B2B5BE] hover:bg-[#2A2E39]/50 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open settings
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#848E9C]">
                  <Search className="h-10 w-10 mb-2 opacity-20" />
                  <p>No indicators found matching "{searchTerm}"</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicatorsPanel;