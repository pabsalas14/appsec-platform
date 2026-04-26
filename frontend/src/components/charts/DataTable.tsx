'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown) => React.ReactNode;
}

export interface DataTableRow {
  id: string;
  [key: string]: unknown;
}

interface DataTableProps {
  title?: string;
  columns: DataTableColumn[];
  data: DataTableRow[];
  isLoading?: boolean;
  onRowClick?: (row: DataTableRow) => void;
  className?: string;
  maxRows?: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  isLoading,
  onRowClick,
  className,
  maxRows = 10,
}) => {
  const displayData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  return (
    <Card className={cn('', className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'text-xs font-semibold',
                      col.width && `w-[${col.width}]`
                    )}
                  >
                    {col.label}
                    {col.sortable && <span className="ml-1">⇅</span>}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-xs text-muted-foreground py-4"
                  >
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={cn('text-xs', onRowClick && 'cursor-pointer hover:bg-muted/50')}
                  >
                    {columns.map((col) => (
                      <TableCell key={`${row.id}-${col.key}`}>
                        {col.render
                          ? col.render(row[col.key])
                          : String(row[col.key] || '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {hasMore && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            +{data.length - maxRows} filas más
          </div>
        )}
      </CardContent>
    </Card>
  );
};
