'use client';

import { X } from 'lucide-react';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export type UrlFilterChipItem = {
  key: string;
  label: string;
  onRemove: () => void;
};

type UrlFilterChipsProps = {
  items: UrlFilterChipItem[];
  onClearAll?: () => void;
  className?: string;
};

/** Chips removibles para filtros sincronizados con URL (`useUrlFilters`). */
export function UrlFilterChips({ items, onClearAll, className }: UrlFilterChipsProps) {
  if (items.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((c) => (
        <Badge key={c.key} variant="secondary" className="gap-1 pr-1 font-normal">
          <span className="max-w-[min(100vw-8rem,280px)] truncate">{c.label}</span>
          <button
            type="button"
            aria-label={`Quitar filtro ${c.label}`}
            className="rounded p-0.5 hover:bg-muted"
            onClick={c.onRemove}
          >
            <X className="h-3 w-3 shrink-0" />
          </button>
        </Badge>
      ))}
      {onClearAll ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onClearAll}>
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}
