'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch?: (query: string) => void;
  onRowAction?: (row: T, action: 'edit' | 'delete') => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  showActions?: boolean;
  actions?: Array<{ label: string; onClick: (row: T) => void; variant?: 'primary' | 'danger' | 'ghost' }>;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading = false,
  error,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onRowAction,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No hay datos para mostrar',
  showActions = true,
  actions = [],
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="w-full space-y-4">
      {onSearch && (
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
            data-testid="data-table-search"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-700 dark:text-red-400">
          Error: {error}
        </div>
      )}

      <div className="border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="data-table">
            <thead className="bg-white/[0.03] border-b border-white/[0.08]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap',
                      col.width
                    )}
                    data-testid={`column-${String(col.key)}`}
                  >
                    {col.label}
                  </th>
                ))}
                {showActions && actions.length > 0 && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors',
                      idx % 2 === 0 ? 'bg-white/[0.01]' : ''
                    )}
                    data-testid={`table-row-${row.id}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn('px-4 py-3 text-sm text-foreground', col.width)}
                        data-testid={`cell-${String(col.key)}-${row.id}`}
                      >
                        {col.render ? col.render((row as any)[col.key], row) : String((row as any)[col.key] || '-')}
                      </td>
                    ))}
                    {showActions && actions.length > 0 && (
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {actions.map((action, actionIdx) => (
                            <Button
                              key={actionIdx}
                              variant={action.variant || 'ghost'}
                              size="sm"
                              onClick={() => action.onClick(row)}
                              data-testid={`action-${action.label}-${row.id}`}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {data.length > 0 ? (page - 1) * pageSize + 1 : 0} a{' '}
          {Math.min(page * pageSize, totalCount)} de {totalCount} resultados
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage || isLoading}
            data-testid="pagination-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || isLoading}
            data-testid="pagination-next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
