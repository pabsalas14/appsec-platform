import { z } from 'zod';

/** Respuesta de GET/PATCH `/user-preferences` (backend). */
export const userNotificationPreferencesSchema = z.object({
  notificaciones_automaticas: z.boolean(),
  email_notificaciones: z.record(z.string(), z.unknown()),
  digest_type: z.string(),
  digest_hour_utc: z.number().int(),
});

export type UserNotificationPreferences = z.infer<typeof userNotificationPreferencesSchema>;

export const userNotificationPreferencesPatchSchema = z.object({
  notificaciones_automaticas: z.boolean().optional(),
  email_notificaciones: z.record(z.string(), z.unknown()).optional(),
  digest_type: z.string().optional(),
  digest_hour_utc: z.number().int().optional(),
});

export type UserNotificationPreferencesPatch = z.infer<typeof userNotificationPreferencesPatchSchema>;
