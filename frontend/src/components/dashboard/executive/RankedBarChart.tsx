'use client';

import { cn } from '@/lib/utils';

export function RankedBarChart({
  data,
  className,
  onRowClick,
}: {
  data: Array<{ name: string; count: number }>;
  className?: string;
  onRowClick?: (row: { name: string; count: number }) => void;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ul className={cn('space-y-2', className)}>
      {data.map((row) => {
        const width = Math.round((row.count / max) * 100);
        return (
          <li key={row.name}>
            <button
              type="button"
              onClick={() => onRowClick?.(row)}
              className={cn(
                'grid w-full grid-cols-[minmax(0,1fr)_minmax(64px,2fr)_48px] items-center gap-2 rounded-md',
                onRowClick ? 'cursor-pointer hover:bg-muted/20' : 'cursor-default',
              )}
            >
            <span className="truncate text-[12px] font-medium text-slate-200" title={row.name}>
              {row.name}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-right font-mono text-[12px] text-rose-200 tabular-nums">
              {row.count}
            </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
