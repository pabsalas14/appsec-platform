import { z } from 'zod';

/** Respuesta de GET/PATCH `/notificacions/preferences/me`. */
export const notificationRulePreferencesSchema = z.object({
  notificaciones_automaticas: z.boolean(),
  sla_vulnerabilidad: z.boolean(),
  tema_estancado: z.boolean(),
  vulnerabilidad_inactiva: z.boolean(),
  iniciativa_fecha_fin_vencida: z.boolean(),
  plan_remediacion_fecha_limite_vencida: z.boolean(),
  auditoria_estado: z.boolean(),
});

export type NotificationRulePreferences = z.infer<typeof notificationRulePreferencesSchema>;

export const notificationRulePreferencesPatchSchema = notificationRulePreferencesSchema.partial();

export type NotificationRulePreferencesPatch = z.infer<typeof notificationRulePreferencesPatchSchema>;
