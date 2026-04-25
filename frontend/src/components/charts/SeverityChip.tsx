'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SeverityChipProps {
  severity: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const severityConfig: Record<string, { color: string; bg: string }> = {
  CRITICA: { color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  ALTA: { color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' },
  MEDIA: { color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  BAJA: { color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
};

export const SeverityChip: React.FC<SeverityChipProps> = ({
  severity,
  className,
  size = 'md',
}) => {
  const config = severityConfig[severity] || severityConfig.BAJA;
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
      {severity}
    </Badge>
  );
};
