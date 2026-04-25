'use client';

import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface AreaLineChartProps {
  data: ChartDataPoint[];
  series: Array<{
    key: string;
    name: string;
    color: string;
    type: 'area' | 'line';
  }>;
  title?: string;
  xAxisKey?: string;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export const AreaLineChart: React.FC<AreaLineChartProps> = ({
  data,
  series,
  title,
  xAxisKey = 'name',
  height = 300,
  showLegend = true,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            {series
              .filter((s) => s.type === 'area')
              .map((s) => (
                <linearGradient
                  key={s.key}
                  id={`gradient-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
          {showLegend && <Legend />}

          {series
            .filter((s) => s.type === 'area')
            .map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fillOpacity={1}
                fill={`url(#gradient-${s.key})`}
              />
            ))}

          {series
            .filter((s) => s.type === 'line')
            .map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
