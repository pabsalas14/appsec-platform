import { z } from 'zod';

export const PlanRemediacionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  descripcion: z.string(),
  acciones_recomendadas: z.string(),
  responsable: z.string(),
  fecha_limite: z.string(),
  estado: z.string(),
  auditoria_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  vulnerabilidad_ids: z.array(z.string().uuid()).optional(),
});

export const PlanRemediacionCreateSchema = z.object({
  descripcion: z.string().min(1),
  acciones_recomendadas: z.string().min(1),
  responsable: z.string().min(1).max(255),
  fecha_limite: z.string().min(1),
  estado: z.string().min(1).max(100),
  auditoria_id: z.string().uuid(),
});

export const PlanRemediacionUpdateSchema = z.object({
  descripcion: z.string().min(1).optional(),
  acciones_recomendadas: z.string().min(1).optional(),
  responsable: z.string().min(1).max(255).optional(),
  fecha_limite: z.string().optional(),
  estado: z.string().min(1).max(100).optional(),
});

export type PlanRemediacion = z.infer<typeof PlanRemediacionSchema>;
export type PlanRemediacionCreate = z.infer<typeof PlanRemediacionCreateSchema>;
export type PlanRemediacionUpdate = z.infer<typeof PlanRemediacionUpdateSchema>;
