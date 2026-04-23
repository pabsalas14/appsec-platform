import { z } from 'zod';

export const ExcepcionVulnerabilidadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid(),
justificacion: z.string(),
fecha_limite: z.string(),
estado: z.string(),
aprobador_id: z.string().uuid().nullable().optional(),
fecha_aprobacion: z.string().nullable().optional(),
notas_aprobador: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ExcepcionVulnerabilidadCreateSchema = z.object({
vulnerabilidad_id: z.string().uuid(),
justificacion: z.string(),
fecha_limite: z.string(),
estado: z.string(),
aprobador_id: z.string().uuid().nullable().optional(),
fecha_aprobacion: z.string().nullable().optional(),
notas_aprobador: z.string().nullable().optional(),
});

export const ExcepcionVulnerabilidadUpdateSchema = ExcepcionVulnerabilidadCreateSchema.partial();

export type ExcepcionVulnerabilidad = z.infer<typeof ExcepcionVulnerabilidadSchema>;
export type ExcepcionVulnerabilidadCreate = z.infer<typeof ExcepcionVulnerabilidadCreateSchema>;
export type ExcepcionVulnerabilidadUpdate = z.infer<typeof ExcepcionVulnerabilidadUpdateSchema>;
