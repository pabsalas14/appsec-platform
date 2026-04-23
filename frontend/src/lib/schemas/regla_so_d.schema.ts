import { z } from 'zod';

export const ReglaSoDSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
accion: z.string(),
descripcion: z.string().nullable().optional(),
enabled: z.boolean(),
alcance: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ReglaSoDCreateSchema = z.object({
accion: z.string(),
descripcion: z.string().nullable().optional(),
enabled: z.boolean(),
alcance: z.string().nullable().optional(),
});

export const ReglaSoDUpdateSchema = ReglaSoDCreateSchema.partial();

export type ReglaSoD = z.infer<typeof ReglaSoDSchema>;
export type ReglaSoDCreate = z.infer<typeof ReglaSoDCreateSchema>;
export type ReglaSoDUpdate = z.infer<typeof ReglaSoDUpdateSchema>;
