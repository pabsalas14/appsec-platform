'use client';

import { Loader2, Save, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/components/ui';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useEmailNotifications';

const NOTIFICATION_TYPES: { id: string; label: string; description: string }[] = [
  { id: 'sla_vencida', label: 'SLA próxima a vencer', description: 'Aviso antes del vencimiento del SLA de remediación' },
  { id: 'vulnerabilidad_critica', label: 'Vulnerabilidad crítica', description: 'Nuevos hallazgos de severidad crítica' },
  { id: 'excepcion_temporal', label: 'Excepción temporal', description: 'Cambios en excepciones o aceptación de riesgo' },
  { id: 'tema_emergente_actualizado', label: 'Tema emergente', description: 'Actualizaciones en temas emergentes' },
  { id: 'iniciativa_hito_completado', label: 'Iniciativa — hito', description: 'Hitos completados en iniciativas' },
  { id: 'tema_estancado', label: 'Tema estancado', description: 'Temas sin avance' },
  { id: 'vulnerabilidad_inactiva', label: 'Vulnerabilidad inactiva', description: 'Hallazgos sin actividad' },
];

export function EmailPreferencesTab() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updateMut = useUpdateNotificationPreferences();
  const [draftEmail, setDraftEmail] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDraftEmail({});
  }, [prefs?.notificaciones_automaticas, prefs?.email_notificaciones]);

  const emailMap = prefs?.email_notificaciones ?? {};

  const handleToggle = (notificationType: string, enabled: boolean) => {
    setDraftEmail((prev) => ({ ...prev, [notificationType]: enabled }));
  };

  const handleSaveOne = async (notificationType: string) => {
    const enabled = draftEmail[notificationType];
    if (enabled === undefined) return;
    const next = {
      ...emailMap,
      [notificationType]: enabled,
    } as Record<string, boolean | number>;
    try {
      await updateMut.mutateAsync({ email_notificaciones: next });
      toast.success(`Preferencia de correo actualizada (${notificationType})`);
      setDraftEmail((prev) => {
        const n = { ...prev };
        delete n[notificationType];
        return n;
      });
    } catch {
      toast.error('Error al actualizar preferencias');
    }
  };

  if (isLoading || !prefs) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Preferencias almacenadas en tu perfil (`user.preferences`). El canal correo requiere activación explícita por tipo.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notificaciones automáticas (in-app y reglas)</CardTitle>
          <CardDescription>Si se desactiva, se omiten avisos generados por jobs del sistema.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <span className="text-sm">Activar notificaciones automáticas</span>
          <Switch
            checked={prefs.notificaciones_automaticas}
            onCheckedChange={async (checked) => {
              try {
                await updateMut.mutateAsync({ notificaciones_automaticas: checked });
                toast.success('Preferencia guardada');
              } catch {
                toast.error('Error al guardar');
              }
            }}
            disabled={updateMut.isPending}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {NOTIFICATION_TYPES.map((notifType) => {
          const base = typeof emailMap[notifType.id] === 'boolean' ? (emailMap[notifType.id] as boolean) : false;
          const isDraft = notifType.id in draftEmail;
          const enabled = isDraft ? draftEmail[notifType.id]! : base;

          return (
            <Card key={notifType.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base">{notifType.label}</CardTitle>
                    <CardDescription className="mt-1">{notifType.description}</CardDescription>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => handleToggle(notifType.id, checked)}
                    disabled={updateMut.isPending}
                  />
                </div>
              </CardHeader>
              {isDraft && (
                <CardContent>
                  <Button size="sm" onClick={() => void handleSaveOne(notifType.id)} disabled={updateMut.isPending}>
                    {updateMut.isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3 w-3" />
                    )}
                    Guardar
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
