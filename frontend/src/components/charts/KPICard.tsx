'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'purple';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const colorClasses = {
  red: 'bg-red-50 border-red-200',
  orange: 'bg-orange-50 border-orange-200',
  amber: 'bg-amber-50 border-amber-200',
  green: 'bg-green-50 border-green-200',
  blue: 'bg-blue-50 border-blue-200',
  purple: 'bg-purple-50 border-purple-200',
};

const textClasses = {
  red: 'text-red-700',
  orange: 'text-orange-700',
  amber: 'text-amber-700',
  green: 'text-green-700',
  blue: 'text-blue-700',
  purple: 'text-purple-700',
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  trend,
  color = 'blue',
  icon,
  className,
  onClick,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up')
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (trend.direction === 'down')
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <TrendingUp className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg transition-shadow border-2',
        colorClasses[color],
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={cn('text-2xl font-bold', textClasses[color])}>
                {value}
              </span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                {getTrendIcon()}
                <span
                  className={cn(
                    'text-xs font-semibold',
                    trend.direction === 'up'
                      ? 'text-green-600'
                      : trend.direction === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  )}
                >
                  {Math.abs(trend.value)}% {trend.direction === 'up' ? 'arriba' : trend.direction === 'down' ? 'abajo' : 'neutral'}
                </span>
              </div>
            )}
          </div>
          {icon && <div className="text-2xl">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
};
