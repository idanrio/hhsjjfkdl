import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';

// Define interface for a symbol
export interface TradingViewSymbol {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'futures' | 'index' | 'fund' | 'commodity' | 'option';
  exchange: string;
  fullName?: string;
  logo?: string;
}

interface TradingViewSymbolSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSymbolSelect: (symbol: TradingViewSymbol) => void;
}

// Stock exchange icons
const exchangeIcons: { [key: string]: string } = {
  'NASDAQ': '🇺🇸',
  'NYSE': '🇺🇸',
  'BINANCE': '₿',
  'COINBASE': '₿',
  'COMEX': '🥇',
  'CME': '🏛️',
  'CAPITALCOM': '💰',
  'FOREX': '💱',
  'FX': '💱',
  'AMEX': '🇺🇸'
};

// Sample symbols data matching TradingView
const symbolsData: TradingViewSymbol[] = [
  // Futures - Major Indices
  { symbol: 'ES1!', name: 'E-MINI S&P 500 FUTURES', type: 'futures', exchange: 'CME', fullName: 'E-MINI S&P 500 FUTURES' },
  { symbol: 'NQ1!', name: 'NASDAQ 100 E-MINI FUTURES', type: 'futures', exchange: 'CME', fullName: 'NASDAQ 100 E-MINI FUTURES' },
  { symbol: 'YM1!', name: 'MINI DOW JONES FUTURES', type: 'futures', exchange: 'CME', fullName: 'MINI DOW JONES FUTURES' },
  { symbol: 'RTY1!', name: 'E-MINI RUSSELL 2000 FUTURES', type: 'futures', exchange: 'CME', fullName: 'E-MINI RUSSELL 2000 FUTURES' },
  
  // Futures - Currencies
  { symbol: 'M6B1!', name: 'MICRO GBP/USD FUTURES', type: 'futures', exchange: 'CME', fullName: 'MICRO GBP/USD FUTURES' },
  { symbol: 'M6E1!', name: 'MICRO EUR/USD FUTURES', type: 'futures', exchange: 'CME', fullName: 'MICRO EUR/USD FUTURES' },
  
  // Futures - Commodities
  { symbol: 'GC1!', name: 'GOLD FUTURES', type: 'futures', exchange: 'COMEX', fullName: 'GOLD FUTURES' },
  { symbol: 'SI1!', name: 'SILVER FUTURES', type: 'futures', exchange: 'COMEX', fullName: 'SILVER FUTURES' },
  { symbol: 'CL1!', name: 'CRUDE OIL FUTURES', type: 'futures', exchange: 'NYMEX', fullName: 'CRUDE OIL FUTURES' },
  { symbol: 'NG1!', name: 'NATURAL GAS FUTURES', type: 'futures', exchange: 'NYMEX', fullName: 'NATURAL GAS FUTURES' },
  { symbol: '10Y1!', name: '1-OUNCE GOLD FUTURES', type: 'futures', exchange: 'COMEX', fullName: '1-OUNCE GOLD FUTURES' },
  
  // Stocks - Major US Stocks
  { symbol: 'AAPL', name: 'APPLE INC.', type: 'stock', exchange: 'NASDAQ', fullName: 'APPLE INC.' },
  { symbol: 'MSFT', name: 'MICROSOFT CORPORATION', type: 'stock', exchange: 'NASDAQ', fullName: 'MICROSOFT CORPORATION' },
  { symbol: 'GOOGL', name: 'ALPHABET INC.', type: 'stock', exchange: 'NASDAQ', fullName: 'ALPHABET INC.' },
  { symbol: 'AMZN', name: 'AMAZON.COM, INC.', type: 'stock', exchange: 'NASDAQ', fullName: 'AMAZON.COM, INC.' },
  { symbol: 'TSLA', name: 'TESLA, INC.', type: 'stock', exchange: 'NASDAQ', fullName: 'TESLA, INC.' },
  { symbol: 'META', name: 'META PLATFORMS, INC.', type: 'stock', exchange: 'NASDAQ', fullName: 'META PLATFORMS, INC.' },
  { symbol: 'NVDA', name: 'NVIDIA CORPORATION', type: 'stock', exchange: 'NASDAQ', fullName: 'NVIDIA CORPORATION' },
  { symbol: 'BLK', name: 'BLACKROCK, INC.', type: 'stock', exchange: 'NYSE', fullName: 'BLACKROCK, INC.' },
  { symbol: 'CAT', name: 'CATERPILLAR, INC.', type: 'stock', exchange: 'NYSE', fullName: 'CATERPILLAR, INC.' },
  { symbol: 'BA', name: 'BOEING COMPANY', type: 'stock', exchange: 'NYSE', fullName: 'BOEING COMPANY' },
  { symbol: 'DIS', name: 'WALT DISNEY COMPANY', type: 'stock', exchange: 'NYSE', fullName: 'WALT DISNEY COMPANY' },
  
  // Cryptocurrencies
  { symbol: 'BTCUSDT', name: 'BITCOIN / TETHER USD', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:BTCUSDT' },
  { symbol: 'ETHUSDT', name: 'ETHEREUM / TETHER USD', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:ETHUSDT' },
  { symbol: 'SOLUSDT', name: 'SOLANA / TETHER USD', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:SOLUSDT' },
  { symbol: 'BNBUSDT', name: 'BINANCE COIN / TETHER USD', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:BNBUSDT' },
  { symbol: 'ADAUSDT', name: 'CARDANO / TETHER USD', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:ADAUSDT' },
  { symbol: 'XRPUSDT', name: 'RIPPLE / TETHER USD', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:XRPUSDT' },
  { symbol: 'DOGEUSDT', name: 'DOGECOIN / TETHER USD', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:DOGEUSDT' },
  { symbol: 'RUNEUSD', name: 'RUNE / TETHERUS', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:RUNEUSD' },
  { symbol: 'ENJUSD', name: 'ENJIN COIN / TETHERUS', type: 'crypto', exchange: 'BINANCE', fullName: 'BINANCE:ENJUSD' },
  
  // Forex
  { symbol: 'EURUSD', name: 'EURO / US DOLLAR', type: 'forex', exchange: 'FX', fullName: 'FX:EURUSD' },
  { symbol: 'GBPUSD', name: 'BRITISH POUND / US DOLLAR', type: 'forex', exchange: 'FX', fullName: 'FX:GBPUSD' },
  { symbol: 'USDJPY', name: 'US DOLLAR / JAPANESE YEN', type: 'forex', exchange: 'FX', fullName: 'FX:USDJPY' },
  { symbol: 'AUDUSD', name: 'AUSTRALIAN DOLLAR / US DOLLAR', type: 'forex', exchange: 'FX', fullName: 'FX:AUDUSD' },
  { symbol: 'USDCAD', name: 'US DOLLAR / CANADIAN DOLLAR', type: 'forex', exchange: 'FX', fullName: 'FX:USDCAD' },
  
  // Indices
  { symbol: 'SPX', name: 'S&P 500 INDEX', type: 'index', exchange: 'CAPITALCOM', fullName: 'CAPITALCOM:SPX' },
  { symbol: 'DJI', name: 'DOW JONES INDUSTRIAL AVERAGE', type: 'index', exchange: 'CAPITALCOM', fullName: 'CAPITALCOM:DJI' },
  { symbol: 'NDX', name: 'NASDAQ 100 INDEX', type: 'index', exchange: 'CAPITALCOM', fullName: 'CAPITALCOM:NDX' },
  
  // Funds/ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF TRUST', type: 'fund', exchange: 'AMEX', fullName: 'AMEX:SPY' },
  { symbol: 'QQQ', name: 'INVESCO QQQ TRUST SERIES 1', type: 'fund', exchange: 'NASDAQ', fullName: 'NASDAQ:QQQ' },
  { symbol: 'IWM', name: 'ISHARES RUSSELL 2000 ETF', type: 'fund', exchange: 'AMEX', fullName: 'AMEX:IWM' },
  
  // Commodities
  { symbol: 'GOLD', name: 'GOLD (XAU/USD)', type: 'commodity', exchange: 'CAPITALCOM', fullName: 'CAPITALCOM:GOLD' },
  { symbol: 'SILVER', name: 'SILVER (XAG/USD)', type: 'commodity', exchange: 'CAPITALCOM', fullName: 'CAPITALCOM:SILVER' },
  { symbol: 'USOIL', name: 'US CRUDE OIL', type: 'commodity', exchange: 'CAPITALCOM', fullName: 'CAPITALCOM:USOIL' },
];

export function TradingViewSymbolSearch({
  isOpen,
  onClose,
  onSymbolSelect
}: TradingViewSymbolSearchProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredSymbols, setFilteredSymbols] = useState<TradingViewSymbol[]>(symbolsData);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);
  
  // Filter symbols based on search term and active tab
  useEffect(() => {
    let results = symbolsData;
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(symbol => 
        symbol.symbol.toLowerCase().includes(lowerSearchTerm) || 
        symbol.name.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Filter by symbol type (tab)
    if (activeTab !== 'all') {
      results = results.filter(symbol => {
        switch (activeTab) {
          case 'stocks': return symbol.type === 'stock';
          case 'crypto': return symbol.type === 'crypto';
          case 'forex': return symbol.type === 'forex';
          case 'futures': return symbol.type === 'futures';
          case 'indices': return symbol.type === 'index';
          case 'funds': return symbol.type === 'fund';
          case 'bonds': return symbol.type === 'bond';
          case 'economy': return symbol.type === 'economy';
          case 'options': return symbol.type === 'option';
          default: return true;
        }
      });
    }
    
    setFilteredSymbols(results);
  }, [searchTerm, activeTab]);
  
  // Handle symbol click
  const handleSymbolClick = (symbol: TradingViewSymbol) => {
    onSymbolSelect(symbol);
    onClose();
  };
  
  // If not open, don't render
  if (!isOpen) return null;
  
  // Format exchange display text
  const formatExchangeDisplay = (type: string, exchange: string) => {
    switch (type) {
      case 'stock': return `stock · ${exchange}`;
      case 'crypto': return `spot crypto · ${exchange}`;
      case 'futures': return `futures · ${exchange}`;
      case 'forex': return 'forex';
      case 'index': return `index · ${exchange}`;
      case 'fund': return `fund · ${exchange}`;
      case 'commodity': return `commodity · ${exchange}`;
      case 'option': return `options · ${exchange}`;
      default: return exchange;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-2xl bg-[#131722] border border-[#2A2E39] rounded-md shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2E39] flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Symbol Search</h2>
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
              placeholder="Search"
              className="pl-10 bg-[#131722] border-[#2A2E39] text-white py-5"
            />
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="border-b border-[#2A2E39]">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full whitespace-nowrap" type="scroll">
              <TabsList className="bg-transparent px-2 border-b-0">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="stocks" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Stocks
                </TabsTrigger>
                <TabsTrigger value="funds" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Funds
                </TabsTrigger>
                <TabsTrigger value="futures" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Futures
                </TabsTrigger>
                <TabsTrigger value="forex" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Forex
                </TabsTrigger>
                <TabsTrigger value="crypto" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Crypto
                </TabsTrigger>
                <TabsTrigger value="indices" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Indices
                </TabsTrigger>
                <TabsTrigger value="bonds" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Bonds
                </TabsTrigger>
                <TabsTrigger value="economy" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Economy
                </TabsTrigger>
                <TabsTrigger value="options" className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white rounded px-3 py-1">
                  Options
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </Tabs>
        </div>
        
        {/* Results */}
        <ScrollArea className="flex-1 overflow-auto">
          {filteredSymbols.length > 0 ? (
            <div className="divide-y divide-[#2A2E39]">
              {filteredSymbols.map((symbol) => (
                <div
                  key={`${symbol.exchange}:${symbol.symbol}`}
                  className="p-3 hover:bg-[#2A2E39] cursor-pointer flex items-center justify-between"
                  onClick={() => handleSymbolClick(symbol)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-md bg-[#1E222D] flex items-center justify-center mr-3 text-lg">
                      {exchangeIcons[symbol.exchange] || '🔍'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{symbol.symbol}</div>
                      <div className="text-[#9598A1] text-xs">{symbol.name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#9598A1]">
                    {formatExchangeDisplay(symbol.type, symbol.exchange)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-[#9598A1]">
              {searchTerm ? `No results found for "${searchTerm}"` : 'No symbols available for this category'}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer with Instruction */}
        <div className="p-2 text-center text-[#9598A1] text-xs border-t border-[#2A2E39]">
          Simply start typing while on the chart to pull up this search box
        </div>
      </div>
    </div>
  );
}

export default TradingViewSymbolSearch;