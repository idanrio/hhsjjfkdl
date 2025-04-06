import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PaperTradingView from '@/components/PaperTradingView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Maximize2, Minimize2, TrendingUp, BarChart4, LineChart } from 'lucide-react';

/**
 * Paper Trading Pro Page
 * 
 * This page provides a professional TradingView trading environment 
 * with a $150,000 demo account for practice
 */
const PaperTradingPro = () => {
  const { t } = useTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');
  
  const popularSymbols = [
    { id: 'btc', label: 'Bitcoin', value: 'BINANCE:BTCUSDT' },
    { id: 'eth', label: 'Ethereum', value: 'BINANCE:ETHUSDT' },
    { id: 'aapl', label: 'Apple', value: 'NASDAQ:AAPL' },
    { id: 'tsla', label: 'Tesla', value: 'NASDAQ:TSLA' },
    { id: 'meta', label: 'Meta', value: 'NASDAQ:META' },
    { id: 'spy', label: 'S&P 500 ETF', value: 'AMEX:SPY' },
  ];
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Professional Trading Simulation')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('Practice trading with a $150,000 demo account in a professional environment')}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFullScreen(!isFullScreen)}
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="h-4 w-4 mr-2" />
              {t('Exit Fullscreen')}
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 mr-2" />
              {t('Fullscreen')}
            </>
          )}
        </Button>
      </div>
      
      {!isFullScreen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('TradingView Pro Environment')}</CardTitle>
            <CardDescription>
              {t('This is a professional-grade trading environment with realistic features and a $150,000 practice account.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="symbols" className="w-full">
              <TabsList>
                <TabsTrigger value="symbols">{t('Popular Markets')}</TabsTrigger>
                <TabsTrigger value="features">{t('Features')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="symbols" className="pt-6">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {popularSymbols.map((s) => (
                    <Button
                      key={s.id}
                      variant={symbol === s.value ? 'default' : 'outline'}
                      className="h-auto py-6 flex flex-col gap-2"
                      onClick={() => setSymbol(s.value)}
                    >
                      {s.id === 'btc' || s.id === 'eth' ? (
                        <BarChart4 className="h-8 w-8 mb-1" />
                      ) : (
                        <LineChart className="h-8 w-8 mb-1" />
                      )}
                      <span>{s.label}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="pt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4">
                    <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="text-lg font-medium">{t('Realistic Trading')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('Experience realistic trading with market, limit, and stop orders')}
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <Maximize2 className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="text-lg font-medium">{t('$150,000 Demo Account')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('Practice with a substantial demo account to test your strategies')}
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <BarChart4 className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="text-lg font-medium">{t('Advanced Charts')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('Full suite of technical indicators and drawing tools for analysis')}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      <div className={isFullScreen ? 'fixed inset-0 z-50 bg-background' : 'h-[750px] rounded-lg overflow-hidden border'}>
        <PaperTradingView
          initialSymbol={symbol}
          fullScreen={isFullScreen}
          onFullScreenChange={setIsFullScreen}
          height={isFullScreen ? '100vh' : '100%'}
        />
      </div>
    </div>
  );
};

export default PaperTradingPro;