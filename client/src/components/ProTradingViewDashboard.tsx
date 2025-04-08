import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProTradingViewLayout } from './ProTradingViewLayout';
import { TradingViewReplayMode } from './TradingViewReplayMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Zap,
  Eye,
  List,
  MoreHorizontal,
  Bookmark,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

// Interface for order/position
interface TradingPosition {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  size: number;
  entryPrice: number;
  currentPrice: number;
  openTime: Date;
  pnl: number;
  pnlPercent: number;
}

// Interface for component props
interface ProTradingViewDashboardProps {
  initialSymbol?: string;
  className?: string;
  showPositions?: boolean;
  showWatchlist?: boolean;
  showSettings?: boolean;
  initialPositions?: TradingPosition[];
  accountBalance?: number;
  onPositionCreated?: (position: TradingPosition) => void;
  onPositionClosed?: (positionId: string) => void;
}

export function ProTradingViewDashboard({
  initialSymbol = 'BINANCE:BTCUSDT',
  className = '',
  showPositions = true,
  showWatchlist = true,
  showSettings = true,
  initialPositions = [],
  accountBalance = 150000,
  onPositionCreated,
  onPositionClosed
}: ProTradingViewDashboardProps) {
  const { t } = useTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [positions, setPositions] = useState<TradingPosition[]>(initialPositions);
  const [watchlist, setWatchlist] = useState([
    { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', price: 69548.23, change: 2.34 },
    { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', price: 3245.78, change: -1.23 },
    { symbol: 'BINANCE:SOLUSDT', name: 'Solana', price: 174.56, change: 5.67 },
    { symbol: 'BINANCE:BNBUSDT', name: 'Binance Coin', price: 589.32, change: 0.89 },
    { symbol: 'BINANCE:XRPUSDT', name: 'Ripple', price: 0.5423, change: -2.45 },
    { symbol: 'NASDAQ:AAPL', name: 'Apple', price: 187.43, change: 1.12 },
    { symbol: 'NASDAQ:MSFT', name: 'Microsoft', price: 418.32, change: 0.78 },
    { symbol: 'NASDAQ:GOOGL', name: 'Google', price: 175.89, change: -0.53 },
    { symbol: 'NASDAQ:AMZN', name: 'Amazon', price: 182.56, change: 2.31 },
    { symbol: 'NASDAQ:TSLA', name: 'Tesla', price: 172.82, change: -1.45 },
  ]);
  const [activeSymbol, setActiveSymbol] = useState(initialSymbol);
  const [replayDate, setReplayDate] = useState<Date>(new Date());
  
  // Handle price updates from TradingView
  const handlePriceUpdate = (symbol: string, price: number) => {
    // Update positions with new prices
    if (positions.length > 0) {
      setPositions(positions.map(position => {
        if (position.symbol === symbol) {
          const newPrice = price;
          const priceDiff = position.type === 'buy' 
            ? newPrice - position.entryPrice 
            : position.entryPrice - newPrice;
          const pnl = priceDiff * position.size;
          const pnlPercent = (priceDiff / position.entryPrice) * 100;
          
          return {
            ...position,
            currentPrice: newPrice,
            pnl,
            pnlPercent
          };
        }
        return position;
      }));
    }
    
    // Update watchlist with new prices - randomly adjust for simulation
    setWatchlist(watchlist.map(item => {
      if (item.symbol === symbol) {
        return {
          ...item,
          price: price,
          change: item.change + (Math.random() * 0.4 - 0.2) // Small random change
        };
      }
      return item;
    }));
  };
  
  // Handle creating a new position
  const createPosition = (type: 'buy' | 'sell', size: number, leverage: number = 1) => {
    // Find the symbol's current price
    const symbolData = watchlist.find(item => item.symbol === activeSymbol);
    if (!symbolData) return;
    
    const newPosition: TradingPosition = {
      id: `pos_${Date.now()}`,
      symbol: activeSymbol,
      type,
      size: size * leverage,
      entryPrice: symbolData.price,
      currentPrice: symbolData.price,
      openTime: new Date(),
      pnl: 0,
      pnlPercent: 0
    };
    
    setPositions([...positions, newPosition]);
    
    if (onPositionCreated) {
      onPositionCreated(newPosition);
    }
  };
  
  // Handle closing a position
  const closePosition = (positionId: string) => {
    // Remove the position
    setPositions(positions.filter(p => p.id !== positionId));
    
    if (onPositionClosed) {
      onPositionClosed(positionId);
    }
  };
  
  // Calculate account metrics
  const totalEquity = accountBalance + positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const pnlPercent = positions.length > 0 ? (totalPnL / accountBalance) * 100 : 0;
  
  return (
    <div 
      className={`pro-trading-view-dashboard ${isFullScreen ? 'fixed inset-0 z-50 bg-[#131722]' : 'relative'} ${className}`}
      style={{ height: isFullScreen ? '100vh' : '800px' }}
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-[#131722] border-b border-[#2A2E39] h-12 px-4">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <div className="text-[#22a1e2] font-bold text-xl">
            Capitulre
          </div>
          
          {/* Nav Items */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" className="text-white hover:bg-[#2A2E39]">
              {t('Charts')}
            </Button>
            <Button variant="ghost" className="text-[#B2B5BE] hover:bg-[#2A2E39]">
              {t('Backtester')}
            </Button>
            <Button variant="ghost" className="text-[#B2B5BE] hover:bg-[#2A2E39]">
              {t('Screener')}
            </Button>
            <Button variant="ghost" className="text-[#B2B5BE] hover:bg-[#2A2E39]">
              {t('AI Coach')}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Multi-Chart View Switch */}
          <Button 
            variant="ghost" 
            className="flex items-center space-x-1 text-[#B2B5BE] hover:bg-[#2A2E39]"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            <span>{isFullScreen ? t('Exit Fullscreen') : t('Fullscreen')}</span>
          </Button>
          
          {/* User Menu */}
          <Button variant="ghost" className="flex items-center space-x-1 text-[#B2B5BE] hover:bg-[#2A2E39]">
            <Shield className="h-4 w-4" />
            <span>{t('Premium')}</span>
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" className="text-[#B2B5BE] hover:bg-[#2A2E39] p-2 h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex h-[calc(100%-48px)]">
        {/* Left Sidebar - Watchlist (if enabled) */}
        {showWatchlist && (
          <div className="w-64 border-r border-[#2A2E39] bg-[#131722] flex flex-col">
            <div className="p-2 border-b border-[#2A2E39] bg-[#1E222D]">
              <Input 
                placeholder={t('Search...')} 
                className="h-8 bg-[#131722] border-[#2A2E39]"
              />
            </div>
            
            <Tabs defaultValue="watchlist" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 bg-[#1E222D] rounded-none border-b border-[#2A2E39]">
                <TabsTrigger 
                  value="watchlist" 
                  className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white h-9"
                >
                  {t('Watchlist')}
                </TabsTrigger>
                <TabsTrigger 
                  value="markets" 
                  className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white h-9"
                >
                  {t('Markets')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="watchlist" className="flex-1 m-0 p-0">
                <div className="grid grid-cols-4 gap-px bg-[#2A2E39] p-px">
                  <div className="bg-[#1E222D] px-2 py-1 text-xs font-medium text-[#B2B5BE]">
                    {t('Symbol')}
                  </div>
                  <div className="bg-[#1E222D] px-2 py-1 text-xs font-medium text-[#B2B5BE] text-right">
                    {t('Price')}
                  </div>
                  <div className="bg-[#1E222D] px-2 py-1 text-xs font-medium text-[#B2B5BE] text-right">
                    {t('Chg%')}
                  </div>
                  <div className="bg-[#1E222D] px-2 py-1 text-xs font-medium text-[#B2B5BE] text-right">
                    {t('Actions')}
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  {watchlist.map((item, index) => (
                    <div 
                      key={item.symbol} 
                      className={`grid grid-cols-4 gap-px py-1.5 px-2 cursor-pointer ${activeSymbol === item.symbol ? 'bg-[#2A2E39]' : index % 2 === 0 ? 'bg-[#131722]' : 'bg-[#1A1D29]'}`}
                      onClick={() => setActiveSymbol(item.symbol)}
                    >
                      <div className="text-white text-xs">
                        {item.name}
                      </div>
                      <div className="text-white text-xs text-right font-medium">
                        {item.price.toFixed(item.price < 10 ? 4 : 2)}
                      </div>
                      <div className={`text-xs text-right font-medium ${item.change >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Bookmark className="h-3 w-3 text-[#B2B5BE]" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="markets" className="flex-1 m-0 p-0">
                <div className="p-4 text-center text-[#B2B5BE]">
                  {t('Market data would display here')}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col">
          <ProTradingViewLayout
            defaultLayout="1x1"
            defaultCharts={[
              { id: 'main', symbol: activeSymbol, interval: '1D', studies: [] }
            ]}
            isFullScreen={isFullScreen}
            onFullScreenChange={setIsFullScreen}
            onPriceUpdate={handlePriceUpdate}
          />
          
          {/* Replay Mode Overlay */}
          <TradingViewReplayMode
            symbol={activeSymbol.split(':').pop()}
            isActive={isReplayMode}
            onExit={() => setIsReplayMode(false)}
            onDateChange={setReplayDate}
            onPlayStateChange={(isPlaying) => {
              console.log('Replay playback:', isPlaying ? 'playing' : 'paused');
            }}
          />
        </div>
        
        {/* Right Sidebar - Positions & Trading Panel */}
        {showPositions && (
          <div className="w-72 border-l border-[#2A2E39] bg-[#131722] flex flex-col">
            {/* Account Summary */}
            <div className="p-3 border-b border-[#2A2E39] bg-[#1E222D]">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-[#B2B5BE]">{t('Account Value')}:</div>
                <div className="text-sm font-bold text-white">${totalEquity.toFixed(2)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-[#B2B5BE]">{t('P&L')}:</div>
                <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                  ${totalPnL.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
            
            {/* Positions/Orders Tabs */}
            <div className="flex-1 flex flex-col">
              <Tabs defaultValue="positions" className="flex-1 flex flex-col">
                <TabsList className="grid grid-cols-3 bg-[#1E222D] rounded-none border-b border-[#2A2E39]">
                  <TabsTrigger 
                    value="positions" 
                    className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white h-9"
                  >
                    {t('Positions')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white h-9"
                  >
                    {t('Orders')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white h-9"
                  >
                    {t('History')}
                  </TabsTrigger>
                </TabsList>
                
                {/* Positions Tab */}
                <TabsContent value="positions" className="flex-1 m-0 p-0 flex flex-col">
                  {positions.length > 0 ? (
                    <ScrollArea className="flex-1">
                      {positions.map((position) => (
                        <div 
                          key={position.id} 
                          className="p-3 border-b border-[#2A2E39]"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-1.5 ${position.type === 'buy' ? 'bg-[#089981]' : 'bg-[#F23645]'}`}></div>
                              <div className="text-white font-medium">{position.symbol.split(':').pop()}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[#B2B5BE] hover:bg-[#2A2E39]"
                              onClick={() => closePosition(position.id)}
                            >
                              {t('Close')}
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                            <div className="flex items-center text-[#B2B5BE]">
                              <Clock className="h-3 w-3 mr-1" />
                              {position.openTime.toLocaleTimeString()}
                            </div>
                            <div className="flex items-center text-[#B2B5BE]">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {position.size.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center text-[#B2B5BE]">
                              {position.type === 'buy' ? 
                                <TrendingUp className="h-3 w-3 mr-1 text-[#089981]" /> : 
                                <TrendingDown className="h-3 w-3 mr-1 text-[#F23645]" />
                              }
                              {position.type.toUpperCase()} @ {position.entryPrice.toFixed(2)}
                            </div>
                            <div className={`flex items-center font-medium ${position.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                              <Percent className="h-3 w-3 mr-1" />
                              {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-[#B2B5BE]">
                      <div className="text-center">
                        <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm">{t('No open positions')}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Trading Actions */}
                  <div className="p-3 border-t border-[#2A2E39] bg-[#1E222D]">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="bg-[#F23645] hover:bg-[#F23645]/80 text-white font-medium"
                        onClick={() => {
                          // Default values for demo
                          createPosition('sell', 1);
                        }}
                      >
                        {t('SELL / SHORT')}
                      </Button>
                      <Button
                        className="bg-[#089981] hover:bg-[#089981]/80 text-white font-medium"
                        onClick={() => {
                          // Default values for demo
                          createPosition('buy', 1);
                        }}
                      >
                        {t('BUY / LONG')}
                      </Button>
                    </div>
                    
                    {/* Replay Mode Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-2 border-[#2962FF] text-[#2962FF] hover:bg-[#2962FF]/10"
                      onClick={() => setIsReplayMode(!isReplayMode)}
                    >
                      {isReplayMode ? t('Exit Replay Mode') : t('Start Replay Mode')}
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Orders Tab */}
                <TabsContent value="orders" className="flex-1 m-0 p-0 flex flex-col">
                  <div className="flex-1 flex items-center justify-center text-[#B2B5BE]">
                    <div className="text-center">
                      <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">{t('No pending orders')}</div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* History Tab */}
                <TabsContent value="history" className="flex-1 m-0 p-0 flex flex-col">
                  <div className="flex-1 flex items-center justify-center text-[#B2B5BE]">
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">{t('No trading history yet')}</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProTradingViewDashboard;