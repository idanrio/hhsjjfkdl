import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Position } from '@/types/trading';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowUpRight,
  ArrowDownRight,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  AlertCircle,
  ArrowRightLeft,
  DollarSign,
  Percent,
  Timer,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

interface ProTradingPanelProps {
  currentPrice: number;
  symbol: string;
  positions: Position[];
  onCreatePosition: (position: Omit<Position, 'id' | 'status' | 'entryTime'>) => void;
  onClosePosition: (positionId: string) => void;
  onUpdatePosition: (position: Position) => void;
  className?: string;
}

/**
 * Professional Trading Panel component
 * 
 * Provides a full-featured trading panel with order capabilities
 * identical to TradingView Pro's trading panel
 */
export function ProTradingPanel({
  currentPrice,
  symbol,
  positions,
  onCreatePosition,
  onClosePosition,
  onUpdatePosition,
  className = '',
}: ProTradingPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('market');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop_limit'>('market');
  const [tradeType, setTradeType] = useState<'long' | 'short'>('long');
  const [tradeAmount, setTradeAmount] = useState<string>('0.01');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toFixed(2));
  const [stopPrice, setStopPrice] = useState<string>((currentPrice * 0.95).toFixed(2));
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(1);
  const [positionsToShow, setPositionsToShow] = useState<'active' | 'closed' | 'all'>('active');
  const [usePercentage, setUsePercentage] = useState<boolean>(false);
  const [amountUnit, setAmountUnit] = useState<'tokens' | 'quote'>('tokens');
  const [reductionOnly, setReductionOnly] = useState<boolean>(false);
  const [enableTakeProfitFromOrder, setEnableTakeProfitFromOrder] = useState<boolean>(false);
  const [enableStopLossFromOrder, setEnableStopLossFromOrder] = useState<boolean>(false);
  
  // Update the limit price when the current price changes
  useEffect(() => {
    setLimitPrice(currentPrice.toFixed(2));
    setStopPrice((currentPrice * 0.95).toFixed(2));
  }, [currentPrice]);
  
  // Calculate position value
  const getPositionValue = (position: Position) => {
    return position.amount * (position.exitPrice || currentPrice) * position.leverage;
  };
  
  // Calculate PNL (Profit and Loss)
  const calculatePnL = (position: Position) => {
    const currentValuePerUnit = position.exitPrice || currentPrice;
    const entryValue = position.entryPrice * position.amount * position.leverage;
    const currentValue = currentValuePerUnit * position.amount * position.leverage;
    
    if (position.type === 'long') {
      return currentValue - entryValue;
    } else {
      return entryValue - currentValue;
    }
  };
  
  // Calculate PNL percentage
  const calculatePnLPercentage = (position: Position) => {
    const pnl = calculatePnL(position);
    const entryValue = position.entryPrice * position.amount * position.leverage;
    return (pnl / entryValue) * 100;
  };
  
  // Filter positions based on the selected tab
  const filteredPositions = positions.filter(position => {
    if (positionsToShow === 'active') return position.status === 'active';
    if (positionsToShow === 'closed') return position.status === 'closed';
    return true; // 'all'
  });
  
  // Handle creating a position
  const handleCreatePosition = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(t('Please enter a valid amount'));
      return;
    }
    
    try {
      // Create stop loss and take profit values if enabled
      let stopLoss = null;
      let takeProfit = null;
      
      if (enableStopLossFromOrder) {
        if (stopLossPrice) {
          stopLoss = parseFloat(stopLossPrice);
        } else {
          // Default stop loss values if none provided
          stopLoss = tradeType === 'long' 
            ? currentPrice * 0.95  // 5% below current price for long
            : currentPrice * 1.05; // 5% above current price for short
        }
      }
      
      if (enableTakeProfitFromOrder) {
        if (takeProfitPrice) {
          takeProfit = parseFloat(takeProfitPrice);
        } else {
          // Default take profit values if none provided
          takeProfit = tradeType === 'long' 
            ? currentPrice * 1.1   // 10% above current price for long
            : currentPrice * 0.9;  // 10% below current price for short
        }
      }
      
      // Create the position based on the order type
      if (orderType === 'market') {
        onCreatePosition({
          type: tradeType,
          entryPrice: currentPrice,
          amount,
          leverage,
          stopLoss,
          takeProfit
        });
        
        // Reset form values after successful creation
        if (!reductionOnly) {
          setTradeAmount('0.01');
          setTakeProfitPrice('');
          setStopLossPrice('');
          setEnableTakeProfitFromOrder(false);
          setEnableStopLossFromOrder(false);
        }
      } else if (orderType === 'limit') {
        // For limit orders, we would actually create an order, not a position
        // In a real system, this would go to an order book
        const limitPriceValue = parseFloat(limitPrice);
        if (isNaN(limitPriceValue)) {
          alert(t('Please enter a valid limit price'));
          return;
        }
        
        // In a backtesting environment, we can simulate the limit order immediately
        // if the price is favorable
        if ((tradeType === 'long' && currentPrice <= limitPriceValue) || 
            (tradeType === 'short' && currentPrice >= limitPriceValue)) {
          onCreatePosition({
            type: tradeType,
            entryPrice: limitPriceValue,
            amount,
            leverage,
            stopLoss,
            takeProfit
          });
        } else {
          alert(t('Limit order would be placed in a real system. For demo purposes, orders execute only if price is already favorable.'));
        }
      } else if (orderType === 'stop' || orderType === 'stop_limit') {
        const stopPriceValue = parseFloat(stopPrice);
        if (isNaN(stopPriceValue)) {
          alert(t('Please enter a valid stop price'));
          return;
        }
        
        // In a backtesting environment, we can simulate the stop order immediately
        // if the price is favorable
        if ((tradeType === 'long' && currentPrice >= stopPriceValue) || 
            (tradeType === 'short' && currentPrice <= stopPriceValue)) {
          onCreatePosition({
            type: tradeType,
            entryPrice: orderType === 'stop_limit' ? parseFloat(limitPrice) : stopPriceValue,
            amount,
            leverage,
            stopLoss,
            takeProfit
          });
        } else {
          alert(t('Stop order would be placed in a real system. For demo purposes, orders execute only if price is already favorable.'));
        }
      }
    } catch (error) {
      console.error('Error creating position:', error);
      alert(t('Error creating position. Please try again.'));
    }
  };
  
  // Quick buy at market buttons
  const quickAmounts = [0.25, 0.5, 0.75, 1, 2, 5];
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{t('Trade')}: {symbol}</span>
          <Badge variant={tradeType === 'long' ? 'default' : 'destructive'} className="ml-2">
            {currentPrice.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid grid-cols-2 rounded-none">
            <TabsTrigger value="orders">{t('Orders')}</TabsTrigger>
            <TabsTrigger value="positions">{t('Positions')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="p-4 space-y-4">
            {/* Order Type Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('Order Type')}</Label>
                <Select value={orderType} onValueChange={(value) => setOrderType(value as any)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t('Select Type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">{t('Market')}</SelectItem>
                    <SelectItem value="limit">{t('Limit')}</SelectItem>
                    <SelectItem value="stop">{t('Stop')}</SelectItem>
                    <SelectItem value="stop_limit">{t('Stop Limit')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Trade Direction */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={tradeType === 'long' ? 'default' : 'outline'}
                  className={tradeType === 'long' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setTradeType('long')}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  {t('Long')}
                </Button>
                <Button 
                  variant={tradeType === 'short' ? 'default' : 'outline'}
                  className={tradeType === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setTradeType('short')}
                >
                  <ArrowDownRight className="mr-2 h-4 w-4" />
                  {t('Short')}
                </Button>
              </div>
              
              {/* Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('Amount')}</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="use-percentage" className="text-xs">{t('Use %')}</Label>
                    <Switch 
                      id="use-percentage" 
                      checked={usePercentage}
                      onCheckedChange={setUsePercentage}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Input 
                    type="number" 
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    step={0.01}
                    min={0}
                  />
                  <Select value={amountUnit} onValueChange={(v) => setAmountUnit(v as any)}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tokens">{t('Tokens')}</SelectItem>
                      <SelectItem value="quote">{t('USD')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Quick amounts */}
              <div className="grid grid-cols-6 gap-1">
                {quickAmounts.map((amount) => (
                  <Button 
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTradeAmount(amount.toString())}
                    className="text-xs py-1 h-7"
                  >
                    {usePercentage ? `${amount * 10}%` : amount}
                  </Button>
                ))}
              </div>
              
              {/* Price inputs based on order type */}
              {orderType !== 'market' && (
                <div className="space-y-2">
                  {(orderType === 'limit' || orderType === 'stop_limit') && (
                    <div className="flex items-center justify-between">
                      <Label>{t('Limit Price')}</Label>
                      <Input 
                        type="number" 
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-[120px]"
                        step={0.01}
                        min={0}
                      />
                    </div>
                  )}
                  
                  {(orderType === 'stop' || orderType === 'stop_limit') && (
                    <div className="flex items-center justify-between">
                      <Label>{t('Stop Price')}</Label>
                      <Input 
                        type="number" 
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        className="w-[120px]"
                        step={0.01}
                        min={0}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Leverage slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('Leverage')}</Label>
                  <Badge variant="outline">{leverage}x</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLeverage(Math.max(1, leverage - 1))}
                    disabled={leverage <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 flex justify-around">
                    {[1, 5, 10, 20, 50, 100].map((lev) => (
                      <Button 
                        key={lev}
                        variant={leverage === lev ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLeverage(lev)}
                        className="px-2"
                      >
                        {lev}x
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLeverage(Math.min(100, leverage + 1))}
                    disabled={leverage >= 100}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Take Profit / Stop Loss */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="tp-switch" 
                      checked={enableTakeProfitFromOrder}
                      onCheckedChange={setEnableTakeProfitFromOrder}
                    />
                    <Label htmlFor="tp-switch">{t('Take Profit')}</Label>
                  </div>
                  {enableTakeProfitFromOrder && (
                    <Input 
                      type="number" 
                      value={takeProfitPrice}
                      onChange={(e) => setTakeProfitPrice(e.target.value)}
                      className="w-[120px]"
                      step={0.01}
                      min={0}
                      placeholder={tradeType === 'long' ? 
                        (currentPrice * 1.05).toFixed(2) : 
                        (currentPrice * 0.95).toFixed(2)
                      }
                    />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="sl-switch" 
                      checked={enableStopLossFromOrder}
                      onCheckedChange={setEnableStopLossFromOrder}
                    />
                    <Label htmlFor="sl-switch">{t('Stop Loss')}</Label>
                  </div>
                  {enableStopLossFromOrder && (
                    <Input 
                      type="number" 
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(e.target.value)}
                      className="w-[120px]"
                      step={0.01}
                      min={0}
                      placeholder={tradeType === 'long' ? 
                        (currentPrice * 0.95).toFixed(2) : 
                        (currentPrice * 1.05).toFixed(2)
                      }
                    />
                  )}
                </div>
              </div>
              
              {/* Additional options */}
              <div className="flex items-center space-x-2">
                <Switch 
                  id="reduction-only" 
                  checked={reductionOnly}
                  onCheckedChange={setReductionOnly}
                />
                <Label htmlFor="reduction-only">{t('Reduce Only')}</Label>
              </div>
              
              {/* Order summary */}
              <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>{t('Order Value')}:</span>
                  <span>${(parseFloat(tradeAmount || '0') * currentPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('Leverage')}:</span>
                  <span>{leverage}x</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('Effective Position Size')}:</span>
                  <span>${(parseFloat(tradeAmount || '0') * currentPrice * leverage).toFixed(2)}</span>
                </div>
              </div>
              
              {/* Submit Order Button */}
              <Button 
                className="w-full"
                variant={tradeType === 'long' ? 'default' : 'destructive'}
                onClick={handleCreatePosition}
              >
                {orderType === 'market' ? 
                  `${t(tradeType === 'long' ? 'Buy / Long' : 'Sell / Short')} ${t('Market')}` : 
                  t('Place Order')
                }
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="positions" className="p-0">
            <div className="flex justify-between p-3 border-b">
              <Select value={positionsToShow} onValueChange={(v) => setPositionsToShow(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('Active Positions')}</SelectItem>
                  <SelectItem value="closed">{t('Closed Positions')}</SelectItem>
                  <SelectItem value="all">{t('All Positions')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="sm" onClick={() => {}} className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('Refresh')}
              </Button>
            </div>
            
            {filteredPositions.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Symbol')}</TableHead>
                      <TableHead>{t('Type')}</TableHead>
                      <TableHead className="text-right">{t('Entry')}</TableHead>
                      <TableHead className="text-right">{t('Current')}</TableHead>
                      <TableHead className="text-right">{t('Size')}</TableHead>
                      <TableHead className="text-right">{t('Take Profit')}</TableHead>
                      <TableHead className="text-right">{t('Stop Loss')}</TableHead>
                      <TableHead className="text-right">{t('PnL')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPositions.map((position) => {
                      const pnl = calculatePnL(position);
                      const pnlPercent = calculatePnLPercentage(position);
                      const isProfitable = pnl > 0;
                      const isBreakEven = Math.abs(pnl) < 0.01;
                      const positionValue = position.amount * position.entryPrice * position.leverage;
                      
                      return (
                        <TableRow key={position.id} className="position-row">
                          <TableCell>
                            <div className="font-medium">{symbol}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={position.type === 'long' ? 'outline' : 'destructive'} 
                              className={`flex items-center ${position.type === 'long' ? 'border-green-500 text-green-600' : 'border-red-500'}`}
                            >
                              {position.type === 'long' ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {position.type.toUpperCase()}
                              {position.leverage > 1 && <span className="ml-1">{position.leverage}x</span>}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">${position.entryPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">${currentPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span>{position.amount}</span>
                              <span className="text-xs text-muted-foreground">${positionValue.toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {position.takeProfit ? (
                              <span className="font-mono text-green-500">${position.takeProfit.toFixed(2)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {position.stopLoss ? (
                              <span className="font-mono text-red-500">${position.stopLoss.toFixed(2)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-right ${isProfitable ? 'text-green-600' : isBreakEven ? 'text-gray-500' : 'text-red-600'}`}>
                            <div className="flex flex-col items-end">
                              <span className="font-mono">${Math.abs(pnl).toFixed(2)}</span>
                              <span className="text-xs">({pnlPercent.toFixed(2)}%)</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {position.status === 'active' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onClosePosition(position.id)}
                                className="h-8 w-8 p-0"
                                title={t('Close Position')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-sm text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                <p>{t('No active positions')}</p>
                <p className="text-xs">{t('Create a position from the Orders tab')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ProTradingPanel;