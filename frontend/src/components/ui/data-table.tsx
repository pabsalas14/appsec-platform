'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

/* ── Table Container ── */
export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

/* ── Table Head ── */
export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-white/[0.06]">
        {children}
      </tr>
    </thead>
  );
}

/* ── Table Header Cell ── */
export function DataTableTh({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/70',
      className
    )}>
      {children}
    </th>
  );
}

/* ── Sortable Table Header Cell ── */
export function SortableDataTableTh({
  children,
  className,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
}: {
  children?: React.ReactNode;
  className?: string;
  sortKey: string;
  currentSortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
}) {
  const isActive = currentSortKey === sortKey;
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/70',
        'cursor-pointer select-none transition-colors hover:text-muted-foreground',
        isActive && 'text-foreground',
        className,
      )}
      onClick={() => onSort(sortKey)}
      aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary-400" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary-400" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
        )}
      </span>
    </th>
  );
}

/* ── Table Body ── */
export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/[0.04]">{children}</tbody>;
}

/* ── Table Row ── */
export function DataTableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        'group transition-colors duration-150',
        'hover:bg-white/[0.03]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/* ── Table Cell ── */
export function DataTableCell({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-5 py-3.5', className)}>
      {children}
    </td>
  );
}

/* ── Filter Bar ── */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 mb-5">
      <div className="flex flex-wrap items-end gap-4">
        {children}
      </div>
    </div>
  );
}

/* ── Search Input (for filter bar) ── */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex-1 min-w-[200px]', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 pl-10 text-sm text-foreground
                     placeholder:text-muted-foreground/50 transition-all duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-500/50
                     hover:border-white/[0.15]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
