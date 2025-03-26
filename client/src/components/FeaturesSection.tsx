import React from 'react';
import FeatureCard from './FeatureCard';
import { features } from '@/lib/constants';

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose Capitalure</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Our platform offers unparalleled resources and tools to help you succeed in today's complex financial markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
