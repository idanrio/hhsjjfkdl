import React from 'react';
import Chart from './Chart';

const HeroSection: React.FC = () => {
  return (
    <section className="hero h-screen flex items-center relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="md:max-w-xl z-10 pt-20 md:pt-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
            Master the Markets with <span className="text-primary">Advanced Trading</span> Education
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            Capitalize on market opportunities with our comprehensive trading education platform. Learn strategies from expert traders and take control of your financial future.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary px-6 py-3 rounded font-semibold hover:bg-primary-light transition-all duration-300 flex items-center">
              Get Started
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
            <button className="border-2 border-primary px-6 py-3 rounded font-semibold hover:bg-primary transition-all duration-300 flex items-center">
              Watch Demo
              <i className="fas fa-play ml-2"></i>
            </button>
          </div>
        </div>

        <div className="w-full md:w-auto relative">
          <div className="w-full max-w-lg h-80 bg-primary/10 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden shadow-2xl mx-auto">
            <Chart type="positive" />
            <div className="absolute top-4 left-4 flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2">
                <i className="fas fa-chart-line text-white text-xs"></i>
              </div>
              <div>
                <div className="font-bold">S&P 500</div>
                <div className="text-success text-sm">+2.14%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
