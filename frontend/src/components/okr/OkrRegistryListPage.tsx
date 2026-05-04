'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  EmptyState,
  PageHeader,
  PageWrapper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { extractErrorMessage } from '@/lib/utils';

export type OkrColumn<T> = { id: string; header: string; cell: (row: T) => ReactNode };

type Props<T extends { id: string }> = {
  title: string;
  description: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  error: unknown;
  errorFallback: string;
  data: T[] | undefined;
  columns: OkrColumn<T>[];
};

export function OkrRegistryListPage<T extends { id: string }>({
  title,
  description,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  isLoading,
  error,
  errorFallback,
  data,
  columns,
}: Props<T>) {
  if (isLoading) {
    return (
      <PageWrapper className="space-y-6 p-6">
        <PageHeader title={title} description={description} />
        <Skeleton className="h-56 w-full rounded-xl" />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="space-y-6 p-6">
        <PageHeader title={title} description={description} />
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {extractErrorMessage(error, errorFallback)}
        </p>
      </PageWrapper>
    );
  }

  const rows = data ?? [];

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="pt-6">
          {rows.length === 0 ? (
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c.id}>{c.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      {columns.map((c) => (
                        <TableCell key={`${row.id}-${c.id}`} className="max-w-[280px] align-top">
                          {c.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
