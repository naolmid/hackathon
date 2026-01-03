import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>}
      <input
        className={`
          w-full bg-[#0a0a0c] border border-zinc-800 rounded-[8px] px-4 py-2.5 text-zinc-200 placeholder-zinc-600
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50
          ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

