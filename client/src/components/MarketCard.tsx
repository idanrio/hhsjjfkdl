import React from 'react';
import Chart from './Chart';

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
  return (
    <div className="bg-black/60 border border-white/10 rounded-xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2">
            <i className={`${icon} text-xs`}></i>
          </div>
          <div className="font-bold">{name}</div>
        </div>
        <div className={`font-bold ${trend === 'positive' ? 'text-success bg-success/10' : 'text-danger bg-danger/10'} px-3 py-1 rounded text-sm`}>
          {changePercentage}
        </div>
      </div>
      <div className="h-36 mb-4">
        <Chart type={trend} />
      </div>
      <div className="flex justify-between">
        <div className="text-center">
          <div className="font-bold">{currentValue}</div>
          <div className="text-xs text-white/60">Current</div>
        </div>
        <div className="text-center">
          <div className={`font-bold ${trend === 'positive' ? 'text-success' : 'text-danger'}`}>
            {change}
          </div>
          <div className="text-xs text-white/60">Change</div>
        </div>
        <div className="text-center">
          <div className="font-bold">{highValue}</div>
          <div className="text-xs text-white/60">High</div>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
