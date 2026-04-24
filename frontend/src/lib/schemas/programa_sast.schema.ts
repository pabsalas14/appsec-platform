import { z } from 'zod';

export const ProgramaSastSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
ano: z.number().int(),
descripcion: z.string().nullable().optional(),
repositorio_id: z.string().uuid(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ProgramaSastCreateSchema = z.object({
nombre: z.string(),
ano: z.number().int(),
descripcion: z.string().nullable().optional(),
repositorio_id: z.string().uuid(),
estado: z.string(),
});

export const ProgramaSastUpdateSchema = ProgramaSastCreateSchema.partial();

export type ProgramaSast = z.infer<typeof ProgramaSastSchema>;
export type ProgramaSastCreate = z.infer<typeof ProgramaSastCreateSchema>;
export type ProgramaSastUpdate = z.infer<typeof ProgramaSastUpdateSchema>;
