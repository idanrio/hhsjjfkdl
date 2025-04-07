import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EnhancedTradingViewWidget, { TradingViewRef } from './EnhancedTradingViewWidget';
import { ProTradingViewPanel } from './ProTradingViewPanel';
import { AIWyckoffCoach } from './AIWyckoffCoach';
import { ChartImageUploader } from './ChartImageUploader';
import { Position, WyckoffAnalysisResult } from '@/types/trading';
import aiService from '@/services/aiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Bell } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface FullTradingEnvironmentProps {
  initialPositions?: Position[];
  onPositionCreated?: (position: Position) => void;
  onPositionClosed?: (position: Position) => void;
  onPositionUpdated?: (position: Position) => void;
  fullScreenMode?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  className?: string;
  showPositionsPanel?: boolean;
}

export function FullTradingEnvironment({
  initialPositions = [],
  onPositionCreated,
  onPositionClosed,
  onPositionUpdated,
  fullScreenMode = false,
  onFullScreenChange,
  className = '',
  showPositionsPanel = true,
}: FullTradingEnvironmentProps) {
  const { t, i18n } = useTranslation();
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(fullScreenMode);
  const [defaultSymbol] = useState<string>('BINANCE:BTCUSDT');
  
  const tradingViewRef = useRef<TradingViewRef>(null);
  
  // Initialize positions from props
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);
  
  // Handle price updates from TradingView
  const handlePriceUpdate = (price: number) => {
    setCurrentPrice(price);
    
    // Update P/L for active positions
    if (positions.length > 0) {
      const updatedPositions = positions.map(position => {
        if (position.status === 'active') {
          let profitLoss = 0;
          
          // Calculate P/L based on position type
          if (position.type === 'long') {
            profitLoss = (price - position.entryPrice) * position.amount * position.leverage;
          } else { // short
            profitLoss = (position.entryPrice - price) * position.amount * position.leverage;
          }
          
          // Clone the position to avoid reference issues
          const updatedPosition = { ...position, profitLoss };
          
          // Check if we need to close based on stop loss or take profit
          if (position.stopLoss !== null && position.type === 'long' && price <= position.stopLoss) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          } else if (position.stopLoss !== null && position.type === 'short' && price >= position.stopLoss) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          } else if (position.takeProfit !== null && position.type === 'long' && price >= position.takeProfit) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          } else if (position.takeProfit !== null && position.type === 'short' && price <= position.takeProfit) {
            updatedPosition.status = 'closed';
            updatedPosition.exitPrice = price;
            updatedPosition.exitTime = new Date().toISOString();
            
            if (onPositionClosed) {
              onPositionClosed(updatedPosition);
            }
          }
          
          return updatedPosition;
        }
        return position;
      });
      
      setPositions(updatedPositions);
    }
  };
  
  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (onFullScreenChange) {
      onFullScreenChange(!isFullScreen);
    }
  };
  
  // Handle creating a new position
  const handleCreatePosition = (newPosition: Omit<Position, 'id' | 'status' | 'entryTime'>) => {
    // Generate a unique ID
    const id = `pos_${Date.now()}`;
    const entryTime = new Date().toISOString();
    
    // Create the full position object
    const fullPosition: Position = {
      id,
      status: 'active',
      entryTime,
      exitPrice: undefined,
      exitTime: undefined,
      profitLoss: 0,
      ...newPosition
    };
    
    // Update local state
    setPositions(prev => [...prev, fullPosition]);
    
    // Notify parent if callback exists
    if (onPositionCreated) {
      onPositionCreated(fullPosition);
    }
  };
  
  return (
    <div 
      className={`full-trading-environment ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
      style={{ height: isFullScreen ? '100vh' : '800px' }}
    >
      {/* Simple Top Bar - Minimal UI */}
      <div className="flex items-center justify-between bg-[#131722] text-white px-4 py-2 border-b border-[#2a2e39]">
        <div className="text-lg font-semibold">
          Trading Dashboard
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Current Price Indicator */}
          <Badge variant="outline" className="text-sm font-mono">
            {currentPrice.toFixed(2)}
          </Badge>
          
          {/* Analysis Tools */}
          <Dialog>
            <AIWyckoffCoach 
              tradingViewRef={tradingViewRef} 
              symbol={defaultSymbol}
              timeframe="D"
              onAnalysisComplete={(analysis: WyckoffAnalysisResult) => {
                console.log("Wyckoff analysis completed:", analysis);
              }}
            />
          </Dialog>

          <ChartImageUploader 
            onImageAnalysis={async (imageBase64, notes) => {
              try {
                const result = await aiService.analyzeChartImage(imageBase64, notes);
                return result;
              } catch (error) {
                console.error("Error analyzing chart image:", error);
                throw error;
              }
            }}
          />
          
          {/* Fullscreen Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleFullScreen} className="text-white">
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-12 h-[calc(100%-48px)]">
        {/* Chart Area - Let TradingView handle its own controls */}
        <div className={`${showPositionsPanel ? 'col-span-9' : 'col-span-12'} h-full border-r border-[#2a2e39] relative`}>
          <EnhancedTradingViewWidget
            ref={tradingViewRef}
            symbol={defaultSymbol}
            interval="D"
            theme="dark"
            style="1"
            width="100%"
            height="100%"
            locale={i18n.language === 'he' ? 'he_IL' : 'en'}
            toolbar_bg="#131722"
            hide_side_toolbar={false}
            allow_symbol_change={true}
            save_image={true}
            autosize={true}
            hide_top_toolbar={false}
            disabled_features={[]}
            enabled_features={[
              'study_templates',
              'use_localstorage_for_settings',
              'side_toolbar_in_fullscreen_mode',
              'show_trading_notifications_history',
            ]}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>
        
        {/* Trading Panel */}
        {showPositionsPanel && (
          <div className="col-span-3 h-full overflow-auto">
            <ProTradingViewPanel
              currentPrice={currentPrice}
              symbol="Bitcoin (BTC/USDT)"
              onOrderSubmit={handleCreatePosition}
              accountBalance={150000}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FullTradingEnvironment;