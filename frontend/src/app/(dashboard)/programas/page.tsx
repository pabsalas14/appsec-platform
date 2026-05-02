'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ClipboardList,
  FileSearch,
  GitBranch,
  LayoutGrid,
  LineChart,
  Network,
  Smartphone,
  Target,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader, PageWrapper } from '@/components/ui';

const LINKS: {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    href: '/dashboards/programs',
    title: 'Dashboard programas anuales',
    description: 'Resumen de hallazgos, heatmaps y riesgo por tipo de programa.',
    icon: LineChart,
  },
  {
    href: '/programa_sasts',
    title: 'Programas SAST',
    description: 'Programación anual de análisis estático por repositorio.',
    icon: GitBranch,
  },
  {
    href: '/programa_dasts',
    title: 'Programas DAST',
    description: 'Pruebas dinámicas contra activos web.',
    icon: Network,
  },
  {
    href: '/programa_threat_modelings',
    title: 'Threat modeling (MDA)',
    description: 'Sesiones y planes TM por servicio.',
    icon: ClipboardList,
  },
  {
    href: '/programa_source_codes',
    title: 'Programas source code / controles',
    description: 'Seguimiento de controles en código fuente.',
    icon: LayoutGrid,
  },
  {
    href: '/iniciativas',
    title: 'Iniciativas',
    description: 'Registro y seguimiento de iniciativas de AppSec.',
    icon: Target,
  },
  {
    href: '/iniciativas/registros',
    title: 'Registros de iniciativas',
    description: 'Tabla completa con filtros y creación rápida.',
    icon: FileSearch,
  },
  {
    href: '/ejecucion_masts',
    title: 'Ejecuciones MAST / móvil',
    description: 'Historial de pruebas móviles asociadas a aplicaciones.',
    icon: Smartphone,
  },
];

export default function ProgramasHubPage() {
  return (
    <PageWrapper className="space-y-8 p-6">
      <PageHeader
        title="Programas e iniciativas"
        description="Punto de entrada unificado: programas anuales por motor, iniciativas operativas y tableros de seguimiento (spec §5)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block outline-none">
              <Card className="h-full border-white/[0.06] transition-colors hover:border-primary/30 hover:bg-white/[0.02]">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-1 text-base font-semibold leading-snug">
                      <span className="truncate">{item.title}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs leading-relaxed">{item.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-[11px] font-mono text-muted-foreground">{item.href}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageWrapper>
  );
}
