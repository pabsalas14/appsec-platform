'use client';

import { cn } from '@/lib/utils';

/** Anillo compacto de postura (0–100); estética mockup / command center. */
export function PostureRing({
  value,
  label,
  sub,
  size = 112,
  className,
}: {
  value: number;
  label: string;
  sub?: string;
  size?: number;
  className?: string;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (c * pct) / 100;
  const tone =
    pct >= 60 ? 'text-emerald-300' : pct >= 40 ? 'text-amber-300' : 'text-rose-300';
  const ring = pct >= 60 ? 'stroke-emerald-400' : pct >= 40 ? 'stroke-amber-400' : 'stroke-rose-400';

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      style={{ width: size, minWidth: size }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-slate-800"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className={cn('transition-[stroke-dashoffset] duration-700', ring)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.25))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold tabular-nums', tone)}>{pct}</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">%</span>
        </div>
      </div>
      <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      {sub ? <p className="text-center text-[9px] text-slate-500">{sub}</p> : null}
    </div>
  );
}
