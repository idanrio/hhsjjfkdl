import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Search, ExternalLink } from 'lucide-react';

// Symbol categories
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'funds', label: 'Funds' },
  { id: 'futures', label: 'Futures' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'indices', label: 'Indices' },
  { id: 'bonds', label: 'Bonds' },
  { id: 'economy', label: 'Economy' },
  { id: 'options', label: 'Options' },
  { id: 'tradovate', label: 'Tradovate' },
];

// Sample market data - in a real app these would come from an API
const MARKET_SYMBOLS = [
  { 
    symbol: 'ES1!', 
    name: 'E-MINI S&P 500 FUTURES', 
    type: 'futures', 
    exchange: 'CME', 
    icon: '📈', 
    color: '#1E88E5' 
  },
  { 
    symbol: 'M6B1!', 
    name: 'MICRO GBP/USD FUTURES', 
    type: 'futures', 
    exchange: 'CME', 
    icon: '🇬🇧', 
    color: '#1E88E5' 
  },
  { 
    symbol: 'RUNEUSD1', 
    name: 'RUNE / TETHETUS', 
    type: 'crypto', 
    exchange: 'BINANCE', 
    icon: '🔵', 
    color: '#F6A821' 
  },
  { 
    symbol: 'GC1!', 
    name: 'GOLD FUTURES', 
    type: 'futures', 
    exchange: 'COMEX', 
    icon: '🥇', 
    color: '#F6A821' 
  },
  { 
    symbol: 'ENJUSD1', 
    name: 'ENJIN COIN / TETHETUS', 
    type: 'crypto', 
    exchange: 'BINANCE', 
    icon: '🔵', 
    color: '#F6A821' 
  },
  { 
    symbol: 'GOLD', 
    name: 'GOLD (XAUUSD)', 
    type: 'commodity', 
    exchange: 'CAPITALCOM', 
    icon: '🥇', 
    color: '#F6A821' 
  },
  { 
    symbol: 'NVDA', 
    name: 'NVIDIA CORPORATION', 
    type: 'stock', 
    exchange: 'NASDAQ', 
    icon: '🖥️', 
    color: '#00897B' 
  },
  { 
    symbol: 'BLK', 
    name: 'BLACKROCK, INC.', 
    type: 'stock', 
    exchange: 'NYSE', 
    icon: '💼', 
    color: '#00897B' 
  },
  { 
    symbol: 'CAT', 
    name: 'CATERPILLAR, INC.', 
    type: 'stock', 
    exchange: 'NYSE', 
    icon: '🚜', 
    color: '#00897B' 
  },
  { 
    symbol: 'AAPL', 
    name: 'APPLE INC.', 
    type: 'stock', 
    exchange: 'NASDAQ', 
    icon: '🍎', 
    color: '#00897B' 
  },
  { 
    symbol: 'TSLA', 
    name: 'TESLA, INC.', 
    type: 'stock', 
    exchange: 'NASDAQ', 
    icon: '🚗', 
    color: '#00897B' 
  },
  { 
    symbol: '10Z1!', 
    name: '1-OUNCE GOLD FUTURES', 
    type: 'futures', 
    exchange: 'COMEX', 
    icon: '🥇', 
    color: '#F6A821' 
  },
  // More cryptocurrencies
  { 
    symbol: 'BTCUSD', 
    name: 'BITCOIN / USD', 
    type: 'crypto', 
    exchange: 'BINANCE', 
    icon: '₿', 
    color: '#F6A821' 
  },
  { 
    symbol: 'ETHUSD', 
    name: 'ETHEREUM / USD', 
    type: 'crypto', 
    exchange: 'BINANCE', 
    icon: '⟠', 
    color: '#F6A821' 
  },
  { 
    symbol: 'SOLUSDT', 
    name: 'SOLANA / TETHER', 
    type: 'crypto', 
    exchange: 'BINANCE', 
    icon: '🟢', 
    color: '#F6A821' 
  },
  // More stocks
  { 
    symbol: 'MSFT', 
    name: 'MICROSOFT CORPORATION', 
    type: 'stock', 
    exchange: 'NASDAQ', 
    icon: '🪟', 
    color: '#00897B' 
  },
  { 
    symbol: 'AMZN', 
    name: 'AMAZON.COM, INC.', 
    type: 'stock', 
    exchange: 'NASDAQ', 
    icon: '📦', 
    color: '#00897B' 
  },
  { 
    symbol: 'GOOGL', 
    name: 'ALPHABET INC. CLASS A', 
    type: 'stock', 
    exchange: 'NASDAQ', 
    icon: '🔍', 
    color: '#00897B' 
  },
  // More indices
  { 
    symbol: 'SPX', 
    name: 'S&P 500 INDEX', 
    type: 'index', 
    exchange: 'CBOE', 
    icon: '📊', 
    color: '#9C27B0' 
  },
  { 
    symbol: 'NDX', 
    name: 'NASDAQ 100 INDEX', 
    type: 'index', 
    exchange: 'NASDAQ', 
    icon: '📊', 
    color: '#9C27B0' 
  },
  { 
    symbol: 'DJI', 
    name: 'DOW JONES INDUSTRIAL AVERAGE', 
    type: 'index', 
    exchange: 'DJ', 
    icon: '📊', 
    color: '#9C27B0' 
  },
  // More forex
  { 
    symbol: 'EURUSD', 
    name: 'EURO / US DOLLAR', 
    type: 'forex', 
    exchange: 'FXCM', 
    icon: '💱', 
    color: '#E91E63' 
  },
  { 
    symbol: 'GBPUSD', 
    name: 'BRITISH POUND / US DOLLAR', 
    type: 'forex', 
    exchange: 'FXCM', 
    icon: '💱', 
    color: '#E91E63' 
  },
  { 
    symbol: 'USDJPY', 
    name: 'US DOLLAR / JAPANESE YEN', 
    type: 'forex', 
    exchange: 'FXCM', 
    icon: '💱', 
    color: '#E91E63' 
  },
];

// Exchange icons
const ExchangeIcon = ({ exchange }: { exchange: string }) => {
  // Map exchanges to their flag or icon
  const exchangeIcons: Record<string, React.ReactNode> = {
    'CME': <span className="px-1 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">CME</span>,
    'BINANCE': <span className="px-1 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded">B</span>,
    'COMEX': <span className="px-1 py-0.5 bg-red-600 text-white text-xs font-bold rounded">COMEX</span>,
    'CAPITALCOM': <span className="px-1 py-0.5 bg-green-700 text-white text-xs font-bold rounded">C</span>,
    'NASDAQ': <span className="px-1 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">NASDAQ</span>,
    'NYSE': <span className="px-1 py-0.5 bg-blue-800 text-white text-xs font-bold rounded">NYSE</span>,
    'CBOE': <span className="px-1 py-0.5 bg-gray-800 text-white text-xs font-bold rounded">CBOE</span>,
    'FXCM': <span className="px-1 py-0.5 bg-pink-600 text-white text-xs font-bold rounded">FX</span>,
    'DJ': <span className="px-1 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded">DJ</span>,
  };

  return exchangeIcons[exchange] || <span className="px-1 py-0.5 bg-gray-600 text-white text-xs font-bold rounded">{exchange}</span>;
};

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSymbolSelect: (symbol: string, name: string) => void;
  defaultTab?: string;
}

const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  onSymbolSelect,
  defaultTab = 'all'
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(defaultTab);
  const [filteredSymbols, setFilteredSymbols] = useState(MARKET_SYMBOLS);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter symbols based on search term and active category
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    let symbols = [...MARKET_SYMBOLS];
    
    // Filter by category if not 'all'
    if (activeCategory !== 'all') {
      symbols = symbols.filter(symbol => symbol.type === activeCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      symbols = symbols.filter(
        symbol => 
          symbol.symbol.toLowerCase().includes(term) || 
          symbol.name.toLowerCase().includes(term)
      );
    }
    
    setFilteredSymbols(symbols);
  }, [searchTerm, activeCategory, isOpen]);
  
  // Focus the search input when the modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);
  
  // If not open, don't render anything
  if (!isOpen) return null;
  
  // Handle symbol selection
  const handleSymbolSelect = (symbol: string, name: string) => {
    onSymbolSelect(symbol, name);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative w-[600px] max-h-[80vh] bg-[#131722] border border-[#2A2E39] rounded-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2A2E39]">
          <h2 className="text-lg font-medium text-white">Symbol Search</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#2A2E39]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="p-3 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="pl-10 bg-[#1E222D] border-[#2A2E39] text-white h-10"
            />
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="px-3">
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-1 min-w-max">
              {CATEGORIES.map(category => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className={`h-8 px-3 rounded-md ${
                    activeCategory === category.id
                      ? 'bg-[#2962FF] hover:bg-[#2962FF]/90 text-white'
                      : 'bg-transparent border-[#2A2E39] text-[#B2B5BE] hover:bg-[#2A2E39]'
                  }`}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Symbol List */}
        <div className="overflow-y-auto max-h-[60vh] p-2 mt-2">
          {filteredSymbols.length > 0 ? (
            <div className="divide-y divide-[#2A2E39]">
              {filteredSymbols.map((symbol) => (
                <div 
                  key={symbol.symbol} 
                  className="flex items-center justify-between p-2 hover:bg-[#2A2E39] cursor-pointer"
                  onClick={() => handleSymbolSelect(symbol.symbol, symbol.name)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center mr-3 text-xl">
                      {symbol.icon}
                    </div>
                    <div>
                      <div className="text-white font-medium">{symbol.symbol}</div>
                      <div className="text-[#848E9C] text-sm">{symbol.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-[#848E9C] text-xs">{symbol.type}</div>
                    <ExchangeIcon exchange={symbol.exchange} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-[#848E9C]">
              <Search className="h-10 w-10 mb-2 opacity-20" />
              <p>No symbols found for "{searchTerm}"</p>
              <p className="text-sm mt-1">Try a different search term or category</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-[#2A2E39] text-[#848E9C] text-xs text-center">
          Simply start typing while on the chart to pull up this search box
        </div>
      </div>
    </div>
  );
};

export default SymbolSearchModal;