import React from 'react';

// Reusable Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'transition-all duration-300 rounded-md focus:outline-none focus:ring-2';
  
  const variantStyles = {
    primary: 'bg-kelmah-primary text-white hover:bg-blue-600 focus:ring-blue-300',
    secondary: 'bg-kelmah-secondary text-white hover:bg-green-600 focus:ring-green-300',
    outline: 'border border-kelmah-primary text-kelmah-primary hover:bg-blue-50 focus:ring-blue-200',
    danger: 'bg-kelmah-accent text-white hover:bg-red-600 focus:ring-red-300'
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input = ({ 
  label, 
  type = 'text', 
  className = '', 
  error, 
  ...props 
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`form-input ${error ? 'border-kelmah-accent' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-kelmah-accent">{error}</p>
      )}
    </div>
  );
};

// Card Component
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`card bg-white shadow-kelmah-card rounded-lg p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="relative w-auto max-w-3xl mx-auto my-6">
        <Card className={`relative flex flex-col w-full ${className}`}>
          <div className="flex items-center justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
            <h3 className="text-2xl font-semibold">{title}</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
          <div className="relative flex-auto p-6">
            {children}
          </div>
        </Card>
      </div>
      <div className="fixed inset-0 z-40 bg-black opacity-25"></div>
    </div>
  );
};

export default {
  Button,
  Input,
  Card,
  Modal
};
