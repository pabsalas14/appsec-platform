import { z } from 'zod';

export const SubdireccionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  direccion_id: z.string().uuid().nullable().optional(),
  nombre: z.string(),
  codigo: z.string(),
  descripcion: z.string().nullable().optional(),
  director_nombre: z.string().nullable().optional(),
  director_contacto: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SubdireccionCreateSchema = z.object({
  direccion_id: z.string().uuid().nullable().optional(),
  nombre: z.string(),
  codigo: z.string(),
  descripcion: z.string().nullable().optional(),
  director_nombre: z.string().nullable().optional(),
  director_contacto: z.string().nullable().optional(),
});

export const SubdireccionUpdateSchema = SubdireccionCreateSchema.partial();

export type Subdireccion = z.infer<typeof SubdireccionSchema>;
export type SubdireccionCreate = z.infer<typeof SubdireccionCreateSchema>;
export type SubdireccionUpdate = z.infer<typeof SubdireccionUpdateSchema>;
