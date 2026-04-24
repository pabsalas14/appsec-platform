import { z } from 'zod';

export const IniciativaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
tipo: z.string(),
estado: z.string(),
fecha_inicio: z.string().nullable().optional(),
fecha_fin_estimada: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const IniciativaCreateSchema = z.object({
titulo: z.string(),
descripcion: z.string().nullable().optional(),
tipo: z.string(),
estado: z.string(),
fecha_inicio: z.string().nullable().optional(),
fecha_fin_estimada: z.string().nullable().optional(),
});

export const IniciativaUpdateSchema = IniciativaCreateSchema.partial();

export type Iniciativa = z.infer<typeof IniciativaSchema>;
export type IniciativaCreate = z.infer<typeof IniciativaCreateSchema>;
export type IniciativaUpdate = z.infer<typeof IniciativaUpdateSchema>;
