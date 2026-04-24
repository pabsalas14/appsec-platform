import { z } from 'zod';

export const ProgramaSourceCodeSchema = z.object({
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

export const ProgramaSourceCodeCreateSchema = z.object({
nombre: z.string(),
ano: z.number().int(),
descripcion: z.string().nullable().optional(),
repositorio_id: z.string().uuid(),
estado: z.string(),
});

export const ProgramaSourceCodeUpdateSchema = ProgramaSourceCodeCreateSchema.partial();

export type ProgramaSourceCode = z.infer<typeof ProgramaSourceCodeSchema>;
export type ProgramaSourceCodeCreate = z.infer<typeof ProgramaSourceCodeCreateSchema>;
export type ProgramaSourceCodeUpdate = z.infer<typeof ProgramaSourceCodeUpdateSchema>;
