import React from 'react';

type Urgency = 'URGENT' | 'SERIOUS' | 'DAY_TO_DAY' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Urgency | 'DEFAULT' | 'SUCCESS' | 'INFO';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'DEFAULT', className = '' }) => {
  const styles: Record<string, string> = {
    URGENT: "bg-red-500/20 text-red-400 border-red-500/30",
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30", // Legacy support
    SERIOUS: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30", // Legacy support
    MEDIUM: "bg-orange-500/20 text-orange-400 border-orange-500/30", // Legacy support
    DAY_TO_DAY: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Legacy support
    SUCCESS: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    INFO: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    DEFAULT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[variant] || styles.DEFAULT} ${className}`}>
      {children}
    </span>
  );
};

