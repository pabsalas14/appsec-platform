'use client';

import { CheckCircle2, Circle, LayoutList } from 'lucide-react';
import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageWrapper,
  PremiumPageHeader,
} from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isBackofficeUser } from '@/lib/roles';
import { cn } from '@/lib/utils';

const MODULES: { id: string; name: string; checks: string[] }[] = [
  {
    id: 'dashboards',
    name: 'Dashboards',
    checks: ['Vistas ejecutivas', 'Madurez', 'Índice'],
  },
  {
    id: 'vuln',
    name: 'Vulnerabilidades',
    checks: ['Registros', 'Importación masiva', 'SLA por motor', 'Planes', 'Excepciones'],
  },
  { id: 'ops', name: 'Operación', checks: ['Kanban', 'Liberaciones', 'Pipelines', 'Temas emergentes'] },
  { id: 'prog', name: 'Programas / Auditorías', checks: ['Programas', 'Auditorías', 'Servicios regulados'] },
  { id: 'okr', name: 'OKR', checks: ['Mis compromisos', 'Equipo', 'Registros OKR'] },
  { id: 'kpi', name: 'Indicadores', checks: ['Dashboard', 'Fórmulas', 'Captura manual / tendencia'] },
  { id: 'scr', name: 'SCR', checks: ['Dashboard', 'Escaneos', 'Hallazgos', 'Historial', 'Forense', 'Agentes'] },
  { id: 'notif', name: 'Notificaciones', checks: ['Centro', 'Preferencias por regla'] },
];

export default function AuditOverviewPage() {
  const { data: user } = useCurrentUser();
  const allowed = isBackofficeUser(user?.role);
  const [done, setDone] = useState<Record<string, boolean>>({});

  if (!allowed) {
    return (
      <PageWrapper className="p-6">
        <p className="text-sm text-muted-foreground">Solo backoffice.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PremiumPageHeader
        eyebrow="Administración"
        title="Auditoría de plataforma (checklist)"
        description="Vista operativa para recorrer los bloques del menú y marcar criterios en UAT o demo (44 checks manuales)."
        icon={LayoutList}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {MODULES.map((m) => (
          <Card key={m.id} className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{m.name}</CardTitle>
              <CardDescription>{m.checks.length} criterios — clic para marcar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {m.checks.map((c) => {
                const key = `${m.id}:${c}`;
                const checked = Boolean(done[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDone((d) => ({ ...d, [key]: !checked }))}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      checked
                        ? 'border-primary/30 bg-primary/5 text-foreground'
                        : 'border-border/60 hover:bg-muted/40',
                    )}
                  >
                    {checked ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {c}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
