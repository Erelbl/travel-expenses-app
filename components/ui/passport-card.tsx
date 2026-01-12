import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PassportCard Component
 * Warm off-white "passport paper" surface with subtle shadows
 */

interface PassportCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  noPadding?: boolean;
}

export const PassportCard = React.forwardRef<HTMLDivElement, PassportCardProps>(
  ({ children, className, elevated = false, noPadding = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border transition-all duration-200',
          elevated 
            ? 'bg-white shadow-lg border-slate-200/60' 
            : 'bg-[#fef8f0] shadow-md border-slate-300/40',
          !noPadding && 'p-6',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

PassportCard.displayName = 'PassportCard';

/**
 * Stamp Badge Component
 * Small rounded badge for country/currency stamps
 */

interface StampBadgeProps {
  children: React.ReactNode;
  variant?: 'country' | 'currency' | 'category';
  className?: string;
}

export const StampBadge: React.FC<StampBadgeProps> = ({ 
  children, 
  variant = 'country',
  className 
}) => {
  const variantStyles = {
    country: 'bg-teal-50 text-teal-800 border-teal-200',
    currency: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    category: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

