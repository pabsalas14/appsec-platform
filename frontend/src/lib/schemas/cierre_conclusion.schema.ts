import { z } from 'zod';

export const CierreConclusionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  conclusion: z.string(),
  recomendaciones: z.string().nullable().optional(),
  fecha_cierre: z.string(),
  tema_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CierreConclusionCreateSchema = z.object({
  titulo: z.string().min(1).max(255),
  conclusion: z.string().min(1),
  recomendaciones: z.string().nullable().optional(),
  fecha_cierre: z.string().min(1),
  tema_id: z.string().uuid(),
});

export const CierreConclusionUpdateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  conclusion: z.string().min(1).optional(),
  recomendaciones: z.string().nullable().optional(),
  fecha_cierre: z.string().optional(),
});

export type CierreConclusion = z.infer<typeof CierreConclusionSchema>;
export type CierreConclusionCreate = z.infer<typeof CierreConclusionCreateSchema>;
export type CierreConclusionUpdate = z.infer<typeof CierreConclusionUpdateSchema>;
