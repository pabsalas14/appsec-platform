import { z } from 'zod';

export const OkrRevisionQSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
subcompromiso_id: z.string().uuid(),
quarter: z.string(),
avance_reportado: z.number(),
avance_validado: z.number().nullable().optional(),
comentario_colaborador: z.string().nullable().optional(),
feedback_evaluador: z.string().nullable().optional(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const OkrRevisionQCreateSchema = z.object({
subcompromiso_id: z.string().uuid(),
quarter: z.string(),
avance_reportado: z.number(),
avance_validado: z.number().nullable().optional(),
comentario_colaborador: z.string().nullable().optional(),
feedback_evaluador: z.string().nullable().optional(),
estado: z.string(),
});

export const OkrRevisionQUpdateSchema = OkrRevisionQCreateSchema.partial();

export type OkrRevisionQ = z.infer<typeof OkrRevisionQSchema>;
export type OkrRevisionQCreate = z.infer<typeof OkrRevisionQCreateSchema>;
export type OkrRevisionQUpdate = z.infer<typeof OkrRevisionQUpdateSchema>;
