import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  BarChart4, 
  TrendingUp, 
  TrendingDown,
  X,
  DollarSign
} from 'lucide-react';
import type { Position } from '@shared/schema';

// Define TradingView widget interface
interface TradingViewRef {
  iframe?: HTMLIFrameElement;
}

interface PaperTradingViewProps {
  initialSymbol?: string;
  fullScreen?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  onClose?: () => void;
  className?: string;
  height?: string;
}

/**
 * PaperTradingView Component
 * 
 * This component integrates TradingView with our paper trading account system
 * for a realistic trading experience with $150,000 demo account
 */
export default function PaperTradingView({
  initialSymbol = 'BINANCE:BTCUSDT',
  fullScreen = false,
  onFullScreenChange,
  onClose,
  className = '',
  height = '600px',
}: PaperTradingViewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Trading state
  const [symbol, setSymbol] = useState(initialSymbol);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [amount, setAmount] = useState(1000);
  const [leverage, setLeverage] = useState(1);
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [stopPrice, setStopPrice] = useState<number | null>(null);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('open-positions');
  
  // TradingView reference
  const tradingViewRef = useRef<TradingViewRef>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch account info
  const { data: account = { balance: 0, equity: 0, availableMargin: 0, usedMargin: 0 } } = useQuery({
    queryKey: ['/api/paper-trading/account'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/paper-trading/account');
      return response.json();
    },
  });
  
  // Fetch active positions
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ['/api/paper-trading/positions', { status: 'active' }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/paper-trading/positions', { status: 'active' });
      return response.json();
    },
  });
  
  // Fetch closed positions
  const { data: closedPositions = [], isLoading: closedPositionsLoading } = useQuery({
    queryKey: ['/api/paper-trading/positions', { status: 'closed' }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/paper-trading/positions', { status: 'closed' });
      return response.json();
    },
  });
  
  // Create position mutation
  const createPosition = useMutation({
    mutationFn: async (positionData: any) => {
      const response = await apiRequest('POST', '/api/paper-trading/positions', positionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Position Opened'),
        description: t('Your trading position has been opened successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trading/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trading/account'] });
      
      // Reset form
      setAmount(1000);
      setLeverage(1);
      setStopLoss(null);
      setTakeProfit(null);
      setLimitPrice(null);
      setStopPrice(null);
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to open position'),
        variant: 'destructive',
      });
    }
  });
  
  // Close position mutation
  const closePosition = useMutation({
    mutationFn: async (positionId: number) => {
      const response = await apiRequest('POST', `/api/paper-trading/positions/${positionId}/close`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Position Closed'),
        description: t('Your trading position has been closed'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trading/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trading/account'] });
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to close position'),
        variant: 'destructive',
      });
    }
  });
  
  // Format currency with $ sign
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };
  
  // Initialize TradingView
  useEffect(() => {
    if (!containerRef.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && containerRef.current) {
        const widget = new window.TradingView.widget({
          symbol: symbol,
          interval: 'D',
          container: containerRef.current,
          datafeed: {
            onReady: (callback: any) => {
              setTimeout(() => callback({
                supported_resolutions: ['1', '5', '15', '30', '60', 'D', 'W', 'M']
              }));
            },
            resolveSymbol: (symbolName: string, onSymbolResolvedCallback: any) => {
              setTimeout(() => onSymbolResolvedCallback({
                name: symbolName,
                description: symbolName,
                type: 'crypto',
                session: '24x7',
                timezone: 'Etc/UTC',
                minmov: 1,
                pricescale: 100000,
                has_intraday: true,
                supported_resolutions: ['1', '5', '15', '30', '60', 'D', 'W', 'M']
              }));
            },
            getBars: (symbolInfo: any, resolution: string, from: number, to: number, onHistoryCallback: any) => {
              onHistoryCallback([], { noData: true });
            },
            subscribeBars: () => {},
            unsubscribeBars: () => {}
          },
          library_path: 'https://s3.tradingview.com/charting_library/',
          locale: 'en',
          enabled_features: [
            'study_templates',
            'use_localstorage_for_settings',
          ],
          charts_storage_url: 'https://saveload.tradingview.com',
          charts_storage_api_version: '1.1',
          client_id: 'capitulre.com',
          user_id: 'public_user',
          theme: 'Dark',
          time_frames: [
            { text: '1d', resolution: 'D' },
            { text: '1w', resolution: 'W' },
            { text: '1m', resolution: 'M' },
          ],
          width: '100%',
          height: '100%',
          autosize: true,
        });
        
        tradingViewRef.current = widget;
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);
  
  const handleOpenPosition = () => {
    if (!account) {
      toast({
        title: 'Error',
        description: 'Trading account not available',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate fields
    if (orderType === 'limit' && !limitPrice) {
      toast({
        title: 'Error',
        description: 'Limit price is required for limit orders',
        variant: 'destructive',
      });
      return;
    }
    
    if (orderType === 'stop' && !stopPrice) {
      toast({
        title: 'Error',
        description: 'Stop price is required for stop orders',
        variant: 'destructive',
      });
      return;
    }
    
    // Create position data
    const positionData = {
      symbol,
      type: orderType,
      side,
      amount,
      leverage,
      stopLoss,
      takeProfit,
      limitPrice: orderType === 'limit' ? limitPrice : null,
      stopPrice: orderType === 'stop' ? stopPrice : null,
    };
    
    createPosition.mutate(positionData);
  };
  
  return (
    <div className={`flex flex-col md:flex-row h-full ${className}`} style={{ height }}>
      {/* TradingView Chart */}
      <div className="flex-1 min-h-[400px] relative">
        <div ref={containerRef} className="absolute inset-0"></div>
      </div>
      
      {/* Trading Panel */}
      <div className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-black/30 backdrop-blur-md border-l border-white/10 flex flex-col">
        {/* Account Info */}
        <Card className="bg-transparent border-b border-white/10 rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-primary" />
              {t('Trading Account')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div className="text-muted-foreground">{t('Balance')}:</div>
              <div className="font-semibold text-right">
                {account ? formatCurrency(account.balance) : '$0.00'}
              </div>
              
              <div className="text-muted-foreground">{t('Equity')}:</div>
              <div className="font-semibold text-right">
                {account ? formatCurrency(account.equity) : '$0.00'}
              </div>
              
              <div className="text-muted-foreground">{t('Available')}:</div>
              <div className="font-semibold text-right">
                {account ? formatCurrency(account.availableMargin) : '$0.00'}
              </div>
              
              <div className="text-muted-foreground">{t('Used Margin')}:</div>
              <div className="font-semibold text-right">
                {account ? formatCurrency(account.usedMargin) : '$0.00'}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Trading/Positions Tabs */}
        <Tabs defaultValue="new-order" className="flex-1 flex flex-col">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-white/10">
            <TabsTrigger value="new-order">{t('New Order')}</TabsTrigger>
            <TabsTrigger value="positions">{t('Positions')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new-order" className="flex-1 p-4 space-y-4 overflow-auto">
            {/* Symbol Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Symbol')}</label>
              <Select
                value={symbol}
                onValueChange={setSymbol}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Symbol')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BINANCE:BTCUSDT">Bitcoin (BTC/USDT)</SelectItem>
                  <SelectItem value="BINANCE:ETHUSDT">Ethereum (ETH/USDT)</SelectItem>
                  <SelectItem value="BINANCE:SOLUSDT">Solana (SOL/USDT)</SelectItem>
                  <SelectItem value="BINANCE:AVAXUSDT">Avalanche (AVAX/USDT)</SelectItem>
                  <SelectItem value="BINANCE:BNBUSDT">Binance Coin (BNB/USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Order Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Order Type')}</label>
              <Select
                value={orderType}
                onValueChange={(value: any) => setOrderType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Order Type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">{t('Market')}</SelectItem>
                  <SelectItem value="limit">{t('Limit')}</SelectItem>
                  <SelectItem value="stop">{t('Stop')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Side buttons (Long/Short) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Side')}</label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={side === 'long' ? 'default' : 'outline'}
                  className={side === 'long' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setSide('long')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t('Long')}
                </Button>
                <Button
                  type="button"
                  variant={side === 'short' ? 'default' : 'outline'}
                  className={side === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setSide('short')}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  {t('Short')}
                </Button>
              </div>
            </div>
            
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Amount (USD)')}</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                min={10}
                max={account?.availableMargin || 0}
              />
            </div>
            
            {/* Leverage */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Leverage')}</label>
              <Select
                value={leverage.toString()}
                onValueChange={(value) => setLeverage(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select Leverage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="10">10x</SelectItem>
                  <SelectItem value="20">20x</SelectItem>
                  <SelectItem value="50">50x</SelectItem>
                  <SelectItem value="100">100x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Limit Price (only for limit orders) */}
            {orderType === 'limit' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Limit Price')}</label>
                <Input
                  type="number"
                  value={limitPrice || ''}
                  onChange={(e) => setLimitPrice(e.target.value ? parseFloat(e.target.value) : null)}
                  step="0.01"
                  min="0"
                />
              </div>
            )}
            
            {/* Stop Price (only for stop orders) */}
            {orderType === 'stop' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Stop Price')}</label>
                <Input
                  type="number"
                  value={stopPrice || ''}
                  onChange={(e) => setStopPrice(e.target.value ? parseFloat(e.target.value) : null)}
                  step="0.01"
                  min="0"
                />
              </div>
            )}
            
            {/* Stop Loss */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Stop Loss Price (optional)')}</label>
              <Input
                type="number"
                value={stopLoss || ''}
                onChange={(e) => setStopLoss(e.target.value ? parseFloat(e.target.value) : null)}
                step="0.01"
                min="0"
              />
            </div>
            
            {/* Take Profit */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Take Profit Price (optional)')}</label>
              <Input
                type="number"
                value={takeProfit || ''}
                onChange={(e) => setTakeProfit(e.target.value ? parseFloat(e.target.value) : null)}
                step="0.01"
                min="0"
              />
            </div>
            
            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleOpenPosition}
              disabled={createPosition.isPending}
            >
              {createPosition.isPending ? 
                t('Opening...') : 
                t('Open {{side}} Position', { side: side === 'long' ? t('Long') : t('Short') })}
            </Button>
            
            {/* Risk Warning */}
            <div className="text-xs text-muted-foreground flex items-start mt-4">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                {t('This is a paper trading simulation. No real money is at risk. Practice with a $150,000 demo account.')}
              </span>
            </div>
          </TabsContent>
          
          <TabsContent value="positions" className="flex-1 flex flex-col">
            <Tabs defaultValue="active" className="flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-white/10">
                <TabsTrigger value="active">{t('Active')}</TabsTrigger>
                <TabsTrigger value="closed">{t('History')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="flex-1 overflow-auto p-0">
                {positionsLoading ? (
                  <div className="h-20 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                ) : Array.isArray(positions) && positions.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {positions.map((position: any) => (
                      <div key={position.id} className="p-3 hover:bg-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{position.symbol}</span>
                          <div className="flex items-center">
                            <span 
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                position.type === 'long' ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                              }`}
                            >
                              {position.type === 'long' ? t('Long') : t('Short')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                          <div className="text-muted-foreground">{t('Size')}:</div>
                          <div className="text-right">
                            {formatCurrency(parseFloat(position.amount.toString()))} 
                            {parseInt(position.leverage.toString()) > 1 && `(${position.leverage}x)`}
                          </div>
                          
                          <div className="text-muted-foreground">{t('Entry')}:</div>
                          <div className="text-right">{position.entryPrice}</div>
                          
                          <div className="text-muted-foreground">{t('Unrealized P/L')}:</div>
                          <div className={`text-right font-medium ${
                            position.unrealizedPnl ? parseFloat(position.unrealizedPnl.toString()) > 0 
                              ? 'text-green-500' 
                              : parseFloat(position.unrealizedPnl.toString()) < 0 
                                ? 'text-red-500' 
                                : ''
                              : ''
                          }`}>
                            {position.unrealizedPnl ? formatCurrency(parseFloat(position.unrealizedPnl.toString())) : '$0.00'}
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => closePosition.mutate(position.id)}
                            disabled={closePosition.isPending}
                          >
                            {t('Close Position')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center p-4 text-center">
                    <BarChart4 className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground mb-1">{t('No active positions')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('Open a position to start trading')}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="closed" className="flex-1 overflow-auto p-0">
                {closedPositionsLoading ? (
                  <div className="h-20 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                ) : Array.isArray(closedPositions) && closedPositions.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {closedPositions.map((position: any) => (
                      <div key={position.id} className="p-3 hover:bg-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{position.symbol}</span>
                          <div className="flex items-center">
                            <span 
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                position.type === 'long' ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                              }`}
                            >
                              {position.type === 'long' ? t('Long') : t('Short')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-muted-foreground">{t('Size')}:</div>
                          <div className="text-right">
                            {formatCurrency(parseFloat(position.amount.toString()))} 
                            {parseInt(position.leverage.toString()) > 1 && `(${position.leverage}x)`}
                          </div>
                          
                          <div className="text-muted-foreground">{t('Entry')}:</div>
                          <div className="text-right">{position.entryPrice}</div>
                          
                          <div className="text-muted-foreground">{t('Exit')}:</div>
                          <div className="text-right">{position.exitPrice}</div>
                          
                          <div className="text-muted-foreground">{t('P/L')}:</div>
                          <div className={`text-right font-medium ${
                            position.profitLoss ? parseFloat(position.profitLoss.toString()) > 0 
                              ? 'text-green-500' 
                              : parseFloat(position.profitLoss.toString()) < 0 
                                ? 'text-red-500' 
                                : ''
                              : ''
                          }`}>
                            {position.profitLoss ? formatCurrency(parseFloat(position.profitLoss.toString())) : '$0.00'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center p-4 text-center">
                    <BarChart4 className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground mb-1">{t('No position history')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('Closed positions will appear here')}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Create global TradingView interface for TypeScript
declare global {
  interface Window {
    TradingView: any;
  }
}