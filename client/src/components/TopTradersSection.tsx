import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  const isRtl = i18n.language === 'he';

  // Sample data for top traders
  const topTraders: TopTrader[] = [
    {
      id: 1,
      name: 'Alex Morgan',
      winRate: 78,
      totalProfit: 28750,
      profitPercentage: 112.5,
      tradingPair: 'BTC/USD',
      position: 1
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      winRate: 73,
      totalProfit: 21340,
      profitPercentage: 87.2,
      tradingPair: 'ETH/USD',
      position: 2
    },
    {
      id: 3,
      name: 'David Chen',
      winRate: 69,
      totalProfit: 16890,
      profitPercentage: 68.4,
      tradingPair: 'BTC/USD',
      position: 3
    },
    {
      id: 4,
      name: 'Emma Williams',
      winRate: 65,
      totalProfit: 12450,
      profitPercentage: 55.3,
      tradingPair: 'AAPL',
      position: 4
    },
    {
      id: 5,
      name: 'Michael Brown',
      winRate: 62,
      totalProfit: 9870,
      profitPercentage: 42.1,
      tradingPair: 'MSFT',
      position: 5
    }
  ];

  return (
    <section id="top-traders" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{t('topTraders.title')}</h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            {t('topTraders.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {topTraders.map((trader) => (
            <Card 
              key={trader.id}
              className={`relative overflow-hidden bg-black/60 backdrop-blur-sm border border-white/10 hover:border-primary/40 transition-all duration-300 ${trader.position === 1 ? 'transform md:scale-110 shadow-lg z-10' : ''}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 to-primary/30"></div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <div className="flex items-center justify-center w-full h-full bg-primary/20 text-lg font-bold">
                        {trader.name.charAt(0)}
                      </div>
                    </Avatar>
                    <div>
                      <div className="font-bold">{trader.name}</div>
                      <div className="text-sm text-white/60">{trader.tradingPair}</div>
                    </div>
                  </div>
                  <Badge className={
                    trader.position === 1 ? 'bg-amber-500' : 
                    trader.position === 2 ? 'bg-slate-400' : 
                    trader.position === 3 ? 'bg-amber-700' : 'bg-gray-700'
                  }>
                    #{trader.position}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-5">
                  <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} justify-between text-sm`}>
                    <span className="text-white/60">{t('topTraders.winRate')}</span>
                    <span className="font-medium">{trader.winRate}%</span>
                  </div>
                  <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} justify-between text-sm`}>
                    <span className="text-white/60">{t('topTraders.profit')}</span>
                    <span className="font-medium text-success">${trader.totalProfit.toLocaleString()}</span>
                  </div>
                  <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} justify-between text-sm`}>
                    <span className="text-white/60">{t('topTraders.profitPct')}</span>
                    <span className="font-medium text-success">+{trader.profitPercentage}%</span>
                  </div>
                </div>
                
                {trader.position === 1 && (
                  <div className="mt-4">
                    <Button className="w-full bg-primary/80 hover:bg-primary text-sm">
                      {t('topTraders.viewStrategy')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            className="border-primary/30 hover:bg-primary/10 px-8"
          >
            {t('topTraders.viewAll')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TopTradersSection;