'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type Item = { label: string; value: number; color?: string };

export function TopReposExecutiveList({
  data,
  hrefVerTodos,
  className,
}: {
  data: Item[];
  hrefVerTodos: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {data.map((row) => {
        const w = (row.value / max) * 100;
        return (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,1fr)_minmax(48px,2fr)_52px] items-center gap-2 text-[12px]"
          >
            <span className="truncate font-medium text-slate-200" title={row.label}>
              {row.label}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                style={{ width: `${w}%` }}
              />
            </div>
            <span className="text-right font-mono tabular-nums text-rose-200">{row.value}</span>
          </div>
        );
      })}
      <Link
        href={hrefVerTodos}
        className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/10"
      >
        Ver todos los repositorios
        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
      </Link>
    </div>
  );
}
