import React, { useEffect, useRef } from 'react';

const ChartBackground: React.FC = () => {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (backgroundRef.current) {
      // Create grid lines
      for (let i = 0; i < 10; i++) {
        const horizontalLine = document.createElement('div');
        horizontalLine.classList.add('grid-line', 'horizontal');
        horizontalLine.style.top = `${i * 10}%`;
        
        const verticalLine = document.createElement('div');
        verticalLine.classList.add('grid-line', 'vertical');
        verticalLine.style.left = `${i * 10}%`;
        
        backgroundRef.current.appendChild(horizontalLine);
        backgroundRef.current.appendChild(verticalLine);
      }
      
      // Create animated chart lines with the new company theme
      for (let i = 0; i < 15; i++) {
        const line = document.createElement('div');
        line.classList.add('chart-line', 'premium');
        
        // Positioning and sizing with better distribution
        const left = 5 + Math.random() * 90; // Avoid edges
        const height = 30 + Math.random() * 180;
        const delay = Math.random() * 4;
        const duration = 8 + Math.random() * 10;
        const opacity = 0.1 + Math.random() * 0.3;
        
        line.style.left = `${left}%`;
        line.style.height = `${height}px`;
        line.style.animationDelay = `${delay}s`;
        line.style.animationDuration = `${duration}s`;
        line.style.opacity = opacity.toString();
        
        backgroundRef.current.appendChild(line);
      }
    }

    // Setup canvas for particles
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions
      const updateCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      updateCanvasSize();
      window.addEventListener('resize', updateCanvasSize);
      
      // Particles
      const particles: any[] = [];
      const particleCount = window.innerWidth < 768 ? 30 : 60;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 0.5 - 0.25,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
      
      // Animation
      const animate = () => {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
          // Update position
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          
          // Reset if out of bounds
          if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
          
          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(var(--primary-rgb), ${particle.opacity})`;
          ctx.fill();
        });
      };
      
      animate();
      
      return () => {
        window.removeEventListener('resize', updateCanvasSize);
      };
    }
  }, []);

  return (
    <div className="charts-background-container">
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="charts-background" ref={backgroundRef} />
      <div className="gradient-overlay"></div>
    </div>
  );
};

export default ChartBackground;
