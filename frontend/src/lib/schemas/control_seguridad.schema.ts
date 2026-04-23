import { z } from 'zod';

export const ControlSeguridadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
tipo: z.string(),
descripcion: z.string().nullable().optional(),
obligatorio: z.boolean(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ControlSeguridadCreateSchema = z.object({
nombre: z.string(),
tipo: z.string(),
descripcion: z.string().nullable().optional(),
obligatorio: z.boolean(),
});

export const ControlSeguridadUpdateSchema = ControlSeguridadCreateSchema.partial();

export type ControlSeguridad = z.infer<typeof ControlSeguridadSchema>;
export type ControlSeguridadCreate = z.infer<typeof ControlSeguridadCreateSchema>;
export type ControlSeguridadUpdate = z.infer<typeof ControlSeguridadUpdateSchema>;
