'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GitBranch, Globe2, Network, Package } from 'lucide-react';

import { Card, CardContent, PremiumPageHeader, PremiumPanel, PageWrapper, premiumShellCardClass } from '@/components/ui';
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
    <PageWrapper className="space-y-6 p-6">
      <PremiumPageHeader
        eyebrow="Inventario"
        icon={Package}
        title="Inventario unificado"
        description="Aquí gestionas activos (repositorios y URLs). La jerarquía corporativa (dirección → célula) solo se edita en Estructura organizacional; este hub sirve para navegar y abrir cada catálogo."
      >
        <Link
          href="/organizacion/jerarquia"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-white/[0.1]"
        >
          <Network className="h-4 w-4 text-primary" aria-hidden />
          Ver jerarquía organizacional
        </Link>
      </PremiumPageHeader>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground/90">Operación relacionada:</span>
        <Link href="/hallazgo_pipelines" className="underline-offset-4 hover:underline">
          Pipeline de escaneos
        </Link>
        <span aria-hidden className="text-border">
          ·
        </span>
        <Link href="/dashboards/kanban" className="underline-offset-4 hover:underline">
          Kanban de liberaciones
        </Link>
      </p>
      <PremiumPanel className="p-4">
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                'inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                active === t.id
                  ? 'bg-primary/15 text-foreground shadow-sm ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => {
        if (active !== t.id) return null;
        const Icon = t.icon;
        return (
          <Card key={t.id} className={premiumShellCardClass}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    En el listado, el nombre de cada fila abre la ficha de detalle (pipelines correlacionados y vulnerabilidades).
                  </p>
                </div>
              </div>
              <Link
                href={t.href}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Abrir módulo
                <Package className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
      </PremiumPanel>
    </PageWrapper>
  );
}
