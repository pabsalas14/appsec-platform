import { z } from 'zod';

export const EtapaReleaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
service_release_id: z.string().uuid(),
etapa: z.string(),
estado: z.string(),
aprobador_id: z.string().uuid().nullable().optional(),
justificacion: z.string().nullable().optional(),
notas: z.string().nullable().optional(),
fecha_completada: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const EtapaReleaseCreateSchema = z.object({
service_release_id: z.string().uuid(),
etapa: z.string(),
estado: z.string(),
aprobador_id: z.string().uuid().nullable().optional(),
justificacion: z.string().nullable().optional(),
notas: z.string().nullable().optional(),
fecha_completada: z.string().nullable().optional(),
});

export const EtapaReleaseUpdateSchema = EtapaReleaseCreateSchema.partial();

export type EtapaRelease = z.infer<typeof EtapaReleaseSchema>;
export type EtapaReleaseCreate = z.infer<typeof EtapaReleaseCreateSchema>;
export type EtapaReleaseUpdate = z.infer<typeof EtapaReleaseUpdateSchema>;
