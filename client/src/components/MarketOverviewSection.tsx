import React from 'react';
import MarketCard from './MarketCard';
import Chart from './Chart';
import { markets } from '@/lib/constants';

const MarketOverviewSection: React.FC = () => {
  return (
    <section id="markets" className="relative py-24">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/90 to-black/70 z-0"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Market Overview</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Stay informed with real-time market data and expert analysis from our trading professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {markets.map((market, index) => (
            <MarketCard
              key={index}
              name={market.name}
              icon={market.icon}
              change={market.change}
              changePercentage={market.changePercentage}
              currentValue={market.currentValue}
              highValue={market.highValue}
              trend={market.trend}
            />
          ))}
        </div>

        <div className="bg-primary/10 border border-white/5 rounded-xl p-8 lg:p-10 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="lg:w-1/2">
              <h3 className="text-2xl font-bold mb-5">Weekly Market Analysis</h3>
              <p className="text-white/70 mb-5 leading-relaxed">
                The S&P 500 continues its upward trend, driven by strong performance in technology stocks and positive economic indicators. Market sentiment remains optimistic despite concerns about inflation.
              </p>
              <p className="text-white/70 mb-5 leading-relaxed">
                Our analysis suggests a potential consolidation phase before the next leg up. Traders should watch key resistance levels around 4,200 and maintain appropriate risk management strategies.
              </p>
              <button className="bg-primary px-6 py-3 rounded font-semibold hover:bg-primary-light transition-all duration-300 flex items-center">
                Read Full Analysis
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
            <div className="w-full lg:w-1/2 h-72 bg-black/30 border border-white/10 rounded-xl overflow-hidden relative">
              <Chart type="positive" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketOverviewSection;
