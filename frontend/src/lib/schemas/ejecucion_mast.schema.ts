import { z } from 'zod';

export const EjecucionMASTSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
aplicacion_movil_id: z.string().uuid(),
ambiente: z.string(),
fecha_inicio: z.string(),
fecha_fin: z.string(),
resultado: z.string(),
url_reporte: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const EjecucionMASTCreateSchema = z.object({
aplicacion_movil_id: z.string().uuid(),
ambiente: z.string(),
fecha_inicio: z.string(),
fecha_fin: z.string(),
resultado: z.string(),
url_reporte: z.string().nullable().optional(),
});

export const EjecucionMASTUpdateSchema = EjecucionMASTCreateSchema.partial();

export type EjecucionMAST = z.infer<typeof EjecucionMASTSchema>;
export type EjecucionMASTCreate = z.infer<typeof EjecucionMASTCreateSchema>;
export type EjecucionMASTUpdate = z.infer<typeof EjecucionMASTUpdateSchema>;
