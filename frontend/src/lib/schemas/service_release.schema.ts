import { z } from 'zod';

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
nombre: z.string(),
version: z.string(),
descripcion: z.string().nullable().optional(),
servicio_id: z.string().uuid(),
estado_actual: z.string(),
jira_referencia: z.string().nullable().optional(),
});

export const ServiceReleaseUpdateSchema = ServiceReleaseCreateSchema.partial();

export type ServiceRelease = z.infer<typeof ServiceReleaseSchema>;
export type ServiceReleaseCreate = z.infer<typeof ServiceReleaseCreateSchema>;
export type ServiceReleaseUpdate = z.infer<typeof ServiceReleaseUpdateSchema>;
