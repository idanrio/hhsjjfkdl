import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingViewChart from './TradingViewChart';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const PositionDemo: React.FC = () => {
  const { t } = useTranslation();

  // Sample positions with stop loss and take profit levels
  const longPositions = [
    {
      id: 'long-1',
      type: 'long' as const,
      entryPrice: 40000,
      stopLoss: 39000,
      takeProfit: 42000,
      entryTime: '2023-06-15T08:30:00.000Z',
      amount: 1000,
      leverage: 1,
      status: 'active' as const
    },
    {
      id: 'long-2',
      type: 'long' as const,
      entryPrice: 40500,
      stopLoss: 39800,
      takeProfit: 41800,
      entryTime: '2023-06-16T10:15:00.000Z',
      amount: 2000,
      leverage: 2,
      status: 'active' as const
    }
  ];

  const shortPositions = [
    {
      id: 'short-1',
      type: 'short' as const,
      entryPrice: 41000,
      stopLoss: 41800,
      takeProfit: 39500,
      entryTime: '2023-06-14T14:45:00.000Z',
      amount: 1500,
      leverage: 1,
      status: 'active' as const
    },
    {
      id: 'short-2',
      type: 'short' as const,
      entryPrice: 40800,
      stopLoss: 41500,
      takeProfit: 39200,
      entryTime: '2023-06-13T11:20:00.000Z',
      amount: 3000,
      leverage: 3,
      status: 'active' as const
    }
  ];

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center mb-6">
        <Link href="/backtest/dashboard">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('Back to Dashboard')}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t('Position Reference Lines Demo')}</h1>
      </div>

      <Tabs defaultValue="long">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="long">{t('Long Positions')}</TabsTrigger>
            <TabsTrigger value="short">{t('Short Positions')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="long">
          <Card>
            <CardHeader>
              <CardTitle>{t('Long Positions with Stop Loss & Take Profit Levels')}</CardTitle>
              <CardDescription>
                {t('Green lines show long entry prices with corresponding stop loss (red) and take profit (blue) levels')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[700px]">
                <TradingViewChart 
                  symbol="BTC/USD" 
                  initialPrice={40000}
                  className="h-full"
                  initialPositions={longPositions}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="short">
          <Card>
            <CardHeader>
              <CardTitle>{t('Short Positions with Stop Loss & Take Profit Levels')}</CardTitle>
              <CardDescription>
                {t('Red lines show short entry prices with corresponding stop loss (green) and take profit (blue) levels')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[700px]">
                <TradingViewChart 
                  symbol="BTC/USD" 
                  initialPrice={41000}
                  className="h-full"
                  initialPositions={shortPositions}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('About Position Reference Lines')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none dark:prose-invert">
            <p>
              {t('Position reference lines help traders visualize their entry points, stop loss, and take profit levels directly on the chart. This visual representation makes it easier to understand risk/reward ratios and monitor position performance.')}
            </p>
            <h3>{t('Color Coding')}</h3>
            <ul>
              <li>
                <strong className="text-green-500">{t('Green Lines')}</strong>: {t('Long position entry price')}
              </li>
              <li>
                <strong className="text-red-500">{t('Red Lines')}</strong>: {t('Short position entry price or stop loss level for long positions')}
              </li>
              <li>
                <strong className="text-blue-500">{t('Blue Lines')}</strong>: {t('Take profit levels for both position types')}
              </li>
              <li>
                <strong className="text-green-500">{t('Green Dashed Lines')}</strong>: {t('Stop loss level for short positions')}
              </li>
            </ul>
            <p>
              {t('Using these reference lines helps traders maintain discipline by clearly showing predetermined exit points, whether the trade moves in their favor (take profit) or against them (stop loss).')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionDemo;