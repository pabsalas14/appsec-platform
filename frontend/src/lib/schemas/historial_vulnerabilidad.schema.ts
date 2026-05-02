import { z } from 'zod';

export const HistorialVulnerabilidadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  vulnerabilidad_id: z.string().uuid(),
  estado_anterior: z.string().nullable().optional(),
  estado_nuevo: z.string().nullable().optional(),
  responsable_id: z.string().uuid().nullable().optional(),
  justificacion: z.string().nullable().optional(),
  comentario: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const HistorialVulnerabilidadCreateSchema = z.object({
vulnerabilidad_id: z.string().uuid(),
estado_anterior: z.string(),
estado_nuevo: z.string(),
responsable_id: z.string().uuid().nullable().optional(),
justificacion: z.string().nullable().optional(),
comentario: z.string().nullable().optional(),
});

export const HistorialVulnerabilidadUpdateSchema = HistorialVulnerabilidadCreateSchema.partial();

export type HistorialVulnerabilidad = z.infer<typeof HistorialVulnerabilidadSchema>;
export type HistorialVulnerabilidadCreate = z.infer<typeof HistorialVulnerabilidadCreateSchema>;
export type HistorialVulnerabilidadUpdate = z.infer<typeof HistorialVulnerabilidadUpdateSchema>;
