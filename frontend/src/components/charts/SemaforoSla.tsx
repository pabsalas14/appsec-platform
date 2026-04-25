'use client';

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SemaforoItem {
  status: 'ok' | 'warning' | 'critical';
  label: string;
  count: number;
  percentage?: number;
}

interface SemaforoSlaProps {
  items: SemaforoItem[];
  title?: string;
  layout?: 'vertical' | 'horizontal';
  showPercentage?: boolean;
  className?: string;
}

const statusConfig = {
  ok: {
    color: 'bg-emerald-100 border-emerald-300',
    text: 'text-emerald-700',
    icon: CheckCircle,
  },
  warning: {
    color: 'bg-amber-100 border-amber-300',
    text: 'text-amber-700',
    icon: AlertTriangle,
  },
  critical: {
    color: 'bg-red-100 border-red-300',
    text: 'text-red-700',
    icon: AlertCircle,
  },
};

export const SemaforoSla: React.FC<SemaforoSlaProps> = ({
  items,
  title,
  layout = 'vertical',
  showPercentage = true,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      
      <div className={cn('flex gap-4', {
        'flex-col': layout === 'vertical',
        'flex-row': layout === 'horizontal',
      })}>
        {items.map((item) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;

          return (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 px-4 py-3',
                config.color
              )}
            >
              <Icon className={cn('h-5 w-5', config.text)} />
              <div className="flex flex-col gap-1">
                <p className={cn('text-sm font-medium', config.text)}>
                  {item.label}
                </p>
                <p className={cn('text-lg font-bold', config.text)}>
                  {item.count}
                  {showPercentage && item.percentage !== undefined && (
                    <span className="text-xs ml-1">({item.percentage}%)</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
