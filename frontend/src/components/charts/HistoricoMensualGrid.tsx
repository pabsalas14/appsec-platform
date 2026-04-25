'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MonthData {
  month: number; // 1-12
  value: number; // 0-100 (percentage)
  color?: string;
}

interface HistoricoMensualGridProps {
  months: MonthData[];
  title?: string;
  year?: number;
  className?: string;
}

const getColorForValue = (value: number): string => {
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 50) return 'bg-amber-500';
  if (value >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

const monthNames = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const HistoricoMensualGrid: React.FC<HistoricoMensualGridProps> = ({
  months,
  title,
  year = new Date().getFullYear(),
  className,
}) => {
  const monthMap: Record<number, MonthData> = {};
  months.forEach((m) => {
    monthMap[m.month] = m;
  });

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{year}</span>
        </div>

        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const data = monthMap[month];
            const value = data?.value ?? 0;
            const bgColor = data?.color || getColorForValue(value);

            return (
              <div
                key={month}
                className="flex flex-col items-center gap-1"
                title={`${monthNames[month - 1]} ${year}: ${value}%`}
              >
                <div
                  className={cn(
                    'h-12 w-8 rounded border border-gray-200 transition-all hover:scale-110',
                    bgColor
                  )}
                  style={{ opacity: value / 100 }}
                />
                <span className="text-xs text-muted-foreground">
                  {monthNames[month - 1]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs mt-2">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">&gt;80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-amber-500" />
            <span className="text-muted-foreground">50-80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span className="text-muted-foreground">25-50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span className="text-muted-foreground">&lt;25%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
