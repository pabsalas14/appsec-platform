'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GitBranch, Globe2, Package } from 'lucide-react';

import { Card, CardContent, PageHeader, PageWrapper } from '@/components/ui';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'repos' as const,
    label: 'Repositorios',
    href: '/repositorios',
    description: 'Catálogo de código, criticidad, lenguaje y célula responsable.',
    icon: GitBranch,
  },
  {
    id: 'web' as const,
    label: 'Activos web',
    href: '/activo_webs',
    description: 'URL, ambiente, marca y responsable.',
    icon: Globe2,
  },
];

export default function InventarioPage() {
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('repos');
  return (
    <PageWrapper>
      <PageHeader
        title="Inventario unificado"
        description="Módulo BRD: pestañas para repositorios y activos web; el detalle completo de cada registro se abre en su módulo."
      />
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border/60 pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-md border border-b-0 px-4 py-2 text-sm font-medium transition-colors',
                active === t.id
                  ? 'border-border bg-card text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => {
        if (active !== t.id) return null;
        const Icon = t.icon;
        return (
          <Card key={t.id}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                </div>
              </div>
              <Link
                href={t.href}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Abrir módulo <Package className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </PageWrapper>
  );
}
