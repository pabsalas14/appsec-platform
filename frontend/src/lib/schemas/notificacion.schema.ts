import { z } from 'zod';

export const NotificacionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  cuerpo: z.string().nullable().optional(),
  leida: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const NotificacionCreateSchema = z.object({
  titulo: z.string(),
  cuerpo: z.string().nullable().optional(),
  leida: z.boolean().optional().default(false),
});

export const NotificacionUpdateSchema = NotificacionCreateSchema.partial();

export type Notificacion = z.infer<typeof NotificacionSchema>;
export type NotificacionCreate = z.infer<typeof NotificacionCreateSchema>;
export type NotificacionUpdate = z.infer<typeof NotificacionUpdateSchema>;
