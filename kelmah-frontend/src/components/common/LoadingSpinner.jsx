import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '', 
  message = 'Loading...', 
  fullScreen = true,
  overlay = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-kelmah-primary',
    secondary: 'text-kelmah-secondary',
    accent: 'text-kelmah-accent'
  };

  const content = (
    <div 
      className={`flex justify-center items-center ${className}`} 
      role="status"
    >
      <svg 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {message && (
        <span className="sr-only">{message}</span>
      )}
    </div>
  );

  return overlay ? (
    <div 
      className={`fixed top-0 left-0 right-0 bottom-0 bg-white bg-opacity-90 z-50 ${fullScreen ? 'h-screen' : 'h-full'}`} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      {content}
    </div>
  ) : content;
};

export default LoadingSpinner;