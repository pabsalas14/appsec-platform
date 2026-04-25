'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button, Select } from '@/components/ui';

import { CATALOG_PAGE_SIZES } from '@/hooks/useClientPagedList';

type Props = {
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
  pageSize: number;
  onPageChange: (next: number) => void;
  onPageSizeChange: (size: number) => void;
};

/**
 * Barra inferior de paginación para listados de catálogo (A1).
 */
export function CatalogPaginationBar({
  page,
  pageCount,
  total,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando{' '}
        <span className="font-medium text-foreground">
          {from}-{to}
        </span>{' '}
        de <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filas</span>
          <Select
            className="w-[88px]"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={CATALOG_PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[100px] text-center text-sm tabular-nums">
            {page + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount - 1}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
