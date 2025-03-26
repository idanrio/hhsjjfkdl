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
      {/* Modern gradient background with blue/light blue accent */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900 z-0"></div>
      
      {/* Pattern overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMzAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block p-2 px-4 bg-blue-500/10 rounded-full mb-4 backdrop-blur-sm">
            <span className="text-blue-400 font-medium">{t('markets.title')}</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            {t('markets.title')}
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            {t('markets.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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

        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-blue-500/20 rounded-xl p-8 lg:p-10 backdrop-blur-md shadow-xl">
          <div className="flex flex-col lg:flex-row items-start gap-10">
            <div className="lg:w-1/2">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">{t('markets.analysis.title')}</h3>
              </div>
              <p className="text-gray-300 mb-5 leading-relaxed">
                {t('markets.analysis.paragraph1')}
              </p>
              <p className="text-gray-300 mb-5 leading-relaxed">
                {t('markets.analysis.paragraph2')}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center shadow-lg shadow-blue-500/20">
                  {t('markets.analysis.readMore')}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <BacktestLogin onLogin={handleBacktestLogin} />
              </div>
            </div>
            <div className="w-full lg:w-1/2 h-80 bg-black/40 border border-blue-500/20 rounded-xl overflow-hidden relative shadow-xl">
              <Chart type="positive" height="100%" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketOverviewSection;
