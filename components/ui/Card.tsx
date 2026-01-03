import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-[#16181d] border border-zinc-800/50 rounded-[16px] overflow-hidden transition-all duration-300
        ${hoverable ? 'hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 cursor-pointer transform hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-zinc-800/50 ${className}`}>{children}</div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 border-t border-zinc-800/50 bg-zinc-900/30 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-white ${className}`}>{children}</h3>
);

