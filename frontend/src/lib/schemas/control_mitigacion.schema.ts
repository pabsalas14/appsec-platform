import { z } from 'zod';

export const ControlMitigacionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
amenaza_id: z.string().uuid(),
nombre: z.string(),
descripcion: z.string().nullable().optional(),
tipo: z.string(),
estado: z.string(),
responsable_id: z.string().uuid().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ControlMitigacionCreateSchema = z.object({
amenaza_id: z.string().uuid(),
nombre: z.string(),
descripcion: z.string().nullable().optional(),
tipo: z.string(),
estado: z.string(),
responsable_id: z.string().uuid().nullable().optional(),
});

export const ControlMitigacionUpdateSchema = ControlMitigacionCreateSchema.partial();

export type ControlMitigacion = z.infer<typeof ControlMitigacionSchema>;
export type ControlMitigacionCreate = z.infer<typeof ControlMitigacionCreateSchema>;
export type ControlMitigacionUpdate = z.infer<typeof ControlMitigacionUpdateSchema>;
