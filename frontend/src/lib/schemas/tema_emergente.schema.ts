import { z } from 'zod';

export const TemaEmergenteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  descripcion: z.string(),
  tipo: z.string(),
  impacto: z.string(),
  estado: z.string(),
  fuente: z.string(),
  celula_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TemaEmergenteCreateSchema = z.object({
  titulo: z.string().min(1).max(255),
  descripcion: z.string().min(1),
  tipo: z.string().min(1).max(100),
  impacto: z.string().min(1).max(50),
  estado: z.string().min(1).max(100),
  fuente: z.string().min(1).max(255),
  celula_id: z.string().uuid().nullable().optional(),
});

export const TemaEmergenteUpdateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descripcion: z.string().min(1).optional(),
  tipo: z.string().min(1).max(100).optional(),
  impacto: z.string().min(1).max(50).optional(),
  estado: z.string().min(1).max(100).optional(),
  fuente: z.string().min(1).max(255).optional(),
  celula_id: z.string().uuid().nullable().optional(),
});

export type TemaEmergente = z.infer<typeof TemaEmergenteSchema>;
export type TemaEmergenteCreate = z.infer<typeof TemaEmergenteCreateSchema>;
export type TemaEmergenteUpdate = z.infer<typeof TemaEmergenteUpdateSchema>;
