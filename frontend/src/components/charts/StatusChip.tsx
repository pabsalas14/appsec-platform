'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface StatusChipProps {
  status: 'Abierta' | 'En Progreso' | 'Cerrada' | 'Pendiente' | 'Aprobado' | 'Rechazado' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  'Abierta': { color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  'En Progreso': { color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  'Cerrada': { color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
  'Pendiente': { color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  'Aprobado': { color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
  'Rechazado': { color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
};

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const config = statusConfig[status] || statusConfig['En Progreso'];
  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }[size];

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold border-2',
        config.bg,
        config.color,
        sizeClass,
        className
      )}
    >
      {status}
    </Badge>
  );
};
