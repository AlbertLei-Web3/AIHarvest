import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
}) => {
  const hoverStyles = hoverable 
    ? 'transform transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer' 
    : '';

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export interface CardImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export const CardImage: React.FC<CardImageProps> = ({ 
  src, 
  alt = '', 
  className = '' 
}) => (
  <div className={`w-full ${className}`}>
    <img src={src} alt={alt} className="w-full h-full object-cover" />
  </div>
);

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-lg font-semibold mb-2 ${className}`}>
    {children}
  </h3>
);

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-4 py-3 bg-gray-50 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

export default Card; 