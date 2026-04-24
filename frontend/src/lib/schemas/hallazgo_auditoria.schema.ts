import { z } from 'zod';

/** Alineado con `backend/app/schemas/hallazgo_auditoria.py` (categoria/estado con defaults en API). */
export const HallazgoAuditoriaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  descripcion: z.string(),
  severidad: z.string(),
  auditoria_id: z.string().uuid(),
  categoria: z.string(),
  estado: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const HallazgoAuditoriaCreateSchema = z.object({
  titulo: z.string().min(1).max(255),
  descripcion: z.string().min(1),
  severidad: z.string().min(1).max(50),
  auditoria_id: z.string().uuid(),
  categoria: z.string().min(1).max(100),
  estado: z.string().min(1).max(100),
});

export const HallazgoAuditoriaUpdateSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descripcion: z.string().min(1).optional(),
  severidad: z.string().min(1).max(50).optional(),
  categoria: z.string().min(1).max(100).optional(),
  estado: z.string().min(1).max(100).optional(),
});

export type HallazgoAuditoria = z.infer<typeof HallazgoAuditoriaSchema>;
export type HallazgoAuditoriaCreate = z.infer<typeof HallazgoAuditoriaCreateSchema>;
export type HallazgoAuditoriaUpdate = z.infer<typeof HallazgoAuditoriaUpdateSchema>;
