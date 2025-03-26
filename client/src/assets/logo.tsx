import React from 'react';
import logo from '@/assets/images/Capitulre.png';

export const CapitulreLogo: React.FC<{ className?: string }> = ({ className = 'h-10' }) => {
  return (
    <img 
      src={logo} 
      alt="Capitulre" 
      className={className}
    />
  );
};

export default CapitulreLogo;