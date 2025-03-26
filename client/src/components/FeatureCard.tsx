import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-black/30 border border-white/5 rounded-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-primary/10">
      <div className="bg-primary w-14 h-14 rounded-full flex items-center justify-center mb-6">
        <i className={`${icon} text-xl`}></i>
      </div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-white/70 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
