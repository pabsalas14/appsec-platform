import { z } from 'zod';

export const ESTADOS_SERVICE_RELEASE = [
  'Borrador',
  'En Revision de Diseno',
  'En Validacion de Seguridad',
  'En Pruebas de Seguridad',
  'Pendiente de Aprobacion',
  'En QA',
  'En Produccion',
  'Rechazado',
  'Cancelado',
] as const;

const estadoEnum = z.enum(ESTADOS_SERVICE_RELEASE);

export const ServiceReleaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  version: z.string(),
  descripcion: z.string().nullable().optional(),
  servicio_id: z.string().uuid(),
  estado_actual: z.string(),
  jira_referencia: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ServiceReleaseCreateSchema = z.object({
  nombre: z.string().min(1).max(500),
  version: z.string().min(1).max(100),
  descripcion: z.string().nullable().optional(),
  servicio_id: z.string().uuid(),
  estado_actual: estadoEnum,
  jira_referencia: z.string().nullable().optional(),
});

export const ServiceReleaseUpdateSchema = z.object({
  nombre: z.string().min(1).max(500).optional(),
  version: z.string().min(1).max(100).optional(),
  descripcion: z.string().nullable().optional(),
  estado_actual: estadoEnum.optional(),
  jira_referencia: z.string().nullable().optional(),
});

export type ServiceRelease = z.infer<typeof ServiceReleaseSchema>;
export type ServiceReleaseCreate = z.infer<typeof ServiceReleaseCreateSchema>;
export type ServiceReleaseUpdate = z.infer<typeof ServiceReleaseUpdateSchema>;
