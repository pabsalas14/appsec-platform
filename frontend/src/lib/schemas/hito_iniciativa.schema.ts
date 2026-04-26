import { z } from 'zod';

export const HitoIniciativaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  fecha_objetivo: z.string(),
  iniciativa_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const HitoIniciativaCreateSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().max(2000).nullable().optional(),
  fecha_objetivo: z.string().min(1),
  iniciativa_id: z.string().uuid(),
});

export const HitoIniciativaUpdateSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  fecha_objetivo: z.string().optional(),
});

export type HitoIniciativa = z.infer<typeof HitoIniciativaSchema>;
export type HitoIniciativaCreate = z.infer<typeof HitoIniciativaCreateSchema>;
export type HitoIniciativaUpdate = z.infer<typeof HitoIniciativaUpdateSchema>;
