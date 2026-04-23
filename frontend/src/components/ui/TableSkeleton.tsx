'use client';

import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  /** Number of columns to render */
  columns?: number;
  /** Number of rows to render */
  rows?: number;
  /** Column widths (cycle through if fewer than columns) */
  columnWidths?: string[];
  /** Additional className on the wrapper */
  className?: string;
}

/**
 * A skeleton loader that mirrors the DataTable glass layout.
 * Use in place of `<PageLoader>` for table-heavy pages for a smoother perceived loading.
 */
export function TableSkeleton({
  columns = 6,
  rows = 8,
  columnWidths = ['w-20', 'w-44', 'w-28', 'w-20', 'w-16', 'w-24'],
  className,
}: TableSkeletonProps) {
  const getWidth = (index: number) => columnWidths[index % columnWidths.length];

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-6 px-5 py-3.5 border-b border-white/[0.06]">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3.5', getWidth(i))} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-6 px-5 py-4 border-b border-white/[0.04] last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={cn(
                'h-4',
                getWidth(colIdx),
                // Add some visual variety: make badges pill-shaped
                colIdx === 3 || colIdx === 4 ? 'rounded-full h-5' : '',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
