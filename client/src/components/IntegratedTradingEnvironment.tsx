import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { FullTradingEnvironment } from './FullTradingEnvironment';
import { Trade } from '@shared/schema';
import { Position } from '@/types/trading';

interface IntegratedTradingEnvironmentProps {
  onClose?: () => void;
  onSaveTrade?: (trade: any) => void;
  fullScreen?: boolean;
  initialPositions?: Position[];
  demoMode?: boolean;
  onPositionClose?: (position: Position) => void;
}

const IntegratedTradingEnvironment: React.FC<IntegratedTradingEnvironmentProps> = ({
  onClose,
  onSaveTrade,
  fullScreen = false,
  initialPositions = [],
  demoMode = false,
  onPositionClose
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  
  // Save current analysis as a trade
  const handleSaveTrade = (position: Position) => {
    if (!onSaveTrade) return;
    
    const trade = {
      pair: 'BTC/USD', // Default pair if not available
      entryPrice: position.entryPrice,
      exitPrice: position.exitPrice || null,
      amount: position.amount,
      tradeType: position.type,
      strategy: 'TradingView Pro', // Default strategy
      date: position.entryTime,
      status: position.status,
      profitLoss: position.profitLoss || null,
      notes: 'Trade executed via TradingView Pro integration',
    };
    
    onSaveTrade(trade);
    
    toast({
      title: t("Trade Saved"),
      description: t("Your analysis has been saved as a new trade"),
    });
  };

  return (
    <div className={`bg-background ${fullScreen ? 'fixed inset-0 z-50' : 'h-full w-full'}`}>
      {/* Using our new FullTradingEnvironment component for Pro TradingView functionality */}
      <FullTradingEnvironment
        initialPositions={positions}
        onPositionCreated={(newPosition) => {
          setPositions([...positions, newPosition]);
          toast({
            title: t("Position Created"),
            description: `${newPosition.type} position opened at ${newPosition.entryPrice}`,
          });
        }}
        onPositionClosed={(closedPosition) => {
          // Update positions list
          setPositions(positions.map(p => 
            p.id === closedPosition.id ? closedPosition : p
          ));
          
          // Notify parent component if needed
          if (onPositionClose) {
            onPositionClose(closedPosition);
          }
          
          // Save trade if not in demo mode
          if (!demoMode && onSaveTrade) {
            handleSaveTrade(closedPosition);
          }
          
          toast({
            title: t("Position Closed"),
            description: `${closedPosition.type} position closed with P/L: $${(closedPosition.profitLoss || 0).toFixed(2)}`,
            variant: (closedPosition.profitLoss || 0) >= 0 ? "default" : "destructive",
          });
        }}
        onPositionUpdated={(updatedPosition) => {
          // Update positions list
          setPositions(positions.map(p => 
            p.id === updatedPosition.id ? updatedPosition : p
          ));
        }}
        fullScreenMode={fullScreen}
        onFullScreenChange={(isFullScreen) => {
          // If we want to handle fullscreen state in parent
          if (!isFullScreen && onClose) {
            onClose();
          }
        }}
        className="w-full h-full"
        showPositionsPanel={true}
      />
    </div>
  );
};

export default IntegratedTradingEnvironment;