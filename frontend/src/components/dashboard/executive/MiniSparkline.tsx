'use client';

import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export function MiniSparkline({
  values,
  color = '#22d3ee',
  height = 36,
  className,
}: {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const gradId = useId().replace(/:/g, '');
  const data = values.map((v, i) => ({ i, v: Math.max(0, v) }));
  if (data.length === 0) {
    return <div className={className} style={{ height }} />;
  }
  return (
    <div className={className} style={{ height, minWidth: 64 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
