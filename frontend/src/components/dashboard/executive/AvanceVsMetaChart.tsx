'use client';

import { useId, useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Row = {
  name: string;
  avance_cierre?: number;
  meta_plan?: number;
  avance_global_prom?: number;
};

const tooltipBox = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(34, 211, 238, 0.25)',
  borderRadius: 8,
};

export function AvanceVsMetaChart({
  data: raw,
  height = 300,
  meta = 100,
}: {
  data: Row[];
  height?: number;
  meta?: number;
}) {
  const gradId = useId().replace(/:/g, '');
  const data = useMemo(
    () => raw.map((d) => ({ ...d, avance_cierre: d.avance_cierre ?? 0 })),
    [raw],
  );
  const last = data[data.length - 1];
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(51, 65, 85, 0.5)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgb(148, 163, 184)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 110]}
            tick={{ fill: 'rgb(100, 116, 139)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            contentStyle={tooltipBox}
            labelStyle={{ color: 'rgb(226, 232, 240)' }}
            formatter={(val: number) => [`${val}%`, 'Avance cierre (cerradas / creadas en el periodo)']}
            labelFormatter={(l) => String(l)}
          />
          <ReferenceLine
            y={meta}
            stroke="rgba(244, 63, 94, 0.65)"
            strokeDasharray="6 4"
            label={{
              value: `Meta ${meta}%`,
              position: 'right',
              fill: 'rgb(251, 113, 133)',
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="avance_cierre"
            name="Avance"
            stroke="#22d3ee"
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={{ r: 3, fill: '#a5f3fc', stroke: '#0891b2', strokeWidth: 1 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {last ? (
        <p className="mt-1 text-center text-[11px] text-slate-500">
          Último periodo · avance cierre {last.avance_cierre}% — referencia avance programas (motores){' '}
          {last.avance_global_prom ?? '—'}
          {typeof last.avance_global_prom === 'number' ? '%' : ''}
        </p>
      ) : null}
    </div>
  );
}
