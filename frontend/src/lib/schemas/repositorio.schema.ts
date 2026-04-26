import { z } from 'zod';

export const RepositorioSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  url: z.string().url(),
  plataforma: z.string(),
  rama_default: z.string(),
  activo: z.boolean(),
  organizacion_id: z.string().uuid(),
  celula_id: z.string().uuid().nullable().optional(),
  subdireccion_responsable_id: z.string().uuid().nullable().optional(),
  responsable_nombre: z.string().nullable().optional(),
  responsable_contacto: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const RepositorioCreateSchema = z.object({
  nombre: z.string().min(1).max(500),
  url: z.string().url('Debe ser una URL http(s) válida'),
  plataforma: z.string().min(1),
  rama_default: z.string().min(1).max(255),
  activo: z.boolean(),
  organizacion_id: z.string().uuid(),
  celula_id: z.string().uuid().optional().or(z.literal('')),
  subdireccion_responsable_id: z.string().uuid().optional().or(z.literal('')),
  responsable_nombre: z.string().max(255).optional(),
  responsable_contacto: z.string().max(255).optional(),
});

export const RepositorioUpdateSchema = z.object({
  nombre: z.string().min(1).max(500).optional(),
  url: z.string().url('Debe ser una URL http(s) válida').optional(),
  plataforma: z.string().min(1).optional(),
  rama_default: z.string().min(1).max(255).optional(),
  activo: z.boolean().optional(),
  organizacion_id: z.string().uuid().optional(),
  celula_id: z.string().uuid().nullable().optional(),
  subdireccion_responsable_id: z.string().uuid().nullable().optional(),
  responsable_nombre: z.string().max(255).nullable().optional(),
  responsable_contacto: z.string().max(255).nullable().optional(),
});

export type Repositorio = z.infer<typeof RepositorioSchema>;
export type RepositorioCreate = z.infer<typeof RepositorioCreateSchema>;
export type RepositorioUpdate = z.infer<typeof RepositorioUpdateSchema>;
