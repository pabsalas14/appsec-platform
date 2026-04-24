import { z } from 'zod';

export const ControlSourceCodeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
tipo: z.string(),
descripcion: z.string().nullable().optional(),
obligatorio: z.boolean(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ControlSourceCodeCreateSchema = z.object({
nombre: z.string(),
tipo: z.string(),
descripcion: z.string().nullable().optional(),
obligatorio: z.boolean(),
});

export const ControlSourceCodeUpdateSchema = ControlSourceCodeCreateSchema.partial();

export type ControlSourceCode = z.infer<typeof ControlSourceCodeSchema>;
export type ControlSourceCodeCreate = z.infer<typeof ControlSourceCodeCreateSchema>;
export type ControlSourceCodeUpdate = z.infer<typeof ControlSourceCodeUpdateSchema>;
