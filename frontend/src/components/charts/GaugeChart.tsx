'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number; // 0-100
  title?: string;
  label?: string;
  color?: string;
  showPercent?: boolean;
  threshold?: {
    warning: number; // percentage
    critical: number; // percentage
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getGaugeColor = (
  value: number,
  threshold?: { warning: number; critical: number }
): string => {
  if (!threshold) return '#3b82f6'; // blue default
  if (value >= threshold.critical) return '#ef4444'; // red
  if (value >= threshold.warning) return '#f59e0b'; // amber
  return '#10b981'; // green
};

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  title,
  label,
  color,
  showPercent = true,
  threshold,
  size = 'md',
  className,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const gaugeColor = color || getGaugeColor(clampedValue, threshold);
  
  const sizeConfig = {
    sm: { height: 200, labelSize: 12 },
    md: { height: 280, labelSize: 16 },
    lg: { height: 360, labelSize: 20 },
  };

  const config = sizeConfig[size];

  // Create data for semi-circular gauge
  const data = [
    { name: 'used', value: clampedValue },
    { name: 'unused', value: 100 - clampedValue },
  ];

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      
      <ResponsiveContainer width="100%" height={config.height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={gaugeColor} />
            <Cell fill="#e5e7eb" />
          </Pie>
          <Tooltip 
            formatter={(value) => `${value}%`}
            contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col items-center gap-1">
        {showPercent && (
          <div className={cn('font-bold', {
            'text-2xl': size === 'md',
            'text-lg': size === 'sm',
            'text-3xl': size === 'lg',
          })}>
            {clampedValue}%
          </div>
        )}
        {label && (
          <p className="text-xs text-muted-foreground">{label}</p>
        )}
      </div>
    </div>
  );
};
