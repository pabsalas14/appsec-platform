'use client';

import React from 'react';
import Link from 'next/link';
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
  /** Enlace opcional (drill-down BRD §13.1) */
  href?: string;
  /** Tooltip accesible (p. ej. criterio D2 en SLA vencidas) */
  labelHint?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary-400',
  iconBg = 'bg-primary-500/10',
  trend,
  className,
  href,
  labelHint,
}: StatCardProps) {
  const inner = (
    <GlassCard
      className={cn(
        'p-5',
        !href && className,
        href && 'transition-colors group-hover:border-primary/25 group-hover:bg-accent/[0.03]',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate" title={labelHint}>
            {label}
          </p>
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

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        {inner}
      </Link>
    );
  }

  return inner;
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

/** Clases recomendadas para `Card` / tablas en módulos tipo catálogo (coherente con dashboards). */
export const premiumShellCardClass =
  'border-white/[0.08] bg-card/50 shadow-lg shadow-black/[0.08] backdrop-blur-md dark:bg-slate-950/40';

/* ─────────────────────────────────────────────
 * PremiumPageHeader — Cabecera tipo dashboard ejecutivo (eyebrow + gradiente suave)
 * ───────────────────────────────────────────── */
interface PremiumPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PremiumPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: PremiumPageHeaderProps) {
  const actionContent = action ?? children;
  return (
    <div
      className={cn(
        'relative mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card via-card/90 to-primary/[0.09] p-6 shadow-lg shadow-black/15 backdrop-blur-md dark:from-slate-950/75 dark:via-slate-950/45 dark:to-primary/[0.12]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/25 blur-3xl dark:bg-primary/20"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-primary">
            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">{eyebrow}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actionContent ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actionContent}</div>
        ) : null}
      </div>
    </div>
  );
}

type PremiumPanelProps = React.HTMLAttributes<HTMLDivElement>;

/** Contenedor glass para filtros + tabla (anida bien dentro de PageWrapper). */
export function PremiumPanel({ className, children, ...props }: PremiumPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1 shadow-inner shadow-black/10 backdrop-blur-sm dark:bg-white/[0.03]',
        className,
      )}
      {...props}
    >
      {children}
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
