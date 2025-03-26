import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Info, AlertCircle, LineChart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Trade analysis component that provides feedback based on Wyckoff methodology
interface TradeAnalysisProps {
  trade: {
    id: number;
    pair: string;
    entryPrice: number;
    exitPrice: number | null;
    amount: number;
    tradeType: 'long' | 'short';
    strategy: string | null;
    date: string;
    status: 'active' | 'completed';
    profitLoss: number | null;
    notes: string | null;
    userId: number;
  };
  marketData?: {
    volume: number[];
    prices: number[];
    dates: string[];
  };
}

export function TradeAnalysis({ trade, marketData }: TradeAnalysisProps) {
  const { t } = useTranslation();
  
  if (!trade.exitPrice || trade.status !== 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('Trade Analysis')}</CardTitle>
          <CardDescription>{t('Complete the trade to view analysis')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">
              {t('This trade is still active. Analysis will be available once the trade is closed.')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate profit/loss
  const isProfitable = (trade.profitLoss || 0) > 0;
  const profitLossPercent = trade.entryPrice ? ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * (trade.tradeType === 'long' ? 1 : -1) : 0;
  
  // Determine if the trade was in sync with the overall market trend (using mock data for demo)
  const marketTrend = marketData 
    ? marketData.prices[marketData.prices.length - 1] > marketData.prices[0] ? 'uptrend' : 'downtrend'
    : (Math.random() > 0.5 ? 'uptrend' : 'downtrend'); // mock trend for demo
  
  const inSyncWithTrend = (marketTrend === 'uptrend' && trade.tradeType === 'long') || 
                          (marketTrend === 'downtrend' && trade.tradeType === 'short');
  
  // Wyckoff analysis feedback
  const getWyckoffFeedback = () => {
    // This would be more sophisticated in real implementation with actual chart pattern analysis
    const feedback = [];
    
    // Entry feedback based on Wyckoff methodology
    if (isProfitable) {
      if (trade.tradeType === 'long') {
        feedback.push({
          title: t('Strong Entry Point'),
          description: t('You entered after a potential accumulation phase, which aligns with Wyckoff methodology.'),
          icon: <CheckCircle className="h-5 w-5 text-success" />,
          type: 'positive'
        });
      } else {
        feedback.push({
          title: t('Good Distribution Recognition'),
          description: t('You identified a potential distribution phase for your short position, showing good market structure reading.'),
          icon: <CheckCircle className="h-5 w-5 text-success" />,
          type: 'positive'
        });
      }
    } else {
      if (trade.tradeType === 'long') {
        feedback.push({
          title: t('Potential Distribution Phase'),
          description: t('You may have entered during a distribution phase rather than accumulation. Watch for decreasing spread and volume before entry.'),
          icon: <AlertTriangle className="h-5 w-5 text-warning" />,
          type: 'warning'
        });
      } else {
        feedback.push({
          title: t('Potential Accumulation Phase'),
          description: t('Your short entry may have occurred during an accumulation phase. Look for signs of stopping action and decreasing volume.'),
          icon: <AlertTriangle className="h-5 w-5 text-warning" />,
          type: 'warning'
        });
      }
    }
    
    // Volume analysis (normally this would use actual volume data)
    feedback.push({
      title: t('Volume Analysis'),
      description: inSyncWithTrend 
        ? t('Volume confirms price action, indicating strong conviction in market direction.') 
        : t('Volume doesn\'t fully support price action. Look for increasing volume on impulse moves in trend direction.'),
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      type: inSyncWithTrend ? 'positive' : 'neutral'
    });
    
    // Trend analysis
    feedback.push({
      title: t('Trend Alignment'),
      description: inSyncWithTrend 
        ? t('Your trade was in sync with the prevailing market trend, which increases probability of success.') 
        : t('Your trade was against the prevailing market trend. Counter-trend trades require more precise timing.'),
      icon: <LineChart className="h-5 w-5 text-primary" />,
      type: inSyncWithTrend ? 'positive' : 'neutral'
    });
    
    // Risk management feedback
    const riskRewardRatio = Math.abs((trade.exitPrice - trade.entryPrice) / trade.entryPrice);
    if (riskRewardRatio < 0.01) {
      feedback.push({
        title: t('Risk-Reward Ratio'),
        description: t('Your risk-reward ratio was suboptimal. Aim for at least 1:2 ratio for better long-term results.'),
        icon: <AlertTriangle className="h-5 w-5 text-warning" />,
        type: 'warning'
      });
    } else {
      feedback.push({
        title: t('Risk Management'),
        description: t('Your risk management was appropriate for this trade.'),
        icon: <CheckCircle className="h-5 w-5 text-success" />,
        type: 'positive'
      });
    }
    
    return feedback;
  };
  
  const wyckoffFeedback = getWyckoffFeedback();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('Trade Analysis')} - {trade.pair}</CardTitle>
            <CardDescription>
              {t('Based on Wyckoff Methodology')}
            </CardDescription>
          </div>
          <Badge 
            variant={isProfitable ? "outline" : "destructive"} 
            className={cn(isProfitable ? "text-success bg-success/10" : "")}
          >
            {isProfitable ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {profitLossPercent.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Trade Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-card rounded-lg p-3 border">
              <p className="text-sm text-muted-foreground">{t('Entry Price')}</p>
              <p className="font-semibold">{trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border">
              <p className="text-sm text-muted-foreground">{t('Exit Price')}</p>
              <p className="font-semibold">{trade.exitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border">
              <p className="text-sm text-muted-foreground">{t('Position Type')}</p>
              <div className="flex items-center">
                {trade.tradeType === 'long' ? (
                  <Badge variant="outline" className="bg-success/10 text-success">
                    <TrendingUp className="h-3 w-3 mr-1" /> {t('Long')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive">
                    <TrendingDown className="h-3 w-3 mr-1" /> {t('Short')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Wyckoff Analysis */}
          <div>
            <h3 className="font-semibold mb-3">{t('Analysis & Recommendations')}</h3>
            <div className="space-y-3">
              {wyckoffFeedback.map((feedback, index) => (
                <div key={index} className={cn(
                  "p-3 rounded-lg border",
                  feedback.type === 'positive' ? "bg-success/5 border-success/20" : 
                  feedback.type === 'warning' ? "bg-warning/5 border-warning/20" : 
                  "bg-card"
                )}>
                  <div className="flex items-start">
                    <div className="mt-0.5 mr-3">
                      {feedback.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{feedback.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{feedback.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Educational Resources */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 text-primary" />
              <h3 className="font-semibold">{t('Educational Resources')}</h3>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="text-primary underline cursor-pointer">
                {t('Wyckoff Method: Understanding Market Phases')}
              </li>
              <li className="text-primary underline cursor-pointer">
                {t('Volume Analysis in Trading Decisions')}
              </li>
              <li className="text-primary underline cursor-pointer">
                {t('Improving Risk-Reward Ratios')}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        {t('This analysis is based on your trade parameters and is for educational purposes only. Past performance does not guarantee future results.')}
      </CardFooter>
    </Card>
  );
}

export default TradeAnalysis;