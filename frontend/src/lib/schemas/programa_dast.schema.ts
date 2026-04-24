import { z } from 'zod';

export const ProgramaDastSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
ano: z.number().int(),
descripcion: z.string().nullable().optional(),
activo_web_id: z.string().uuid(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ProgramaDastCreateSchema = z.object({
nombre: z.string(),
ano: z.number().int(),
descripcion: z.string().nullable().optional(),
activo_web_id: z.string().uuid(),
estado: z.string(),
});

export const ProgramaDastUpdateSchema = ProgramaDastCreateSchema.partial();

export type ProgramaDast = z.infer<typeof ProgramaDastSchema>;
export type ProgramaDastCreate = z.infer<typeof ProgramaDastCreateSchema>;
export type ProgramaDastUpdate = z.infer<typeof ProgramaDastUpdateSchema>;
