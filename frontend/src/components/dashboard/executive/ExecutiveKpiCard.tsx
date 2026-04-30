'use client';

import { ChevronRight, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type BreakdownItem = {
  label: string;
  value: number | string;
  className?: string;
};

export function ExecutiveKpiCard({
  title,
  mainValue,
  subtitle,
  trendDirection,
  trendValue,
  icon: Icon,
  breakdown,
  onClick,
  showBlueArc,
}: {
  title: string;
  mainValue: string | number;
  subtitle: string;
  trendDirection: 'up' | 'down';
  trendValue: string;
  icon: LucideIcon;
  breakdown?: BreakdownItem[];
  onClick?: () => void;
  showBlueArc?: boolean;
}) {
  const directionTone =
    trendDirection === 'up' ? 'text-emerald-400' : 'text-rose-300';
  const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;
  const base =
    'glass-hover relative overflow-hidden rounded-xl p-4 text-left shadow-sm';

  const content = (
    <>
      {showBlueArc ? (
        <div className="pointer-events-none absolute -right-8 -top-6 h-20 w-20 rounded-full border-[6px] border-cyan-400/40 border-l-transparent border-b-transparent" />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-foreground">
            <Icon className="h-4 w-4 text-primary" />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
        </div>
        {onClick ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
      </div>

      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{mainValue}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>

      <div className={cn('mt-2 inline-flex items-center gap-1 text-[11px] font-medium', directionTone)}>
        <TrendIcon className="h-3.5 w-3.5" />
        <span>{trendValue}</span>
      </div>

      {breakdown && breakdown.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {breakdown.map((item) => (
            <span
              key={`${item.label}-${item.value}`}
              className={cn(
                'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                item.className ?? 'bg-slate-800 text-slate-200',
              )}
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, 'w-full cursor-pointer')}>
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}
