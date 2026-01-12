import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge/Pill component for categories, countries, currencies
 * Consistent styling across the app
 */

interface BadgePillProps {
  children: React.ReactNode;
  variant?: 'default' | 'country' | 'currency' | 'category';
  size?: 'sm' | 'md';
  className?: string;
}

export const BadgePill: React.FC<BadgePillProps> = ({ 
  children, 
  variant = 'default',
  size = 'sm',
  className 
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    country: 'bg-sky-50 text-sky-700 border-sky-200',
    currency: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    category: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

