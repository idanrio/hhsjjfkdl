import React from 'react';
import Chart from './Chart';
import { ArrowRight, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="hero h-screen flex items-center relative overflow-hidden">
      {/* Background gradients using brand colors */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-brand-primary/20 to-black z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-brand-accent/10 filter blur-[80px]"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-brand-primary/15 filter blur-[100px]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="md:max-w-xl z-10 pt-20 md:pt-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
            {t('hero.title.part1')} <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-primary">{t('hero.title.part2')}</span> {t('hero.title.part3')}
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-brand-primary px-6 py-3 rounded font-semibold hover:bg-brand-primary/90 transition-all duration-300 flex items-center shadow-lg shadow-brand-primary/20">
              {t('hero.getStarted')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button className="border-2 border-brand-accent px-6 py-3 rounded font-semibold hover:bg-brand-accent/10 transition-all duration-300 flex items-center">
              {t('hero.watchDemo')}
              <Play className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="w-full md:w-auto relative">
          <div className="w-full max-w-lg h-80 bg-gray-900/50 border border-brand-accent/20 rounded-xl backdrop-blur-sm overflow-hidden shadow-2xl mx-auto">
            <Chart type="positive" />
            <div className="absolute top-4 left-4 flex items-center">
              <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center mr-2">
                <i className="fas fa-chart-line text-white text-xs"></i>
              </div>
              <div>
                <div className="font-bold">S&P 500</div>
                <div className="text-green-400 text-sm">+2.14%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
