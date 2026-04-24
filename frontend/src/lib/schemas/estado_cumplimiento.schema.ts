import { z } from 'zod';

export const EstadoCumplimientoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
registro_id: z.string().uuid(),
control_id: z.string().uuid().nullable().optional(),
estado: z.string(),
porcentaje: z.number().nullable().optional(),
notas: z.string().nullable().optional(),
fecha_evaluacion: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const EstadoCumplimientoCreateSchema = z.object({
registro_id: z.string().uuid(),
control_id: z.string().uuid().nullable().optional(),
estado: z.string(),
porcentaje: z.number().nullable().optional(),
notas: z.string().nullable().optional(),
fecha_evaluacion: z.string(),
});

export const EstadoCumplimientoUpdateSchema = EstadoCumplimientoCreateSchema.partial();

export type EstadoCumplimiento = z.infer<typeof EstadoCumplimientoSchema>;
export type EstadoCumplimientoCreate = z.infer<typeof EstadoCumplimientoCreateSchema>;
export type EstadoCumplimientoUpdate = z.infer<typeof EstadoCumplimientoUpdateSchema>;
