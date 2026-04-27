import { z } from 'zod';

export const ActualizacionTemaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  contenido: z.string(),
  fuente: z.string().nullable().optional(),
  tema_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ActualizacionTemaCreateSchema = z.object({
  titulo: z.string().min(1).max(255),
  contenido: z.string().min(1),
  fuente: z.string().max(255).nullable().optional(),
  tema_id: z.string().uuid(),
});

export const ActualizacionTemaUpdateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  contenido: z.string().min(1).optional(),
  fuente: z.string().max(255).nullable().optional(),
});

export type ActualizacionTema = z.infer<typeof ActualizacionTemaSchema>;
export type ActualizacionTemaCreate = z.infer<typeof ActualizacionTemaCreateSchema>;
export type ActualizacionTemaUpdate = z.infer<typeof ActualizacionTemaUpdateSchema>;
