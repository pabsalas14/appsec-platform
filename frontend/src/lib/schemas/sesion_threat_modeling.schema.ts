import { z } from 'zod';

export const SesionThreatModelingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
programa_tm_id: z.string().uuid(),
fecha: z.string(),
participantes: z.string().nullable().optional(),
contexto: z.string().nullable().optional(),
estado: z.string(),
ia_utilizada: z.boolean().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const SesionThreatModelingCreateSchema = z.object({
programa_tm_id: z.string().uuid(),
fecha: z.string(),
participantes: z.string().nullable().optional(),
contexto: z.string().nullable().optional(),
estado: z.string(),
ia_utilizada: z.boolean().nullable().optional(),
});

export const SesionThreatModelingUpdateSchema = SesionThreatModelingCreateSchema.partial();

export type SesionThreatModeling = z.infer<typeof SesionThreatModelingSchema>;
export type SesionThreatModelingCreate = z.infer<typeof SesionThreatModelingCreateSchema>;
export type SesionThreatModelingUpdate = z.infer<typeof SesionThreatModelingUpdateSchema>;
