'use client';

import { cn } from '@/lib/utils';

function WaveBg({ stroke }: { stroke: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
      viewBox="0 0 280 110"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 74 C 26 58, 52 91, 78 74 C 104 57, 130 90, 156 74 C 182 58, 208 89, 234 74 C 248 66, 264 72, 280 74"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      />
      <path
        d="M0 86 C 26 72, 52 99, 78 86 C 104 73, 130 98, 156 86 C 182 72, 208 99, 234 86 C 248 80, 264 84, 280 86"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}

type Percentages = [number, number, number] | number[];

export function SlaSemaforoWidget({
  onTime,
  atRisk,
  overdue,
  percentages,
  onCardClick,
}: {
  onTime: number;
  atRisk: number;
  overdue: number;
  percentages: Percentages;
  onCardClick?: (status: 'ok' | 'warning' | 'critical') => void;
}) {
  const pct = [
    Number(percentages[0] ?? 0),
    Number(percentages[1] ?? 0),
    Number(percentages[2] ?? 0),
  ];

  const cards = [
    {
      key: 'ok' as const,
      label: 'A tiempo',
      value: onTime,
      percentage: pct[0],
      border: 'border-emerald-500/50',
      glow: 'shadow-[0_0_24px_rgba(16,185,129,0.2)]',
      wave: '#10b981',
    },
    {
      key: 'warning' as const,
      label: 'En riesgo',
      value: atRisk,
      percentage: pct[1],
      border: 'border-amber-500/50',
      glow: 'shadow-[0_0_24px_rgba(245,158,11,0.2)]',
      wave: '#f59e0b',
    },
    {
      key: 'critical' as const,
      label: 'Vencido',
      value: overdue,
      percentage: pct[2],
      border: 'border-rose-500/50',
      glow: 'shadow-[0_0_24px_rgba(244,63,94,0.22)]',
      wave: '#f43f5e',
    },
  ] as const;

  return (
    <div className="space-y-3">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onCardClick?.(c.key)}
          className={cn(
            'relative w-full overflow-hidden rounded-xl border bg-slate-900/70 p-3 text-left',
            onCardClick ? 'cursor-pointer transition hover:bg-slate-900/90' : 'cursor-default',
            c.border,
            c.glow,
          )}
        >
          <WaveBg stroke={c.wave} />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-white tabular-nums">
                {c.value}{' '}
                <span className="text-sm font-medium text-slate-500">({c.percentage}%)</span>
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
