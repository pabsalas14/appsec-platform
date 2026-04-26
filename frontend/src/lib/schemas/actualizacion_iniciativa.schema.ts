import { z } from 'zod';

export const ActualizacionIniciativaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  contenido: z.string(),
  iniciativa_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ActualizacionIniciativaCreateSchema = z.object({
  titulo: z.string().min(1).max(255),
  contenido: z.string().min(1),
  iniciativa_id: z.string().uuid(),
});

export const ActualizacionIniciativaUpdateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  contenido: z.string().min(1).optional(),
});

export type ActualizacionIniciativa = z.infer<typeof ActualizacionIniciativaSchema>;
export type ActualizacionIniciativaCreate = z.infer<typeof ActualizacionIniciativaCreateSchema>;
export type ActualizacionIniciativaUpdate = z.infer<typeof ActualizacionIniciativaUpdateSchema>;
