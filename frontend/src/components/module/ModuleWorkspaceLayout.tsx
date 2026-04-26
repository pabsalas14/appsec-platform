'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type ModuleTab = { href: string; label: string };

type Props = {
  /** Ruta canónica del módulo (p. ej. /iniciativas) */
  basePath: string;
  children: ReactNode;
  tabs: ModuleTab[];
};

/**
 * Navegación tipo BRD: primera entrada = tablero contextual; segundo tab = listados CRUD.
 */
export function ModuleWorkspaceLayout({ basePath, children, tabs }: Props) {
  const pathname = usePathname();
  const secondary = tabs.find((x) => x.href !== basePath);
  const isDetailUnderModule = (p: string) => {
    if (!secondary || p.length <= basePath.length) return false;
    if (p === secondary.href || p.startsWith(`${secondary.href}/`)) return true;
    if (!p.startsWith(`${basePath}/`)) return false;
    const sub = p.slice(basePath.length + 1);
    if (sub.includes('/')) return sub.startsWith('registros/');
    return sub !== 'registros' && sub.length > 0;
  };

  return (
    <div className="space-y-4 px-4 py-2 pb-8 md:px-6">
      <nav
        className="flex flex-wrap gap-1 border-b border-border pb-2"
        aria-label="Navegación del módulo"
      >
        {tabs.map((t) => {
          const isRootTab = t.href === basePath;
          const active = isRootTab
            ? pathname === basePath
            : pathname === t.href ||
              pathname.startsWith(`${t.href}/`) ||
              (t.href === secondary?.href && isDetailUnderModule(pathname));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-primary/15 font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
