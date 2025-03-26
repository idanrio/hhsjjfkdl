import React from 'react';

interface ChartProps {
  type: 'positive' | 'negative';
  height?: string;
}

const Chart: React.FC<ChartProps> = ({ type, height = 'h-full' }) => {
  // Define different path patterns for positive and negative charts
  const positivePath = "M0,120 Q50,100 100,110 T200,95 T300,115 T400,90 T500,70 T600,50";
  const positiveArea = "M0,120 Q50,100 100,110 T200,95 T300,115 T400,90 T500,70 T600,50 V320 H0 Z";
  
  const negativePath = "M0,40 Q25,45 50,50 T100,65 T150,55 T200,70 T250,80 T300,90";
  const negativeArea = "M0,40 Q25,45 50,50 T100,65 T150,55 T200,70 T250,80 T300,90 V140 H0 Z";

  return (
    <svg className={`w-full ${height} market-chart`}>
      <defs>
        <linearGradient id="positiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#28a745" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#28a745" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="negativeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc3545" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#dc3545" stopOpacity="0"/>
        </linearGradient>
      </defs>
      
      {type === 'positive' ? (
        <>
          <path className="chart-line-positive" d={positivePath} />
          <path className="chart-area-positive" d={positiveArea} />
        </>
      ) : (
        <>
          <path className="chart-line-negative" d={negativePath} />
          <path className="chart-area-negative" d={negativeArea} />
        </>
      )}
    </svg>
  );
};

export default Chart;
