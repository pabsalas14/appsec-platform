import { z } from 'zod';

export const ETAPAS_RELEASE = [
  'Design Review',
  'Security Validation',
  'Security Tests',
  'Approval',
  'QA',
  'Production',
] as const;

export const ESTADOS_ETAPA = ['Pendiente', 'En Progreso', 'Aprobada', 'Rechazada'] as const;

const etE = z.enum(ETAPAS_RELEASE);
const esE = z.enum(ESTADOS_ETAPA);

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
  etapa: etE,
  estado: esE,
  aprobador_id: z.union([z.string().uuid(), z.null()]).optional(),
  justificacion: z.string().max(10_000).nullable().optional(),
  notas: z.string().max(10_000).nullable().optional(),
  fecha_completada: z.string().nullable().optional(),
});

export const EtapaReleaseUpdateSchema = z.object({
  etapa: etE.optional(),
  estado: esE.optional(),
  justificacion: z.string().max(10_000).nullable().optional(),
  notas: z.string().max(10_000).nullable().optional(),
  fecha_completada: z.string().nullable().optional(),
});

export type EtapaRelease = z.infer<typeof EtapaReleaseSchema>;
export type EtapaReleaseCreate = z.infer<typeof EtapaReleaseCreateSchema>;
export type EtapaReleaseUpdate = z.infer<typeof EtapaReleaseUpdateSchema>;
