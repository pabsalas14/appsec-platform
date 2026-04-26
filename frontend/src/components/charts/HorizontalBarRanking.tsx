'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface RankingItem {
  label: string;
  value: number;
  color?: string;
}

interface HorizontalBarRankingProps {
  data: RankingItem[];
  title?: string;
  limit?: number;
  showValues?: boolean;
  className?: string;
}

const defaultColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
];

export const HorizontalBarRanking: React.FC<HorizontalBarRankingProps> = ({
  data,
  title,
  limit = 10,
  showValues = true,
  className,
}) => {
  const limitedData = data.slice(0, limit).map((item, idx) => ({
    ...item,
    color: item.color || defaultColors[idx % defaultColors.length],
  }));

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}

      <ResponsiveContainer width="100%" height={Math.max(200, limitedData.length * 30)}>
        <BarChart
          data={limitedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="label" type="category" width={140} />
          <Tooltip formatter={(value) => Number(value).toLocaleString()} />
          <Bar dataKey="value" fill="#8884d8" radius={[0, 8, 8, 0]}>
            {limitedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {showValues && (
        <div className="text-xs text-muted-foreground text-right">
          Total: {limitedData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
        </div>
      )}
    </div>
  );
};
