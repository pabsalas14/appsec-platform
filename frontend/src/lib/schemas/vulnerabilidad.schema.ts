import { z } from 'zod';

export const VulnerabilidadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
fuente: z.string(),
severidad: z.string(),
estado: z.string(),
cvss_score: z.number().nullable().optional(),
cwe_id: z.string().nullable().optional(),
owasp_categoria: z.string().nullable().optional(),
responsable_id: z.string().uuid().nullable().optional(),
fecha_limite_sla: z.string().nullable().optional(),
repositorio_id: z.string().uuid().nullable().optional(),
activo_web_id: z.string().uuid().nullable().optional(),
servicio_id: z.string().uuid().nullable().optional(),
aplicacion_movil_id: z.string().uuid().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const VulnerabilidadCreateSchema = z.object({
titulo: z.string(),
descripcion: z.string().nullable().optional(),
fuente: z.string(),
severidad: z.string(),
estado: z.string(),
cvss_score: z.number().nullable().optional(),
cwe_id: z.string().nullable().optional(),
owasp_categoria: z.string().nullable().optional(),
responsable_id: z.string().uuid().nullable().optional(),
fecha_limite_sla: z.string().nullable().optional(),
repositorio_id: z.string().uuid().nullable().optional(),
activo_web_id: z.string().uuid().nullable().optional(),
servicio_id: z.string().uuid().nullable().optional(),
aplicacion_movil_id: z.string().uuid().nullable().optional(),
});

export const VulnerabilidadUpdateSchema = VulnerabilidadCreateSchema.partial();

export type Vulnerabilidad = z.infer<typeof VulnerabilidadSchema>;
export type VulnerabilidadCreate = z.infer<typeof VulnerabilidadCreateSchema>;
export type VulnerabilidadUpdate = z.infer<typeof VulnerabilidadUpdateSchema>;
