'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, Label, PageHeader, PageWrapper, Switch } from '@/components/ui';
import {
  useNotificationRulePreferences,
  useUpdateNotificationRulePreferences,
} from '@/hooks/useNotificationRulePreferences';
import type { NotificationRulePreferences } from '@/lib/schemas/notification_rule_preferences.schema';

const ROWS: { key: keyof NotificationRulePreferences; label: string; hint: string }[] = [
  { key: 'sla_vulnerabilidad', label: 'SLA de vulnerabilidades', hint: 'Avisos cuando se acerca o vence el SLA.' },
  { key: 'tema_estancado', label: 'Temas emergentes estancados', hint: 'Recordatorios de temas sin avance.' },
  { key: 'vulnerabilidad_inactiva', label: 'Vulnerabilidades inactivas', hint: 'Hallazgos sin actividad reciente.' },
  { key: 'iniciativa_fecha_fin_vencida', label: 'Iniciativas con fecha fin vencida', hint: 'Cuando una iniciativa supera su fecha de cierre.' },
  { key: 'plan_remediacion_fecha_limite_vencida', label: 'Planes de remediación vencidos', hint: 'Fecha límite del plan superada.' },
  { key: 'auditoria_estado', label: 'Cambios de estado en auditorías', hint: 'Notificación al dueño cuando cambia el estado.' },
];

export default function NotificationPreferencesPage() {
  const { data: prefs, isLoading } = useNotificationRulePreferences();
  const update = useUpdateNotificationRulePreferences();

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/notificacions"
          className="-ml-2 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al centro
        </Link>
      </div>
      <PageHeader
        title="Preferencias de notificaciones"
        description="Controla qué avisos in-app genera el sistema. Desactivar un tipo no borra notificaciones ya recibidas."
      />

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Label htmlFor="notif-auto-all" className="text-sm font-medium">
              Notificaciones automáticas (todas las reglas)
            </Label>
            <p className="text-xs text-muted-foreground max-w-xl">
              Si lo desactivas, el job de reglas no creará avisos para tu usuario (equivalente a desactivar cada regla).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLoading || !prefs ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="notif-auto-all"
                checked={prefs.notificaciones_automaticas}
                onCheckedChange={(v) =>
                  update.mutate(
                    { notificaciones_automaticas: v },
                    {
                      onSuccess: () => toast.success(v ? 'Reglas activadas' : 'Reglas desactivadas'),
                      onError: () => toast.error('No se pudo guardar'),
                    },
                  )
                }
                disabled={update.isPending}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Por tipo de evento
        </h2>
        {ROWS.map((row) => (
          <Card key={row.key}>
            <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label htmlFor={`pref-${row.key}`} className="text-sm font-medium">
                  {row.label}
                </Label>
                <p className="text-xs text-muted-foreground max-w-xl">{row.hint}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isLoading || !prefs ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    id={`pref-${row.key}`}
                    checked={prefs[row.key]}
                    onCheckedChange={(v) =>
                      update.mutate(
                        { [row.key]: v },
                        {
                          onSuccess: () => toast.success('Preferencia actualizada'),
                          onError: () => toast.error('No se pudo guardar'),
                        },
                      )
                    }
                    disabled={update.isPending || !prefs.notificaciones_automaticas}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
