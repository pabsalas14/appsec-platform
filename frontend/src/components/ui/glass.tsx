'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────
 * GlassCard — Glass surface wrapper
 * ───────────────────────────────────────────── */
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ className, hover = false, glow = false, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/10',
        hover && 'transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-xl hover:shadow-primary-500/5 cursor-pointer',
        glow && 'glow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * StatCard — Dashboard stat with icon and value
 * ───────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary-400',
  iconBg = 'bg-primary-500/10',
  trend,
  className,
}: StatCardProps) {
  return (
    <GlassCard className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <motion.p
            className="text-2xl font-bold text-foreground mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {value}
          </motion.p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </GlassCard>
  );
}

/* ─────────────────────────────────────────────
 * GlassSurface — Lighter glass for nested areas
 * ───────────────────────────────────────────── */
type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassSurface({ className, children, ...props }: GlassSurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * PageWrapper — Animated page container
 * ───────────────────────────────────────────── */
interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      className={cn('', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
 * PageHeader — Standardized page header
 * ───────────────────────────────────────────── */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode; // action buttons (alias)
  children?: React.ReactNode; // action buttons
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  const actionContent = action || children;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actionContent && <div className="flex items-center gap-3">{actionContent}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * EmptyState — Illustrated empty state
 * ───────────────────────────────────────────── */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode; // action button(s) alias
  children?: React.ReactNode; // action buttons
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  const actionContent = action || children;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <Icon className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {actionContent && <div className="mt-4">{actionContent}</div>}
    </div>
  );
}
