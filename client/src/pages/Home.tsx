import React from 'react';
import ChartBackground from '@/components/ChartBackground';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import MarketOverviewSection from '@/components/MarketOverviewSection';
import TopTradersSection from '@/components/TopTradersSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Home: React.FC = () => {
  return (
    <>
      <ChartBackground />
      <Header />
      <HeroSection />
      <FeaturesSection />
      <MarketOverviewSection />
      <TopTradersSection />
      <CTASection />
      <Footer />
    </>
  );
};

export default Home;
