import { z } from 'zod';

export const ESTADOS_SESION_TM = ['Planificada', 'En Progreso', 'Completada', 'Cancelada'] as const;

export const SesionThreatModelingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  programa_tm_id: z.string().uuid(),
  fecha: z.string(),
  participantes: z.string().nullable().optional(),
  contexto: z.string().nullable().optional(),
  estado: z.string(),
  ia_utilizada: z.boolean().nullable().optional(),
  backlog_tareas: z.string().nullable().optional(),
  plan_trabajo: z.string().nullable().optional(),
  activo_web_secundario_id: z.string().uuid().nullable().optional(),
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
  backlog_tareas: z.string().nullable().optional(),
  plan_trabajo: z.string().nullable().optional(),
  activo_web_secundario_id: z.string().uuid().nullable().optional(),
});

export const SesionThreatModelingUpdateSchema = SesionThreatModelingCreateSchema.partial();

export type SesionThreatModeling = z.infer<typeof SesionThreatModelingSchema>;
export type SesionThreatModelingCreate = z.infer<typeof SesionThreatModelingCreateSchema>;
export type SesionThreatModelingUpdate = z.infer<typeof SesionThreatModelingUpdateSchema>;
