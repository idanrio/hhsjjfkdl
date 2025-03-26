import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MarketCard from './MarketCard';
import Chart from './Chart';
import BacktestLogin from './BacktestLogin';
import { getMultipleMarketData, MarketData } from '@/services/marketService';

const MarketOverviewSection: React.FC = () => {
  const { t } = useTranslation();
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoading(true);
        const data = await getMultipleMarketData();
        setMarketData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError(t('markets.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [t]);

  const handleBacktestLogin = (email: string, password: string) => {
    // Here you would verify credentials against your backend
    console.log('Login attempt with:', email, password);
    // After successful login, you would redirect to the backtesting system
    alert(`Login successful! Welcome ${email}`);
  };

  return (
    <section id="markets" className="relative py-24">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/90 to-black/70 z-0"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('markets.title')}</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            {t('markets.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {marketData.map((market, index) => (
              <MarketCard
                key={index}
                name={market.name}
                icon={market.icon}
                change={market.change.toFixed(2)}
                changePercentage={market.changePercent.toFixed(2) + '%'}
                currentValue={market.price.toFixed(2)}
                highValue={market.high.toFixed(2)}
                trend={market.change >= 0 ? 'positive' : 'negative'}
              />
            ))}
          </div>
        )}

        <div className="bg-primary/10 border border-white/5 rounded-xl p-8 lg:p-10 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="lg:w-1/2">
              <h3 className="text-2xl font-bold mb-5">{t('markets.analysis.title')}</h3>
              <p className="text-white/70 mb-5 leading-relaxed">
                {t('markets.analysis.paragraph1')}
              </p>
              <p className="text-white/70 mb-5 leading-relaxed">
                {t('markets.analysis.paragraph2')}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button className="bg-primary px-6 py-3 rounded font-semibold hover:bg-primary-light transition-all duration-300 flex items-center">
                  {t('markets.analysis.readMore')}
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>
                
                <BacktestLogin onLogin={handleBacktestLogin} />
              </div>
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
