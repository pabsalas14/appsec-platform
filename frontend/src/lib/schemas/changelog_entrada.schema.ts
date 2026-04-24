import { z } from 'zod';

export const ChangelogEntradaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
version: z.string(),
titulo: z.string(),
descripcion: z.string(),
tipo: z.string(),
fecha_publicacion: z.string().nullable().optional(),
publicado: z.boolean(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ChangelogEntradaCreateSchema = z.object({
version: z.string(),
titulo: z.string(),
descripcion: z.string(),
tipo: z.string(),
fecha_publicacion: z.string().nullable().optional(),
publicado: z.boolean(),
});

export const ChangelogEntradaUpdateSchema = ChangelogEntradaCreateSchema.partial();

export type ChangelogEntrada = z.infer<typeof ChangelogEntradaSchema>;
export type ChangelogEntradaCreate = z.infer<typeof ChangelogEntradaCreateSchema>;
export type ChangelogEntradaUpdate = z.infer<typeof ChangelogEntradaUpdateSchema>;
