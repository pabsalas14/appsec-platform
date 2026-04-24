import { z } from 'zod';

export const CRITICIDAD_OPTIONS = ['Baja', 'Media', 'Alta', 'Crítica'] as const;

export const ServicioSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  criticidad: z.string(),
  tecnologia_stack: z.string().nullable().optional(),
  celula_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ServicioCreateSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  criticidad: z.string().min(1).max(50),
  tecnologia_stack: z.string().nullable().optional(),
  celula_id: z.string().uuid(),
});

export const ServicioUpdateSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  descripcion: z.string().nullable().optional(),
  criticidad: z.string().min(1).max(50).optional(),
  tecnologia_stack: z.string().nullable().optional(),
  celula_id: z.string().uuid().optional(),
});

export type Servicio = z.infer<typeof ServicioSchema>;
export type ServicioCreate = z.infer<typeof ServicioCreateSchema>;
export type ServicioUpdate = z.infer<typeof ServicioUpdateSchema>;
