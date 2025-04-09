import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProTradingViewWidget } from '@/components/ProTradingViewWidget';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Position } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  DollarSign, 
  Percent, 
  AlertCircle 
} from 'lucide-react';

// TradingView integration page with Paper Trading
const ProPaperTrading: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState('BINANCE:BTCUSDT');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [positions, setPositions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [accountBalance, setAccountBalance] = useState(150000); // Default paper trading balance
  const [accountValue, setAccountValue] = useState(150000);
  
  // Fetch user's positions
  const {
    data: userPositions,
    isLoading: positionsLoading,
    error: positionsError,
  } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
  });
  
  // Create position mutation
  const createPositionMutation = useMutation({
    mutationFn: async (position: any) => {
      const response = await apiRequest('POST', '/api/positions', position);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({
        title: t('Position Created'),
        description: t('Your trading position has been created successfully.'),
      });
      
      // Reset form fields
      setAmount('');
      setStopLoss('');
      setTakeProfit('');
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to create position.'),
        variant: 'destructive',
      });
    },
  });
  
  // Close position mutation
  const closePositionMutation = useMutation({
    mutationFn: async ({ id, exitPrice }: { id: number, exitPrice: number }) => {
      const response = await apiRequest('PUT', `/api/positions/${id}/close`, { exitPrice });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({
        title: t('Position Closed'),
        description: t('Your trading position has been closed successfully.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to close position.'),
        variant: 'destructive',
      });
    },
  });
  
  // Format positions for display
  useEffect(() => {
    if (userPositions) {
      const formattedPositions = userPositions.map(position => ({
        id: position.id,
        symbol: position.symbol,
        type: position.type,
        amount: position.amount,
        leverage: position.leverage,
        entryPrice: position.entryPrice,
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        entryTime: new Date(position.entryTime).toLocaleString(),
        exitPrice: position.exitPrice,
        exitTime: position.exitTime ? new Date(position.exitTime).toLocaleString() : null,
        profitLoss: position.profitLoss || calculatePnL(position),
        status: position.status,
      }));
      
      setPositions(formattedPositions);
      
      // Update account value
      const totalPnL = formattedPositions
        .filter(pos => pos.status === 'active')
        .reduce((sum, pos) => sum + (parseFloat(String(pos.profitLoss || 0))), 0);
      
      setAccountValue(parseFloat(String(accountBalance)) + totalPnL);
    }
  }, [userPositions, currentPrice, accountBalance]);
  
  // Calculate P&L for a position
  const calculatePnL = (position: Position) => {
    if (position.status === 'closed' && position.exitPrice) {
      const exitPrice = parseFloat(String(position.exitPrice));
      const entryPrice = parseFloat(String(position.entryPrice));
      const amount = parseFloat(String(position.amount));
      const leverage = parseFloat(String(position.leverage || 1));
      
      const diff = position.type === 'long' 
        ? exitPrice - entryPrice
        : entryPrice - exitPrice;
      
      return diff * amount * leverage;
    } else if (position.status === 'active' && currentPrice > 0) {
      const entryPrice = parseFloat(String(position.entryPrice));
      const amount = parseFloat(String(position.amount));
      const leverage = parseFloat(String(position.leverage || 1));
      
      const diff = position.type === 'long'
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
      
      return diff * amount * leverage;
    }
    
    return 0;
  };
  
  // Calculate P&L percentage
  const calculatePnLPercentage = (position: any) => {
    const entryPrice = parseFloat(String(position.entryPrice));
    const amount = parseFloat(String(position.amount));
    const profitLoss = parseFloat(String(position.profitLoss || 0));
    
    const entryValue = entryPrice * amount;
    if (entryValue === 0) return 0;
    
    return (profitLoss / entryValue) * 100;
  };
  
  // Handle creating a long position
  const handleLongPosition = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: t('Invalid Amount'),
        description: t('Please enter a valid amount.'),
        variant: 'destructive',
      });
      return;
    }
    
    const newPosition = {
      symbol: currentSymbol,
      type: 'long',
      amount: parseFloat(amount),
      leverage: parseInt(leverage) || 1,
      entryPrice: currentPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
    };
    
    createPositionMutation.mutate(newPosition);
  };
  
  // Handle creating a short position
  const handleShortPosition = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: t('Invalid Amount'),
        description: t('Please enter a valid amount.'),
        variant: 'destructive',
      });
      return;
    }
    
    const newPosition = {
      symbol: currentSymbol,
      type: 'short',
      amount: parseFloat(amount),
      leverage: parseInt(leverage) || 1,
      entryPrice: currentPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
    };
    
    createPositionMutation.mutate(newPosition);
  };
  
  // Close a position
  const closePosition = (positionId: number) => {
    closePositionMutation.mutate({ id: positionId, exitPrice: currentPrice });
  };
  
  // Symbol change handler
  const handleSymbolChange = (symbol: string) => {
    setCurrentSymbol(symbol);
  };
  
  // Price update handler
  const handlePriceUpdate = (price: number) => {
    setCurrentPrice(price);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Format percent
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };
  
  return (
    <div className={`flex flex-col min-h-screen bg-[#131722] ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      {!isFullScreen && <Header />}
      
      <main className="flex-1 w-full p-0">
        {!isFullScreen && (
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-4 text-white">
              {t('Pro TradingView Paper Trading')}
            </h1>
            <p className="text-[#9598A1] mb-4">
              {t('Practice trading with a $150,000 virtual account using our professional TradingView integration')}
            </p>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-200px)]">
          {/* Left: TradingView Widget */}
          <div className={`${isFullScreen ? 'w-full h-full' : 'lg:w-2/3 h-full'}`}>
            <ProTradingViewWidget
              initialSymbol={currentSymbol}
              onSymbolChange={handleSymbolChange}
              isFullScreen={isFullScreen}
              onFullScreenChange={setIsFullScreen}
              onReplayModeChange={(isReplay) => console.log('Replay mode:', isReplay)}
              className="h-full"
            />
          </div>
          
          {/* Right: Trading Panel */}
          {!isFullScreen && (
            <div className="lg:w-1/3 bg-[#1E222D] border-l border-[#2A2E39] overflow-y-auto">
              {/* Account Summary */}
              <div className="p-4 border-b border-[#2A2E39]">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[#131722] border-[#2A2E39]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-white">
                        {t('Account Balance')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(accountBalance)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#131722] border-[#2A2E39]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-white">
                        {t('Account Value')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-xl font-bold ${accountValue >= accountBalance ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                        {formatCurrency(accountValue)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* New Position Form */}
              <div className="p-4 border-b border-[#2A2E39]">
                <h3 className="text-lg font-medium text-white mb-4">
                  {t('New Position')}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-[#9598A1]">
                        {t('Amount')}
                      </Label>
                      <Input
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-[#131722] border-[#2A2E39] text-white"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="leverage" className="text-[#9598A1]">
                        {t('Leverage')}
                      </Label>
                      <Select value={leverage} onValueChange={setLeverage}>
                        <SelectTrigger className="bg-[#131722] border-[#2A2E39] text-white">
                          <SelectValue placeholder={t('Select leverage')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E222D] border-[#2A2E39]">
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
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stopLoss" className="text-[#9598A1]">
                        {t('Stop Loss (optional)')}
                      </Label>
                      <Input
                        id="stopLoss"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="bg-[#131722] border-[#2A2E39] text-white"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="takeProfit" className="text-[#9598A1]">
                        {t('Take Profit (optional)')}
                      </Label>
                      <Input
                        id="takeProfit"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        className="bg-[#131722] border-[#2A2E39] text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                      className="w-full bg-[#F23645] hover:bg-[#F23645]/90 text-white font-medium"
                      onClick={handleShortPosition}
                      disabled={createPositionMutation.isPending}
                    >
                      <ArrowDownRight className="h-4 w-4 mr-2" />
                      {t('SELL / SHORT')}
                    </Button>
                    
                    <Button
                      className="w-full bg-[#089981] hover:bg-[#089981]/90 text-white font-medium"
                      onClick={handleLongPosition}
                      disabled={createPositionMutation.isPending}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      {t('BUY / LONG')}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Positions */}
              <div className="p-4">
                <Tabs defaultValue="active">
                  <TabsList className="grid grid-cols-2 bg-[#131722]">
                    <TabsTrigger 
                      value="active" 
                      className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white"
                    >
                      {t('Active Positions')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="closed" 
                      className="data-[state=active]:bg-[#2962FF] data-[state=active]:text-white"
                    >
                      {t('Position History')}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="active" className="mt-4">
                    {positionsLoading ? (
                      <div className="text-center text-[#9598A1] py-6">
                        {t('Loading positions...')}
                      </div>
                    ) : positions.filter(pos => pos.status === 'active').length === 0 ? (
                      <div className="text-center text-[#9598A1] py-6">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>{t('No active positions')}</p>
                        <p className="text-sm">{t('Open a position to start trading')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {positions
                          .filter(pos => pos.status === 'active')
                          .map(position => (
                            <Card key={position.id} className="bg-[#131722] border-[#2A2E39]">
                              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div>
                                  <CardTitle className="text-white flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${position.type === 'long' ? 'bg-[#089981]' : 'bg-[#F23645]'}`} />
                                    {position.symbol.split(':').pop()}
                                  </CardTitle>
                                  <CardDescription>
                                    {position.type === 'long' ? t('Long') : t('Short')} &middot; {position.leverage}x
                                  </CardDescription>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-[#2A2E39] hover:bg-[#2A2E39] text-white"
                                  onClick={() => closePosition(position.id)}
                                  disabled={closePositionMutation.isPending}
                                >
                                  {t('Close')}
                                </Button>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                  <div className="flex items-center text-[#9598A1]">
                                    <DollarSign className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {t('Entry')}: {position.entryPrice.toFixed(2)}
                                  </div>
                                  <div className="flex items-center text-[#9598A1]">
                                    <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {new Date(position.entryTime).toLocaleString()}
                                  </div>
                                  <div className="flex items-center text-[#9598A1]">
                                    <DollarSign className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {t('Amount')}: {position.amount.toFixed(2)}
                                  </div>
                                  <div className={`flex items-center font-medium ${position.profitLoss >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                    <Percent className="h-3.5 w-3.5 mr-1" />
                                    {(position.profitLoss >= 0 ? '+' : '') + calculatePnLPercentage(position).toFixed(2)}%
                                  </div>
                                  <div className="col-span-2">
                                    <div className={`text-lg font-bold ${position.profitLoss >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                      {(position.profitLoss >= 0 ? '+' : '') + formatCurrency(position.profitLoss)}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="closed" className="mt-4">
                    {positionsLoading ? (
                      <div className="text-center text-[#9598A1] py-6">
                        {t('Loading positions...')}
                      </div>
                    ) : positions.filter(pos => pos.status === 'closed').length === 0 ? (
                      <div className="text-center text-[#9598A1] py-6">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>{t('No closed positions')}</p>
                        <p className="text-sm">{t('Your trading history will appear here')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {positions
                          .filter(pos => pos.status === 'closed')
                          .map(position => (
                            <Card key={position.id} className="bg-[#131722] border-[#2A2E39]">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-white flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${position.type === 'long' ? 'bg-[#089981]' : 'bg-[#F23645]'}`} />
                                  {position.symbol.split(':').pop()}
                                </CardTitle>
                                <CardDescription>
                                  {position.type === 'long' ? t('Long') : t('Short')} &middot; {position.leverage}x
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                  <div className="flex items-center text-[#9598A1]">
                                    <DollarSign className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {t('Entry')}: {position.entryPrice.toFixed(2)}
                                  </div>
                                  <div className="flex items-center text-[#9598A1]">
                                    <DollarSign className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {t('Exit')}: {position.exitPrice.toFixed(2)}
                                  </div>
                                  <div className="flex items-center text-[#9598A1]">
                                    <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {t('Opened')}: {new Date(position.entryTime).toLocaleString()}
                                  </div>
                                  <div className="flex items-center text-[#9598A1]">
                                    <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {t('Closed')}: {position.exitTime}
                                  </div>
                                  <div className="flex items-center text-[#9598A1]">
                                    <DollarSign className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {t('Amount')}: {position.amount.toFixed(2)}
                                  </div>
                                  <div className={`flex items-center font-medium ${position.profitLoss >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                    <Percent className="h-3.5 w-3.5 mr-1" />
                                    {(position.profitLoss >= 0 ? '+' : '') + calculatePnLPercentage(position).toFixed(2)}%
                                  </div>
                                  <div className="col-span-2">
                                    <div className={`text-lg font-bold ${position.profitLoss >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                      {(position.profitLoss >= 0 ? '+' : '') + formatCurrency(position.profitLoss)}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {!isFullScreen && <Footer />}
    </div>
  );
};

export default ProPaperTrading;