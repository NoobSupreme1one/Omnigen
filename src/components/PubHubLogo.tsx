import React from 'react';

interface PubHubLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PubHubLogo: React.FC<PubHubLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        className={`${sizeClasses[size]} w-auto`}
        viewBox="0 0 200 50" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* PubHub text logo */}
        <text 
          x="10" 
          y="35" 
          fontSize="32" 
          fontWeight="600" 
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          <tspan fill="#3B82F6">Pub</tspan>
          <tspan fill="#1E40AF">Hub</tspan>
        </text>
      </svg>
    </div>
  );
};

export default PubHubLogo;
