import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Position } from '@shared/schema';

interface ProTradingViewPanelProps {
  symbol: string;
  currentPrice?: number;
  onOrderSubmit?: (orderData: any) => void;
  accountBalance?: number;
}

export function ProTradingViewPanel({ 
  symbol, 
  currentPrice = 0, 
  onOrderSubmit,
  accountBalance = 150000 
}: ProTradingViewPanelProps) {
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop' | 'Stop Limit'>('Market');
  const [orderSide, setOrderSide] = useState<'Long' | 'Short'>('Long');
  const [amount, setAmount] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(1);
  const [price, setPrice] = useState<number>(currentPrice);
  const [stopPrice, setStopPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [amountType, setAmountType] = useState<'Token' | 'USD'>('USD');
  const [effectivePositionSize, setEffectivePositionSize] = useState<number>(0);
  const [usePercentage, setUsePercentage] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { data: activePositions = [] } = useQuery<Position[]>({
    queryKey: ['/api/positions', 'active'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/positions?status=active');
      return response.json();
    },
  });

  const { data: closedPositions = [] } = useQuery<Position[]>({
    queryKey: ['/api/positions', 'closed'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/positions?status=closed');
      return response.json();
    },
  });

  useEffect(() => {
    if (currentPrice > 0) {
      setPrice(currentPrice);
    }
  }, [currentPrice]);

  useEffect(() => {
    calculateEffectivePositionSize();
  }, [amount, leverage, price, amountType]);

  const calculateEffectivePositionSize = () => {
    if (amountType === 'USD') {
      setEffectivePositionSize(amount * leverage);
    } else {
      setEffectivePositionSize(amount * price * leverage);
    }
  };

  const handleAmountPercentage = (percentage: number) => {
    const calculatedAmount = accountBalance * (percentage / 100);
    setAmount(Number(calculatedAmount.toFixed(2)));
  };

  const handleSubmitOrder = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        symbol,
        type: orderSide.toLowerCase(),
        amount: Number(amount),
        entryPrice: orderType === 'Market' ? currentPrice : Number(price),
        leverage: Number(leverage),
        stopLoss: stopLoss ? Number(stopLoss) : null,
        takeProfit: takeProfit ? Number(takeProfit) : null,
        orderType: orderType.toLowerCase().replace(' ', '_')
      };

      const response = await apiRequest('POST', '/api/positions', orderData);
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Order Placed Successfully",
          description: `Your ${orderSide} position has been opened.`,
          variant: "default"
        });

        // Invalidate positions queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
        
        // Reset form fields
        setAmount(0);
        setStopLoss(null);
        setTakeProfit(null);

        if (onOrderSubmit) {
          onOrderSubmit(data);
        }
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClosePosition = async (positionId: number) => {
    try {
      const response = await apiRequest('PUT', `/api/positions/${positionId}/close`, {
        exitPrice: currentPrice
      });

      if (response.ok) {
        toast({
          title: "Position Closed",
          description: "Your position has been closed successfully.",
          variant: "default"
        });
        
        // Invalidate positions queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to close position');
      }
    } catch (error: any) {
      toast({
        title: "Failed to Close Position",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number | string | null) => {
    if (value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(Number(value));
  };

  const getPositionPnL = (position: Position) => {
    if (position.status === 'closed' && position.profitLoss) {
      return Number(position.profitLoss);
    }
    
    if (position.status === 'active' && currentPrice > 0) {
      const entryPrice = Number(position.entryPrice);
      const positionSize = Number(position.amount) * Number(position.leverage);
      
      if (position.type === 'long') {
        return positionSize * ((currentPrice - entryPrice) / entryPrice);
      } else {
        return positionSize * ((entryPrice - currentPrice) / entryPrice);
      }
    }
    
    return 0;
  };

  const calculateTotalBalance = () => {
    // Account balance plus unrealized PnL from active positions
    const unrealizedPnL = activePositions.reduce((total, position) => {
      return total + getPositionPnL(position);
    }, 0);
    
    return accountBalance + unrealizedPnL;
  };

  // Sort active positions by newest first
  const sortedActivePositions = [...activePositions].sort((a, b) => 
    new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
  );

  // Sort closed positions by newest first
  const sortedClosedPositions = [...closedPositions].sort((a, b) => 
    new Date(b.exitTime || b.entryTime).getTime() - new Date(a.exitTime || a.entryTime).getTime()
  );

  return (
    <div className="w-[320px] bg-[#131722] text-white rounded-md border border-[#2a2e39] p-2 h-full overflow-y-auto">
      <Tabs defaultValue="orders">
        <TabsList className="w-full bg-[#1E222D] mb-4">
          <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
          <TabsTrigger value="positions" className="flex-1">Positions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4">
          <div className="space-y-3">
            <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
              <SelectTrigger className="w-full bg-[#1E222D] border-[#363A45]">
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E222D] border-[#363A45]">
                <SelectItem value="Market">Market</SelectItem>
                <SelectItem value="Limit">Limit</SelectItem>
                <SelectItem value="Stop">Stop</SelectItem>
                <SelectItem value="Stop Limit">Stop Limit</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => setOrderSide('Long')}
                className={`py-6 ${orderSide === 'Long' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1E222D] hover:bg-[#282D3D]'}`}
              >
                Long
              </Button>
              <Button 
                onClick={() => setOrderSide('Short')}
                className={`py-6 ${orderSide === 'Short' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1E222D] hover:bg-[#282D3D]'}`}
              >
                Short
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Amount</div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setUsePercentage(!usePercentage)} 
                  className={`px-2 py-1 text-xs rounded ${usePercentage ? 'bg-blue-600' : 'bg-[#1E222D]'}`}
                >
                  Use %
                </button>
                <Select value={amountType} onValueChange={(value: any) => setAmountType(value)}>
                  <SelectTrigger className="h-7 w-20 bg-[#1E222D] border-[#363A45] text-xs">
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E222D] border-[#363A45]">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="Token">Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="w-full">
              <Input
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                type="number"
                placeholder="0.00"
                className="bg-[#1E222D] border-[#363A45]"
              />
              
              {usePercentage && (
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {[0.25, 0.5, 0.75, 1, 2].map((percent) => (
                    <Button 
                      key={percent}
                      onClick={() => handleAmountPercentage(percent)}
                      variant="outline" 
                      className="h-8 text-xs bg-[#1E222D] border-[#363A45] hover:bg-[#282D3D]"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-5 gap-1 mt-2">
                {[1, 5, 10, 20, 50].map((level) => (
                  <Button 
                    key={level}
                    onClick={() => setLeverage(level)}
                    variant="outline" 
                    className={`h-8 text-xs ${leverage === level ? 'bg-blue-600 border-blue-600' : 'bg-[#1E222D] border-[#363A45]'} hover:bg-[#282D3D]`}
                  >
                    {level}x
                  </Button>
                ))}
              </div>
            </div>
            
            {orderType !== 'Market' && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Price</div>
                <Input
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  type="number"
                  placeholder="0.00"
                  className="bg-[#1E222D] border-[#363A45]"
                />
              </div>
            )}
            
            {(orderType === 'Stop' || orderType === 'Stop Limit') && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Stop Price</div>
                <Input
                  value={stopPrice || ''}
                  onChange={(e) => setStopPrice(Number(e.target.value))}
                  type="number"
                  placeholder="0.00"
                  className="bg-[#1E222D] border-[#363A45]"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={takeProfit !== null}
                    onChange={(e) => setTakeProfit(e.target.checked ? (currentPrice * 1.05) : null)}
                  />
                  Take Profit
                </label>
                <label className="text-sm font-medium flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={stopLoss !== null}
                    onChange={(e) => setStopLoss(e.target.checked ? (currentPrice * 0.95) : null)}
                  />
                  Stop Loss
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {takeProfit !== null && (
                  <Input
                    value={takeProfit || ''}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    type="number"
                    placeholder="Take Profit"
                    className="bg-[#1E222D] border-[#363A45]"
                  />
                )}
                {stopLoss !== null && (
                  <Input
                    value={stopLoss || ''}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    type="number"
                    placeholder="Stop Loss"
                    className="bg-[#1E222D] border-[#363A45]"
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-[#363A45]">
              <div className="grid grid-cols-2 text-xs">
                <div className="text-gray-400">Order Value:</div>
                <div className="text-right">{formatCurrency(amount)}</div>
              </div>
              <div className="grid grid-cols-2 text-xs">
                <div className="text-gray-400">Leverage:</div>
                <div className="text-right">{leverage}x</div>
              </div>
              <div className="grid grid-cols-2 text-xs">
                <div className="text-gray-400">Effective Position Size:</div>
                <div className="text-right">{formatCurrency(effectivePositionSize)}</div>
              </div>
            </div>
            
            <Button 
              onClick={handleSubmitOrder}
              className={`w-full py-6 ${orderSide === 'Long' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {orderSide === 'Long' ? 'Buy / Long' : 'Sell / Short'} {symbol}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="positions">
          <div className="space-y-4">
            <div className="bg-[#1E222D] p-3 rounded">
              <div className="grid grid-cols-2 mb-2">
                <div className="text-sm text-gray-400">Account Balance</div>
                <div className="text-right font-semibold">{formatCurrency(accountBalance)}</div>
              </div>
              <div className="grid grid-cols-2 mb-2">
                <div className="text-sm text-gray-400">Equity</div>
                <div className="text-right font-semibold">{formatCurrency(calculateTotalBalance())}</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-400">Active Positions</h3>
              {sortedActivePositions.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-400">No active positions</div>
              ) : (
                sortedActivePositions.map((position) => {
                  const pnl = getPositionPnL(position);
                  const pnlColor = pnl >= 0 ? 'text-green-500' : 'text-red-500';
                  
                  return (
                    <div key={position.id} className="bg-[#1E222D] p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className={position.type === 'long' ? 'text-green-500' : 'text-red-500'}>
                            {position.type === 'long' ? 'Long' : 'Short'}
                          </span>
                          <span className="ml-2">{position.symbol}</span>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleClosePosition(position.id)}
                        >
                          Close
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 text-xs gap-y-1">
                        <div className="text-gray-400">Size:</div>
                        <div className="text-right">{formatCurrency(Number(position.amount) * Number(position.leverage))}</div>
                        <div className="text-gray-400">Entry Price:</div>
                        <div className="text-right">{formatCurrency(position.entryPrice)}</div>
                        <div className="text-gray-400">Mark Price:</div>
                        <div className="text-right">{formatCurrency(currentPrice)}</div>
                        <div className="text-gray-400">Leverage:</div>
                        <div className="text-right">{position.leverage}x</div>
                        <div className="text-gray-400">PNL:</div>
                        <div className={`text-right ${pnlColor}`}>
                          {formatCurrency(pnl)} ({(pnl / (Number(position.amount) * Number(position.leverage)) * 100).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-400">Closed Positions</h3>
              {sortedClosedPositions.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-400">No closed positions</div>
              ) : (
                sortedClosedPositions.slice(0, 5).map((position) => {
                  const pnlValue = Number(position.profitLoss);
                  const pnlColor = pnlValue >= 0 ? 'text-green-500' : 'text-red-500';
                  
                  return (
                    <div key={position.id} className="bg-[#1E222D] p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className={position.type === 'long' ? 'text-green-500' : 'text-red-500'}>
                            {position.type === 'long' ? 'Long' : 'Short'}
                          </span>
                          <span className="ml-2">{position.symbol}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(position.exitTime || position.entryTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 text-xs gap-y-1">
                        <div className="text-gray-400">Size:</div>
                        <div className="text-right">{formatCurrency(Number(position.amount) * Number(position.leverage))}</div>
                        <div className="text-gray-400">Entry Price:</div>
                        <div className="text-right">{formatCurrency(position.entryPrice)}</div>
                        <div className="text-gray-400">Exit Price:</div>
                        <div className="text-right">{formatCurrency(position.exitPrice)}</div>
                        <div className="text-gray-400">PNL:</div>
                        <div className={`text-right ${pnlColor}`}>
                          {formatCurrency(position.profitLoss)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {sortedClosedPositions.length > 5 && (
                <div className="text-center mt-2">
                  <Button variant="link" size="sm" className="text-xs">
                    View all {sortedClosedPositions.length} closed positions
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}