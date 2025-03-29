import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TradingViewWidget } from './TradingViewWidget';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Position } from '@/types/trading';
import { 
  ArrowLeft, 
  Minimize2, 
  Maximize2, 
  Settings, 
  History, 
  LineChart, 
  AreaChart,
  CandlestickChart,
  BarChart,
  PanelTop, 
  PanelBottom
} from 'lucide-react';

interface ProTradingViewIntegrationProps {
  symbol: string;
  initialPositions?: Position[];
  onPositionCreated?: (position: Position) => void;
  onPositionClosed?: (position: Position) => void;
  onPositionModified?: (position: Position) => void;
  fullScreen?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  onClose?: () => void;
  className?: string;
  height?: string | number;
}

/**
 * Professional TradingView Integration Component
 * 
 * This component provides a full-featured TradingView Pro experience
 * with additional functionality specific to our backtesting platform
 */
export function ProTradingViewIntegration({
  symbol,
  initialPositions = [],
  onPositionCreated,
  onPositionClosed,
  onPositionModified,
  fullScreen = false,
  onFullScreenChange,
  onClose,
  className = '',
  height = '600px'
}: ProTradingViewIntegrationProps) {
  const { t } = useTranslation();
  const [selectedInterval, setSelectedInterval] = useState('1D');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('dark');
  const [selectedStyle, setSelectedStyle] = useState<'1' | '2' | '3' | '4'>('1');
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [showStudiesPanel, setShowStudiesPanel] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // Map symbol to TradingView format
  const formatSymbol = (sym: string): string => {
    // Handle crypto pairs (e.g., BTC/USD -> BINANCE:BTCUSD)
    if (sym.includes('/')) {
      const [base, quote] = sym.split('/');
      return `BINANCE:${base}${quote}`;
    }
    
    // Handle stock symbols (e.g., AAPL -> NASDAQ:AAPL)
    if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA'].includes(sym)) {
      return `NASDAQ:${sym}`;
    }
    
    // Handle indices
    if (sym === 'SPY') {
      return 'AMEX:SPY';  // S&P 500 ETF
    }
    
    // Default return the symbol as is
    return sym;
  };
  
  // Handle position creation from TradingView
  const handlePositionCreated = (newPosition: Position) => {
    setPositions(prev => [...prev, newPosition]);
    if (onPositionCreated) {
      onPositionCreated(newPosition);
    }
  };
  
  // Handle position closing
  const handlePositionClosed = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (position) {
      const updatedPosition = {
        ...position,
        status: 'closed' as const,
        exitTime: new Date().toISOString(),
        exitPrice: 0, // This will be updated with the actual price
      };
      
      setPositions(prev => 
        prev.map(p => p.id === positionId ? updatedPosition : p)
      );
      
      if (onPositionClosed) {
        onPositionClosed(updatedPosition);
      }
    }
  };
  
  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (onFullScreenChange) {
      onFullScreenChange(!fullScreen);
    }
  };
  
  // Available timeframes
  const intervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1W' },
    { value: 'M', label: '1M' },
  ];
  
  // Chart styles
  const chartStyles = [
    { id: '1', name: t('Candles'), icon: <CandlestickChart size={16} /> },
    { id: '2', name: t('Bars'), icon: <BarChart size={16} /> },
    { id: '3', name: t('Line'), icon: <LineChart size={16} /> },
    { id: '4', name: t('Area'), icon: <AreaChart size={16} /> },
  ];
  
  // Common indicators for trading
  const commonStudies = [
    'MASimple@tv-basicstudies',
    'MAExp@tv-basicstudies',
    'RSI@tv-basicstudies',
    'MACD@tv-basicstudies',
    'BB@tv-basicstudies'  // Bollinger Bands
  ];
  
  // Disabled features to customize the TradingView widget
  const disabledFeatures = [
    'header_symbol_search',
    'header_indicators',
    'header_compare',
    'header_undo_redo',
    'header_saveload',
    'header_settings'
  ];
  
  // Enabled features for trading functionality
  const enabledFeatures = [
    'study_templates',
    'use_localstorage_for_settings',
    'side_toolbar_in_fullscreen_mode',
    'show_trading_notifications_history'
  ];
  
  return (
    <div className={`pro-tradingview-integration ${fullScreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
         style={{ height: fullScreen ? '100vh' : height }}
    >
      <div className="flex flex-col h-full">
        {/* Trading Chart Header */}
        <div className="flex items-center justify-between p-2 bg-card border-b">
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('Back')}
              </Button>
            )}
            
            <div className="font-medium">{symbol}</div>
            
            <Select value={selectedInterval} onValueChange={setSelectedInterval}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={selectedInterval} />
              </SelectTrigger>
              <SelectContent>
                {intervals.map(interval => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-md">
              {chartStyles.map(style => (
                <Button
                  key={style.id}
                  variant={selectedStyle === style.id ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSelectedStyle(style.id as '1' | '2' | '3' | '4')}
                  title={style.name}
                >
                  {style.icon}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowStudiesPanel(!showStudiesPanel)} title={t('Indicators')}>
              <PanelTop className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setShowInfo(!showInfo)} title={t('Information')}>
              <PanelBottom className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={toggleFullScreen} title={fullScreen ? t('Exit Full Screen') : t('Full Screen')}>
              {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center ml-2">
              <Switch
                id="theme-switch"
                checked={selectedTheme === 'dark'}
                onCheckedChange={checked => setSelectedTheme(checked ? 'dark' : 'light')}
              />
              <Label htmlFor="theme-switch" className="ml-2">
                {selectedTheme === 'dark' ? t('Dark') : t('Light')}
              </Label>
            </div>
          </div>
        </div>
        
        {/* Main Chart Area */}
        <div className="flex-grow relative">
          <TradingViewWidget
            symbol={formatSymbol(symbol)}
            interval={selectedInterval}
            theme={selectedTheme}
            style={selectedStyle}
            toolbar_bg="#1c3d86"
            hide_side_toolbar={!showStudiesPanel}
            studies={commonStudies}
            autosize={true}
            save_image={true}
            disabled_features={disabledFeatures}
            enabled_features={enabledFeatures}
            width="100%"
            height="100%"
          />
        </div>
        
        {/* Position Information Panel (optional) */}
        {showInfo && positions.length > 0 && (
          <div className="border-t bg-card p-2">
            <Tabs defaultValue="positions">
              <TabsList>
                <TabsTrigger value="positions">{t('Positions')}</TabsTrigger>
                <TabsTrigger value="history">{t('History')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="positions" className="max-h-32 overflow-auto">
                <div className="text-sm">
                  {positions.filter(p => p.status === 'active').map(position => (
                    <div key={position.id} className="flex justify-between items-center py-1 border-b">
                      <div>
                        <span className={position.type === 'long' ? 'text-green-500' : 'text-red-500'}>
                          {position.type === 'long' ? t('Long') : t('Short')}
                        </span>
                        <span className="ml-2">{symbol}</span>
                      </div>
                      <div>
                        {t('Entry')}: {position.entryPrice}
                      </div>
                      <div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handlePositionClosed(position.id)}
                        >
                          {t('Close')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="max-h-32 overflow-auto">
                <div className="text-sm">
                  {positions.filter(p => p.status === 'closed').map(position => (
                    <div key={position.id} className="flex justify-between items-center py-1 border-b">
                      <div>
                        <span className={position.type === 'long' ? 'text-green-500' : 'text-red-500'}>
                          {position.type === 'long' ? t('Long') : t('Short')}
                        </span>
                        <span className="ml-2">{symbol}</span>
                      </div>
                      <div>
                        {t('P/L')}: 
                        <span className={(position.profitLoss || 0) >= 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                          {(position.profitLoss || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProTradingViewIntegration;