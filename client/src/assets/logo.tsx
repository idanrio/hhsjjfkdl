import React from 'react';

export const CapitulreLogo: React.FC<{ className?: string }> = ({ className = 'h-10' }) => {
  return (
    <img 
      src="/images/capitulre-logo.png" 
      alt="Capitulre" 
      className={className}
    />
  );
};

export default CapitulreLogo;