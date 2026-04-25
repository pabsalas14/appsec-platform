'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarSemaforoProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  threshold?: {
    warning: number;
    critical: number;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getBarColor = (
  value: number,
  threshold?: { warning: number; critical: number }
): string => {
  if (!threshold) return 'bg-blue-500';
  if (value >= threshold.critical) return 'bg-red-500';
  if (value >= threshold.warning) return 'bg-amber-500';
  return 'bg-emerald-500';
};

export const ProgressBarSemaforo: React.FC<ProgressBarSemaforoProps> = ({
  value,
  label,
  showPercent = true,
  threshold,
  className,
  size = 'md',
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const barColor = getBarColor(clampedValue, threshold);
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[size];

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showPercent && (
            <span className="text-sm font-semibold text-muted-foreground">
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
