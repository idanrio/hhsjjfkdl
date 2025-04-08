import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import ProTradingViewDashboard from '@/components/ProTradingViewDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Position } from '@shared/schema';

const Trading: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<any[]>([]);
  
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
  
  useEffect(() => {
    if (userPositions) {
      // Convert the API positions to the format expected by ProTradingViewDashboard
      const formattedPositions = userPositions.map(position => ({
        id: position.id.toString(),
        symbol: position.symbol,
        type: position.type as 'buy' | 'sell',
        size: position.amount,
        entryPrice: position.entryPrice,
        currentPrice: position.exitPrice || position.entryPrice,
        openTime: new Date(position.entryTime),
        pnl: position.profitLoss || 0,
        pnlPercent: position.profitLoss ? (Number(position.profitLoss) / (Number(position.entryPrice) * Number(position.amount))) * 100 : 0
      }));
      
      setPositions(formattedPositions);
    }
  }, [userPositions]);
  
  // Handle position creation
  const handlePositionCreated = async (position: any) => {
    try {
      // Format the position for the API
      const apiPosition = {
        symbol: position.symbol,
        type: position.type,
        amount: position.size,
        entryPrice: position.entryPrice,
        leverage: 1, // Default leverage
        stopLoss: null,
        takeProfit: null
      };
      
      // Here you would call the API to create the position
      // For demo purposes we'll just use the client-side position
      toast({
        title: t('Position Opened'),
        description: t('{{type}} position opened for {{symbol}} at {{price}}', {
          type: position.type === 'buy' ? t('Long') : t('Short'),
          symbol: position.symbol.split(':').pop(),
          price: position.entryPrice.toFixed(2)
        }),
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to create position:', error);
      toast({
        title: t('Error'),
        description: t('Failed to open position. Please try again.'),
        variant: 'destructive',
      });
    }
  };
  
  // Handle position closure
  const handlePositionClosed = async (positionId: string) => {
    try {
      // Here you would call the API to close the position
      // For demo purposes we'll just use the client-side position
      toast({
        title: t('Position Closed'),
        description: t('Your position has been closed successfully.'),
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to close position:', error);
      toast({
        title: t('Error'),
        description: t('Failed to close position. Please try again.'),
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-4 px-0 md:px-4">
        <h1 className="text-2xl font-bold mb-4 px-4 text-[#1c3d86]">
          {t('Trading Dashboard')}
        </h1>
        
        <div className="w-full rounded-md overflow-hidden shadow-xl">
          <ProTradingViewDashboard
            initialPositions={positions}
            onPositionCreated={handlePositionCreated}
            onPositionClosed={handlePositionClosed}
            accountBalance={150000} // Default paper trading account balance
            showWatchlist={true}
            showPositions={true}
            className="w-full"
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Trading;