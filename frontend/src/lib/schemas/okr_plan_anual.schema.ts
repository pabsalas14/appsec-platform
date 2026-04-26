import { z } from 'zod';

export const OkrPlanAnualSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
colaborador_id: z.string().uuid(),
evaluador_id: z.string().uuid(),
ano: z.number().int(),
estado: z.string(),
fecha_aprobado: z.string().nullable().optional(),
aprobado_por_id: z.string().uuid().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const OkrPlanAnualCreateSchema = z.object({
colaborador_id: z.string().uuid(),
evaluador_id: z.string().uuid(),
ano: z.number().int(),
estado: z.string(),
fecha_aprobado: z.string().nullable().optional(),
aprobado_por_id: z.string().uuid().nullable().optional(),
});

export const OkrPlanAnualUpdateSchema = OkrPlanAnualCreateSchema.partial();

export type OkrPlanAnual = z.infer<typeof OkrPlanAnualSchema>;
export type OkrPlanAnualCreate = z.infer<typeof OkrPlanAnualCreateSchema>;
export type OkrPlanAnualUpdate = z.infer<typeof OkrPlanAnualUpdateSchema>;
