import { z } from 'zod';

export const OkrCompromisoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
plan_id: z.string().uuid(),
categoria_id: z.string().uuid().nullable().optional(),
nombre_objetivo: z.string(),
descripcion: z.string().nullable().optional(),
peso_global: z.number(),
fecha_inicio: z.string(),
fecha_fin: z.string(),
tipo_medicion: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const OkrCompromisoCreateSchema = z.object({
plan_id: z.string().uuid(),
categoria_id: z.string().uuid().nullable().optional(),
nombre_objetivo: z.string(),
descripcion: z.string().nullable().optional(),
peso_global: z.number(),
fecha_inicio: z.string(),
fecha_fin: z.string(),
tipo_medicion: z.string(),
});

export const OkrCompromisoUpdateSchema = OkrCompromisoCreateSchema.partial();

export type OkrCompromiso = z.infer<typeof OkrCompromisoSchema>;
export type OkrCompromisoCreate = z.infer<typeof OkrCompromisoCreateSchema>;
export type OkrCompromisoUpdate = z.infer<typeof OkrCompromisoUpdateSchema>;
