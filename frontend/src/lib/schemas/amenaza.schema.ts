import { z } from 'zod';

export const AmenazaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
sesion_id: z.string().uuid(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
categoria_stride: z.string(),
dread_damage: z.number().int(),
dread_reproducibility: z.number().int(),
dread_exploitability: z.number().int(),
dread_affected_users: z.number().int(),
dread_discoverability: z.number().int(),
score_total: z.number().nullable().optional(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

/** Create: `score_total` lo calcula el backend; no se envía. DREAD 1-10. */
export const AmenazaCreateSchema = z.object({
  sesion_id: z.string().uuid(),
  titulo: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  categoria_stride: z.string(),
  dread_damage: z.number().int().min(1).max(10),
  dread_reproducibility: z.number().int().min(1).max(10),
  dread_exploitability: z.number().int().min(1).max(10),
  dread_affected_users: z.number().int().min(1).max(10),
  dread_discoverability: z.number().int().min(1).max(10),
  estado: z.string(),
});

export const AmenazaUpdateSchema = AmenazaCreateSchema.partial();

export type Amenaza = z.infer<typeof AmenazaSchema>;
export type AmenazaCreate = z.infer<typeof AmenazaCreateSchema>;
export type AmenazaUpdate = z.infer<typeof AmenazaUpdateSchema>;
