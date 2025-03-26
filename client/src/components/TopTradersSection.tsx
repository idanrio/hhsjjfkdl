import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ArrowUpRight, Award, TrendingUp, Users } from 'lucide-react';
import Chart from '@/components/Chart';
import BacktestLogin from '@/components/BacktestLogin';

interface TopTrader {
  id: number;
  name: string;
  winRate: number;
  totalProfit: number;
  profitPercentage: number;
  tradingPair: string;
  position: number;
  avatarUrl?: string;
}

const TopTradersSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [showLogin, setShowLogin] = useState(false);
  
  // Sample data for top traders
  const topTraders: TopTrader[] = [
    {
      id: 1,
      name: 'Alex Chen',
      winRate: 78,
      totalProfit: 15420,
      profitPercentage: 32.5,
      tradingPair: 'BTC/USD',
      position: 1,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      winRate: 74,
      totalProfit: 12350,
      profitPercentage: 28.4,
      tradingPair: 'ETH/USD',
      position: 2,
    },
    {
      id: 3,
      name: 'Michael Williams',
      winRate: 72,
      totalProfit: 11280,
      profitPercentage: 25.8,
      tradingPair: 'SPY/USD',
      position: 3,
    },
    {
      id: 4,
      name: 'Rachel Kim',
      winRate: 69,
      totalProfit: 9870,
      profitPercentage: 22.3,
      tradingPair: 'AAPL/USD',
      position: 4,
    },
    {
      id: 5,
      name: 'David Levy',
      winRate: 67,
      totalProfit: 8950,
      profitPercentage: 20.7,
      tradingPair: 'NASDAQ/USD',
      position: 5,
    },
  ];

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getBadgeColor = (position: number): string => {
    switch (position) {
      case 1:
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 2:
        return 'bg-gray-400 hover:bg-gray-500';
      case 3:
        return 'bg-amber-600 hover:bg-amber-700';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const handleLoginSubmit = (email: string, password: string) => {
    console.log('Login submitted', { email, password });
    setShowLogin(false);
    // Handle backtesting system login logic here
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('topTraders.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t('topTraders.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{t('navigation.topTraders')}</h3>
                <Badge className="px-3 py-1">Top 5</Badge>
              </div>
              <div className="space-y-4">
                {topTraders.map((trader) => (
                  <div 
                    key={trader.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      trader.position <= 3 ? 'border-primary/30 bg-primary/5' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`w-8 h-8 rounded-full flex items-center justify-center ${getBadgeColor(trader.position)}`}>
                        {trader.position}
                      </Badge>
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-semibold uppercase">
                          {trader.name.charAt(0)}
                        </div>
                      </Avatar>
                      <div className={`text-${isRTL ? 'right' : 'left'}`}>
                        <div className="font-medium">{trader.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{trader.tradingPair}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`text-${isRTL ? 'left' : 'right'}`}>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('topTraders.winRate')}</div>
                        <div className="font-medium text-green-600">{trader.winRate}%</div>
                      </div>
                      <div className={`text-${isRTL ? 'left' : 'right'} min-w-[100px]`}>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('topTraders.profit')}</div>
                        <div className="font-medium">{formatCurrency(trader.totalProfit)}</div>
                      </div>
                      <div className={`text-${isRTL ? 'left' : 'right'}`}>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('topTraders.profitPct')}</div>
                        <div className="font-medium text-green-600">+{trader.profitPercentage}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <Button variant="outline" className="gap-2">
                  {t('topTraders.viewAll')}
                  <ArrowUpRight size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{t('features.analytics.title')}</h3>
              <div className="aspect-video relative mb-4">
                <Chart type="positive" height="100%" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-blue-500" />
                    <span className="text-sm font-medium">{t('topTraders.title')}</span>
                  </div>
                  <div className="text-2xl font-bold">1,240+</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-green-500" />
                    <span className="text-sm font-medium">{t('topTraders.winRate')}</span>
                  </div>
                  <div className="text-2xl font-bold">68%</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={18} className="text-yellow-500" />
                    <span className="text-sm font-medium">{t('topTraders.profitPct')}</span>
                  </div>
                  <div className="text-2xl font-bold">+24.8%</div>
                </div>
              </div>
              <div className="flex justify-center">
                <Button onClick={() => setShowLogin(true)} className="gap-2">
                  {t('topTraders.joinRanking')}
                  <ArrowUpRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLogin && (
        <BacktestLogin 
          onLogin={handleLoginSubmit} 
        />
      )}
    </section>
  );
};

export default TopTradersSection;