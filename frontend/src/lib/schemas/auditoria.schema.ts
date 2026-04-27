import { z } from 'zod';

export const AuditoriaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  tipo: z.string(),
  estado: z.string(),
  alcance: z.string(),
  fecha_inicio: z.string(),
  fecha_fin: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AuditoriaCreateSchema = z.object({
  titulo: z.string().min(1).max(255),
  tipo: z.string().min(1).max(100),
  estado: z.string().min(1).max(100),
  alcance: z.string().min(1),
  fecha_inicio: z.string().min(1),
  fecha_fin: z.string().nullable().optional(),
});

export const AuditoriaUpdateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  tipo: z.string().min(1).max(100).optional(),
  estado: z.string().min(1).max(100).optional(),
  alcance: z.string().min(1).optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().nullable().optional(),
});

export type Auditoria = z.infer<typeof AuditoriaSchema>;
export type AuditoriaCreate = z.infer<typeof AuditoriaCreateSchema>;
export type AuditoriaUpdate = z.infer<typeof AuditoriaUpdateSchema>;
