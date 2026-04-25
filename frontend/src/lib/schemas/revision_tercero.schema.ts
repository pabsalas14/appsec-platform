import { z } from 'zod';

const EvidItemSchema = z.object({
  url: z.string().optional(),
  descripcion: z.string().optional(),
  tipo: z.string().optional(),
});

export const RevisionTerceroSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre_empresa: z.string(),
  tipo: z.string(),
  servicio_id: z.string().uuid().nullable().optional(),
  activo_web_id: z.string().uuid().nullable().optional(),
  fecha_inicio: z.string(),
  fecha_fin: z.string().nullable().optional(),
  estado: z.string(),
  informe_filename: z.string().nullable().optional(),
  informe_sha256: z.string().nullable().optional(),
  checklist_resultados: z.record(z.string(), z.unknown()).nullable().optional(),
  evidencias: z.array(EvidItemSchema).nullable().optional(),
  responsable_revision: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const RevisionTerceroCreateSchema = z.object({
  nombre_empresa: z.string(),
  tipo: z.string(),
  servicio_id: z.string().uuid().nullable().optional(),
  activo_web_id: z.string().uuid().nullable().optional(),
  fecha_inicio: z.string(),
  fecha_fin: z.string().nullable().optional(),
  estado: z.string(),
  informe_filename: z.string().nullable().optional(),
  informe_sha256: z.string().nullable().optional(),
  checklist_resultados: z.record(z.string(), z.unknown()).nullable().optional(),
  evidencias: z.array(EvidItemSchema).nullable().optional(),
  responsable_revision: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

export const RevisionTerceroUpdateSchema = RevisionTerceroCreateSchema.partial();

export type RevisionTercero = z.infer<typeof RevisionTerceroSchema>;
export type RevisionTerceroCreate = z.infer<typeof RevisionTerceroCreateSchema>;
export type RevisionTerceroUpdate = z.infer<typeof RevisionTerceroUpdateSchema>;
