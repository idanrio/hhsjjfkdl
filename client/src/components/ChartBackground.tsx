import React, { useEffect, useRef } from 'react';

const ChartBackground: React.FC = () => {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backgroundRef.current) {
      // Create 20 random chart lines
      for (let i = 0; i < 20; i++) {
        const line = document.createElement('div');
        line.classList.add('chart-line');
        
        // Random positioning and sizing
        const left = Math.random() * 100;
        const height = 50 + Math.random() * 250;
        const delay = Math.random() * 3;
        const duration = 5 + Math.random() * 7;
        
        line.style.left = `${left}%`;
        line.style.height = `${height}px`;
        line.style.animationDelay = `${delay}s`;
        line.style.animationDuration = `${duration}s`;
        
        backgroundRef.current.appendChild(line);
      }
    }
  }, []);

  return (
    <div className="charts-background" ref={backgroundRef} />
  );
};

export default ChartBackground;
