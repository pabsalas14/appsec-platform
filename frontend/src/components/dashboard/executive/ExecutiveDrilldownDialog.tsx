'use client';

import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { logger } from '@/lib/logger';
import { ExternalLink, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { appendHierarchyQuery } from '@/lib/dashboardLinks';
import type { ExecutiveDashboardResponse, HierarchyFilters } from '@/hooks/useAppDashboardPanels';

export type ExecutiveDrillKpi = 'programs' | 'critical' | 'releases' | 'emerging' | 'audits' | null;

const COPY: Record<
  NonNullable<ExecutiveDrillKpi>,
  { title: string; body: string; path: string; cta: string }
> = {
  programs: {
    title: 'Avance de programas (motores)',
    path: '/dashboards/programs',
    cta: 'Abrir programas y motores',
    body:
      'Cada motor (SAST, DAST, SCA, etc.) aporta un % de cierre. El promedio resume la disciplina de remediación multi-herramienta. Desde allí profundizas en actividades, cuellos de botella e historial por fuente.',
  },
  critical: {
    title: 'Vulnerabilidades críticas',
    path: '/vulnerabilidads/registros?severidad=Critica',
    cta: 'Ir al registro (críticas)',
    body:
      'Prioriza el backlog crítico con filtros por repositorio, motor y estado. Desde la tabla aplicas triage, due dates y cierre. Los chips de motor resumen carga de trabajo en escaneos vs otras procedencias.',
  },
  releases: {
    title: 'Liberaciones de servicio',
    path: '/service_releases',
    cta: 'Abrir pipeline de liberaciones',
    body:
      'Las en etapas de diseño, validación o aprobación acumulan riesgo y tiempo. El panel Kanban y detalle por release conectan con aprobación de seguridad y criterios de salida (BRD de liberación).',
  },
  emerging: {
    title: 'Temas emergentes',
    path: '/temas_emergentes',
    cta: 'Gestionar temas emergentes',
    body:
      'Los estancamientos de más de 7 días se destacan. Desde el módulo asignas dueños, re-planificas y vinculás a riesgo de negocio o continuidad.',
  },
  audits: {
    title: 'Auditorías (inventario y hallazgos)',
    path: '/auditorias/registros',
    cta: 'Listado completo de auditorías',
    body:
      'Inventario de auditorías con hallazgos requerimientos. Columnas de pendientes ayudan a ver presión de remediación por auditoría y priorizar cierre o planes de mejora.',
  },
};

export function ExecutiveDrilldownDialog({
  open,
  onOpenChange,
  kpi,
  data,
  filters,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kpi: ExecutiveDrillKpi;
  data: ExecutiveDashboardResponse | undefined;
  filters: HierarchyFilters;
}) {
  const router = useRouter();
  const c = kpi != null ? COPY[kpi] : null;

  const go = useCallback(() => {
    if (!c) return;
    const href = appendHierarchyQuery(c.path, filters);
    logger.info('dashboard.executive.drill_navigate', { kpi, path: c.path });
    onOpenChange(false);
    router.push(href);
  }, [c, filters, kpi, onOpenChange, router]);

  if (!c) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] overflow-y-auto border-l border-border bg-card p-0 shadow-2xl sm:max-w-md">
        <div className="border-b border-border bg-muted/10 p-6">
          <SheetHeader>
            <SheetTitle className="text-left text-xl font-bold text-card-foreground">{c.title}</SheetTitle>
            <SheetDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              {c.body}
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="space-y-4 p-6">
          {data ? (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p>Riesgo: {data.risk_level} · postura: {data.security_posture}%</p>
                <p>
                  Tendencia: {data.trend_mode === 'calendar' && data.ref_month
                    ? `meses calendario (hasta ${data.ref_month})`
                    : 'ventanas deslizantes ~30d'}{' '}
                  · {data.trend_months} periodo(s)
                </p>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button type="button" className="gap-1.5" onClick={go}>
              {c.cta}
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
