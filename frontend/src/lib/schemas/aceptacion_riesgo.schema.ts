import { z } from 'zod';

export const AceptacionRiesgoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid(),
justificacion_negocio: z.string(),
propietario_riesgo_id: z.string().uuid(),
fecha_revision_obligatoria: z.string(),
estado: z.string(),
aprobador_id: z.string().uuid().nullable().optional(),
fecha_aprobacion: z.string().nullable().optional(),
notas_aprobador: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const AceptacionRiesgoCreateSchema = z.object({
vulnerabilidad_id: z.string().uuid(),
justificacion_negocio: z.string(),
propietario_riesgo_id: z.string().uuid(),
fecha_revision_obligatoria: z.string(),
estado: z.string(),
aprobador_id: z.string().uuid().nullable().optional(),
fecha_aprobacion: z.string().nullable().optional(),
notas_aprobador: z.string().nullable().optional(),
});

export const AceptacionRiesgoUpdateSchema = AceptacionRiesgoCreateSchema.partial();

export type AceptacionRiesgo = z.infer<typeof AceptacionRiesgoSchema>;
export type AceptacionRiesgoCreate = z.infer<typeof AceptacionRiesgoCreateSchema>;
export type AceptacionRiesgoUpdate = z.infer<typeof AceptacionRiesgoUpdateSchema>;
