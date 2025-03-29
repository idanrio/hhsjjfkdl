import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Separator 
} from "@/components/ui/separator";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Loader2, 
  RefreshCw,
  ArrowUpCircle,
  BarChart,
  LineChart,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import aiService from '@/services/aiService';
import { Position, Trade } from '@/types/trading';

interface PersonalizedAdviceProps {
  trades: Trade[];
  positions?: Position[];
  onRefresh?: () => void;
}

export function PersonalizedAdvice({ trades, positions = [], onRefresh }: PersonalizedAdviceProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('advice');
  const [advice, setAdvice] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trades && Array.isArray(trades) && trades.length > 0) {
      getPersonalizedAdvice();
    }
  }, [trades]);

  const getPersonalizedAdvice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we have enough trade data
      if (!trades || trades.length < 3) {
        setError('Not enough trade history for personalized advice.');
        setLoading(false);
        return;
      }
      
      const result = await aiService.getPersonalizedAdvice(trades, positions);
      setAdvice(result);
    } catch (err) {
      console.error('Error getting personalized advice:', err);
      setError('Failed to generate personalized advice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    getPersonalizedAdvice();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Display loading state
  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>{t('Trading Coach')}</CardTitle>
          <CardDescription>{t('Personalized trading advice')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-56">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('Analyzing your trading history...')}</p>
        </CardContent>
      </Card>
    );
  }

  // Display error state
  if (error) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>{t('Trading Coach')}</CardTitle>
          <CardDescription>{t('Personalized trading advice')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-56">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('Try Again')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no advice yet or not enough trade history
  if (!advice) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>{t('Trading Coach')}</CardTitle>
          <CardDescription>{t('Personalized trading advice')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-56">
          {Array.isArray(trades) && trades.length < 3 ? (
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">{t('Complete at least 3 trades to receive personalized advice')}</p>
              <p className="text-xs text-muted-foreground">{t('Current trades')}: {Array.isArray(trades) ? trades.length : 0}/3</p>
            </div>
          ) : (
            <>
              <Button onClick={handleRefresh} className="mb-4">
                <BarChart className="mr-2 h-4 w-4" />
                {t('Analyze My Trading')}
              </Button>
              <p className="text-muted-foreground text-sm text-center">
                {t('AI-powered analysis of your trading patterns and behaviors to improve performance')}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Main component render with advice results
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('Trading Coach')}</CardTitle>
            <CardDescription>{t('AI-powered personalized advice')}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} title={t('Refresh Analysis')}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="advice">{t('Main Advice')}</TabsTrigger>
            <TabsTrigger value="risk">{t('Risk Analysis')}</TabsTrigger>
            <TabsTrigger value="strategies">{t('Strategies')}</TabsTrigger>
          </TabsList>

          <TabsContent value="advice" className="mt-0">
            <div className="space-y-4">
              <div className="p-3 rounded-md border bg-primary/5 relative">
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-primary/10 border-primary/20">
                    {Math.round(advice.confidence * 100)}% {t('Confidence')}
                  </Badge>
                </div>
                <h3 className="font-medium text-lg mb-2">{t('Personalized Advice')}</h3>
                <p className="text-sm">{advice.advice}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <ArrowUpCircle className="mr-2 h-4 w-4 text-primary" />
                  {t('Areas to Improve')}
                </h3>
                <ScrollArea className="h-[120px] pr-4">
                  <ul className="space-y-2">
                    {advice.improvementAreas && advice.improvementAreas.map((area: string, index: number) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="mr-2 mt-0.5 text-primary">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                  {t('Risk Analysis')}
                </h3>
                <p className="text-sm">{advice.riskAnalysis}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">{t('Trade Statistics')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-md border text-center">
                    <p className="text-xs text-muted-foreground">{t('Win Rate')}</p>
                    <p className="text-lg font-medium">
                      {calculateWinRate(trades)}%
                    </p>
                  </div>
                  <div className="p-2 rounded-md border text-center">
                    <p className="text-xs text-muted-foreground">{t('Avg Profit/Loss')}</p>
                    <p className="text-lg font-medium">
                      {calculateAvgProfitLoss(trades)}
                    </p>
                  </div>
                  <div className="p-2 rounded-md border text-center">
                    <p className="text-xs text-muted-foreground">{t('Most Traded')}</p>
                    <p className="text-sm font-medium truncate">
                      {getMostTradedPair(trades)}
                    </p>
                  </div>
                  <div className="p-2 rounded-md border text-center">
                    <p className="text-xs text-muted-foreground">{t('Trade Style')}</p>
                    <p className="text-sm font-medium">
                      {getTradeStyle(trades)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="mt-0">
            <ScrollArea className="h-[220px] pr-4">
              <div className="space-y-3">
                {advice.suggestedStrategies && advice.suggestedStrategies.map((strategy: string, index: number) => (
                  <div key={index} className="p-3 rounded-md border">
                    <div className="flex items-center mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <h4 className="font-medium">{`${t('Strategy')} ${index + 1}`}</h4>
                    </div>
                    <p className="text-sm">{strategy}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate win rate
function calculateWinRate(trades: Trade[]): string {
  if (!Array.isArray(trades) || trades.length === 0) return '0.00';
  
  const completedTrades = trades.filter(t => t.status === 'completed');
  if (completedTrades.length === 0) return '0.00';
  
  const winningTrades = completedTrades.filter(t => (t.profitLoss || 0) > 0);
  const winRate = (winningTrades.length / completedTrades.length) * 100;
  
  return winRate.toFixed(2);
}

// Helper function to calculate average profit/loss
function calculateAvgProfitLoss(trades: Trade[]): string {
  if (!Array.isArray(trades) || trades.length === 0) return '0.00';
  
  const completedTrades = trades.filter(t => t.status === 'completed');
  if (completedTrades.length === 0) return '0.00';
  
  const totalProfitLoss = completedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const avgProfitLoss = totalProfitLoss / completedTrades.length;
  
  // Format with + sign for positive values
  return avgProfitLoss > 0 ? `+${avgProfitLoss.toFixed(2)}` : avgProfitLoss.toFixed(2);
}

// Helper function to get most traded pair
function getMostTradedPair(trades: Trade[]): string {
  if (!Array.isArray(trades) || trades.length === 0) return 'N/A';
  
  const pairCounts: Record<string, number> = {};
  
  trades.forEach(trade => {
    if (trade && trade.pair) {
      pairCounts[trade.pair] = (pairCounts[trade.pair] || 0) + 1;
    }
  });
  
  if (Object.keys(pairCounts).length === 0) return 'N/A';
  
  const mostTraded = Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])[0];
    
  return mostTraded[0];
}

// Helper function to determine trade style (long-biased, short-biased, balanced)
function getTradeStyle(trades: Trade[]): string {
  if (!Array.isArray(trades) || trades.length === 0) return 'N/A';
  
  const longTrades = trades.filter(t => t && t.tradeType === 'long').length;
  const shortTrades = trades.filter(t => t && t.tradeType === 'short').length;
  
  if (longTrades === 0 && shortTrades === 0) return 'N/A';
  
  const longPercentage = (longTrades / (longTrades + shortTrades)) * 100;
  
  if (longPercentage > 70) return 'Long-biased';
  if (longPercentage < 30) return 'Short-biased';
  return 'Balanced';
}

export default PersonalizedAdvice;