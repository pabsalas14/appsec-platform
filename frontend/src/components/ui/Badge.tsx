import React from 'react';
import { cn } from '@/lib/utils';

const severityMap: Record<string, string> = {
  critica: 'bg-red-500/15 text-red-400 border-red-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  alta: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  media: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  baja: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  informativa: 'bg-gray-500/15 text-muted-foreground border-gray-500/30',
  informational: 'bg-gray-500/15 text-muted-foreground border-gray-500/30',
  info: 'bg-gray-500/15 text-muted-foreground border-gray-500/30',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'severity' | 'success' | 'primary' | 'secondary' | 'outline' | 'destructive';
  severityName?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', severityName, className }: BadgeProps) {
  const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-white/[0.06] text-foreground border-white/10',
    severity: '',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    primary: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
    secondary: 'bg-white/[0.03] text-muted-foreground border-white/[0.08]',
    outline: 'bg-transparent text-foreground border-white/20',
    destructive: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const cls =
    variant === 'severity' && severityName
      ? severityMap[severityName.toLowerCase()] || 'bg-gray-500/15 text-muted-foreground border-gray-500/30'
      : variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        cls,
        className
      )}
    >
      {children}
    </span>
  );
}
