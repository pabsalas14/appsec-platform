import { z } from 'zod';

export const OrganizacionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  codigo: z.string(),
  descripcion: z.string().nullable().optional(),
  gerencia_id: z.string().uuid(),
  plataforma: z.string(),
  url_base: z.string().nullable().optional(),
  responsable: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const OrganizacionCreateSchema = z.object({
  nombre: z.string(),
  codigo: z.string(),
  descripcion: z.string().nullable().optional(),
  gerencia_id: z.string().uuid(),
  plataforma: z.string().min(1),
  url_base: z.string().nullable().optional(),
  responsable: z.string().nullable().optional(),
});

export const OrganizacionUpdateSchema = OrganizacionCreateSchema.partial();

export type Organizacion = z.infer<typeof OrganizacionSchema>;
export type OrganizacionCreate = z.infer<typeof OrganizacionCreateSchema>;
export type OrganizacionUpdate = z.infer<typeof OrganizacionUpdateSchema>;
