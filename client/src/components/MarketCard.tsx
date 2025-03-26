import React from 'react';
import Chart from './Chart';
import { useTranslation } from 'react-i18next';

interface MarketCardProps {
  name: string;
  icon: string;
  change: string;
  changePercentage: string;
  currentValue: string;
  highValue: string;
  trend: 'positive' | 'negative';
}

const MarketCard: React.FC<MarketCardProps> = ({
  name,
  icon,
  change,
  changePercentage,
  currentValue,
  highValue,
  trend
}) => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'he';

  return (
    <div className="bg-black/60 border border-brand-accent/20 rounded-xl p-6 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:border-brand-accent/40 transition-all duration-300">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-accent/30 flex items-center justify-center mr-3">
            <i className={`${icon} text-brand-accent`}></i>
          </div>
          <div className="font-bold text-lg">{name}</div>
        </div>
        <div className={`font-bold ${trend === 'positive' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'} px-4 py-1.5 rounded-full text-sm`}>
          {changePercentage}
        </div>
      </div>
      <div className="h-36 mb-6 relative overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-0"></div>
        <Chart type={trend} />
      </div>
      <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} justify-between`}>
        <div className="text-center">
          <div className="font-bold text-lg">{currentValue}</div>
          <div className="text-xs text-white/60">{t('markets.current')}</div>
        </div>
        <div className="text-center">
          <div className={`font-bold text-lg ${trend === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </div>
          <div className="text-xs text-white/60">{t('markets.change')}</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg">{highValue}</div>
          <div className="text-xs text-white/60">{t('markets.high')}</div>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
