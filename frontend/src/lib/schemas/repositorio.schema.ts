import { z } from 'zod';

export const RepositorioSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
url: z.string(),
plataforma: z.string(),
rama_default: z.string(),
activo: z.boolean(),
celula_id: z.string().uuid(),
created_at: z.string(),
  updated_at: z.string(),
});

export const RepositorioCreateSchema = z.object({
nombre: z.string(),
url: z.string(),
plataforma: z.string(),
rama_default: z.string(),
activo: z.boolean(),
celula_id: z.string().uuid(),
});

export const RepositorioUpdateSchema = RepositorioCreateSchema.partial();

export type Repositorio = z.infer<typeof RepositorioSchema>;
export type RepositorioCreate = z.infer<typeof RepositorioCreateSchema>;
export type RepositorioUpdate = z.infer<typeof RepositorioUpdateSchema>;
