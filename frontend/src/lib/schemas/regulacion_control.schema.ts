import { z } from 'zod';

export const RegulacionControlSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre_regulacion: z.string(),
nombre_control: z.string(),
descripcion: z.string().nullable().optional(),
obligatorio: z.boolean(),
created_at: z.string(),
  updated_at: z.string(),
});

export const RegulacionControlCreateSchema = z.object({
nombre_regulacion: z.string(),
nombre_control: z.string(),
descripcion: z.string().nullable().optional(),
obligatorio: z.boolean(),
});

export const RegulacionControlUpdateSchema = RegulacionControlCreateSchema.partial();

export type RegulacionControl = z.infer<typeof RegulacionControlSchema>;
export type RegulacionControlCreate = z.infer<typeof RegulacionControlCreateSchema>;
export type RegulacionControlUpdate = z.infer<typeof RegulacionControlUpdateSchema>;
