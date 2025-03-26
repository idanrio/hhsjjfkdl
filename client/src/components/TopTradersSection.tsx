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
    <section className="py-20 relative">
      {/* Modern gradient background with blue accent */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 via-gray-900 to-gray-900 z-0"></div>
      
      {/* Pattern overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMzAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block p-2 px-4 bg-blue-500/10 rounded-full mb-4 backdrop-blur-sm">
            <span className="text-blue-400 font-medium">{t('navigation.topTraders')}</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            {t('topTraders.title')}
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            {t('topTraders.subtitle')}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-10">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl shadow-xl overflow-hidden border border-blue-500/20 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 mr-3">
                    <Award size={20} className="text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('navigation.topTraders')}</h3>
                </div>
                <Badge className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">Top 5</Badge>
              </div>
              
              <div className="space-y-4">
                {topTraders.map((trader) => (
                  <div 
                    key={trader.id} 
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      trader.position <= 3 
                        ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/10 border border-blue-500/30' 
                        : 'bg-gray-800/50 border border-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${getBadgeColor(trader.position)}`}>
                        {trader.position}
                      </Badge>
                      <Avatar className="h-12 w-12 border-2 border-blue-500/30 shadow-md shadow-blue-500/10">
                        <div className="flex h-full w-full items-center justify-center bg-gray-800 text-lg font-semibold uppercase text-white">
                          {trader.name.charAt(0)}
                        </div>
                      </Avatar>
                      <div className={`text-${isRTL ? 'right' : 'left'}`}>
                        <div className="font-medium text-white">{trader.name}</div>
                        <div className="text-sm text-gray-400">{trader.tradingPair}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className={`text-${isRTL ? 'left' : 'right'}`}>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('topTraders.winRate')}</div>
                        <div className="font-medium text-green-400">{trader.winRate}%</div>
                      </div>
                      <div className={`text-${isRTL ? 'left' : 'right'} min-w-[100px]`}>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('topTraders.profit')}</div>
                        <div className="font-medium text-white">{formatCurrency(trader.totalProfit)}</div>
                      </div>
                      <div className={`text-${isRTL ? 'left' : 'right'}`}>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('topTraders.profitPct')}</div>
                        <div className="font-medium text-green-400">+{trader.profitPercentage}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-center">
                <Button variant="outline" className="gap-2 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
                  {t('topTraders.viewAll')}
                  <ArrowUpRight size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl shadow-xl overflow-hidden border border-blue-500/20 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 mr-3">
                  <TrendingUp size={20} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white">{t('features.analytics.title')}</h3>
              </div>
              
              <div className="aspect-video relative mb-6 border border-blue-500/20 rounded-lg overflow-hidden shadow-md">
                <Chart type="positive" height="100%" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-300">{t('topTraders.title')}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">1,240+</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-green-500" />
                    <span className="text-sm font-medium text-gray-300">{t('topTraders.winRate')}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">68%</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={18} className="text-yellow-500" />
                    <span className="text-sm font-medium text-gray-300">{t('topTraders.profitPct')}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">+24.8%</div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowLogin(true)} 
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                >
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