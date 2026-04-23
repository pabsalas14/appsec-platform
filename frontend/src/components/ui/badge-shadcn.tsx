import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-white/[0.06] text-foreground',
        critical: 'border-red-500/30 bg-red-500/15 text-red-400',
        high: 'border-orange-500/30 bg-orange-500/15 text-orange-400',
        medium: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-400',
        low: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
        info: 'border-gray-500/30 bg-gray-500/15 text-muted-foreground',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
        primary: 'border-primary-500/30 bg-primary-500/15 text-primary-400',
        outline: 'border-white/10 text-foreground bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const SEVERITY_MAP: Record<string, 'critical' | 'high' | 'medium' | 'low' | 'info'> = {
  critica: 'critical',
  critical: 'critical',
  alta: 'high',
  high: 'high',
  media: 'medium',
  medium: 'medium',
  baja: 'low',
  low: 'low',
  informativa: 'info',
  info: 'info',
};

export interface ShadcnBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  severityName?: string;
}

function ShadcnBadge({ className, variant, severityName, ...props }: ShadcnBadgeProps) {
  const resolvedVariant = severityName
    ? SEVERITY_MAP[severityName.toLowerCase()] || 'default'
    : variant;

  return <div className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props} />;
}

export { ShadcnBadge, badgeVariants };
