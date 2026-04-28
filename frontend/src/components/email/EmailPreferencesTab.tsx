'use client';

import { Save, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
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
import { useUserEmailPreferences, useUpsertUserEmailPreference } from '@/hooks/useEmailNotifications';

const NOTIFICATION_TYPES = [
  { id: 'vulnerability_alert', label: 'Vulnerabilidad Detectada', description: 'Alertas cuando se encuentran nuevas vulnerabilidades' },
  { id: 'user_welcome', label: 'Bienvenida', description: 'Correo de bienvenida al crear cuenta' },
  { id: 'password_reset', label: 'Restablecimiento de Contraseña', description: 'Correos para recuperar contraseña' },
  { id: 'team_invitation', label: 'Invitación al Equipo', description: 'Cuando te invitan a un equipo' },
  { id: 'audit_report', label: 'Reporte de Auditoría', description: 'Reportes periódicos de auditoría' },
];

export function EmailPreferencesTab() {
  const { data: preferences = [], isLoading } = useUserEmailPreferences();
  const upsert = useUpsertUserEmailPreference();
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});

  const handleToggle = (notificationType: string, enabled: boolean) => {
    setDrafts((prev) => ({
      ...prev,
      [notificationType]: enabled,
    }));
  };

  const handleSave = async (notificationType: string) => {
    const newEnabled = drafts[notificationType];
    try {
      await upsert.mutateAsync({
        notification_type: notificationType,
        email_enabled: newEnabled,
      });
      toast.success(`Preferencia actualizada para ${notificationType}`);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[notificationType];
        return next;
      });
    } catch (_err) {
      toast.error('Error al actualizar preferencia');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configura qué notificaciones deseas recibir por correo. Puedes habilitar o deshabilitar cada tipo de notificación independientemente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {NOTIFICATION_TYPES.map((notifType) => {
          const pref = preferences.find((p) => p.notification_type === notifType.id);
          const isDraft = notifType.id in drafts;
          const enabled = isDraft ? drafts[notifType.id] : pref?.email_enabled ?? true;

          return (
            <Card key={notifType.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{notifType.label}</CardTitle>
                    <CardDescription className="mt-1">{notifType.description}</CardDescription>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => handleToggle(notifType.id, checked)}
                    disabled={upsert.isPending}
                  />
                </div>
              </CardHeader>
              {isDraft && (
                <CardContent>
                  <Button
                    size="sm"
                    onClick={() => handleSave(notifType.id)}
                    disabled={upsert.isPending}
                  >
                    {upsert.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
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
