"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

/**
 * Reads the current HSL values of CSS variables for recharts theming.
 * Re-evaluated when the theme toggles so charts follow light/dark.
 */
function useThemeColors() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({
    primary: '#ef4444',
    muted: '#9ca3af',
    border: '#2a2a2a',
    foreground: '#f3f4f6',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const styles = getComputedStyle(document.documentElement);
    const hsl = (name: string) => {
      const v = styles.getPropertyValue(name).trim();
      return v ? `hsl(${v})` : '';
    };
    setColors({
      primary: hsl('--primary') || '#ef4444',
      muted: hsl('--muted-foreground') || '#9ca3af',
      border: hsl('--border') || '#2a2a2a',
      foreground: hsl('--foreground') || '#f3f4f6',
    });
  }, [resolvedTheme]);

  return colors;
}

const PALETTE = [
  'hsl(var(--primary))',
  'hsl(220 90% 56%)',
  'hsl(30 90% 55%)',
  'hsl(160 70% 45%)',
  'hsl(280 70% 60%)',
  'hsl(340 75% 55%)',
];

type ChartCardProps = {
  title: string;
  subtitle?: string;
  height?: number;
  children: React.ReactNode;
};

function ChartCard({ title, subtitle, height = 260, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </CardHeader>
      <CardContent>
        <div style={{ height, width: '100%' }}>
          <ResponsiveContainer>{children as React.ReactElement}</ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Bar chart ─────────────────────────────────────────────────────────────

export function BarChartCard({
  title,
  subtitle,
  data,
  dataKey,
  xKey,
}: {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey: string;
}) {
  const c = useThemeColors();
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <BarChart data={data}>
        <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} stroke={c.muted} fontSize={12} />
        <YAxis stroke={c.muted} fontSize={12} allowDecimals={false} />
        <RechartsTooltip
          contentStyle={{ background: 'hsl(var(--card))', border: `1px solid ${c.border}`, borderRadius: 8, color: c.foreground }}
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
        />
        <Bar dataKey={dataKey} fill={c.primary} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

// ─── Donut chart ───────────────────────────────────────────────────────────

export function DonutChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: Array<{ name: string; value: number }>;
}) {
  const c = useThemeColors();
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <PieChart>
        <Pie data={data} innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
          {data.map((_, idx) => (
            <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} stroke="hsl(var(--background))" strokeWidth={2} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12, color: c.muted }} />
        <RechartsTooltip
          contentStyle={{ background: 'hsl(var(--card))', border: `1px solid ${c.border}`, borderRadius: 8, color: c.foreground }}
        />
      </PieChart>
    </ChartCard>
  );
}

// ─── Line chart ────────────────────────────────────────────────────────────

export function LineChartCard({
  title,
  subtitle,
  data,
  xKey,
  dataKey,
}: {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  dataKey: string;
}) {
  const c = useThemeColors();
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <LineChart data={data}>
        <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} stroke={c.muted} fontSize={11} />
        <YAxis stroke={c.muted} fontSize={12} allowDecimals={false} />
        <RechartsTooltip
          contentStyle={{ background: 'hsl(var(--card))', border: `1px solid ${c.border}`, borderRadius: 8, color: c.foreground }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={c.primary}
          strokeWidth={2}
          dot={{ fill: c.primary, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartCard>
  );
}

// ─── Export specialized components ──────────────────────────────────────────

export { GaugeChart } from './GaugeChart';
export { AreaLineChart } from './AreaLineChart';
export { HorizontalBarRanking } from './HorizontalBarRanking';
export { SemaforoSla } from './SemaforoSla';
export { DataTable } from './DataTable';
export { KPICard } from './KPICard';
