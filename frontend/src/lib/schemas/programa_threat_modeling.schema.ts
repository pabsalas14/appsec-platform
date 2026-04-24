import { z } from 'zod';

export const ProgramaThreatModelingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
ano: z.number().int(),
descripcion: z.string().nullable().optional(),
activo_web_id: z.string().uuid().nullable().optional(),
servicio_id: z.string().uuid().nullable().optional(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ProgramaThreatModelingCreateSchema = z.object({
nombre: z.string(),
ano: z.number().int(),
descripcion: z.string().nullable().optional(),
activo_web_id: z.string().uuid().nullable().optional(),
servicio_id: z.string().uuid().nullable().optional(),
estado: z.string(),
});

export const ProgramaThreatModelingUpdateSchema = ProgramaThreatModelingCreateSchema.partial();

export type ProgramaThreatModeling = z.infer<typeof ProgramaThreatModelingSchema>;
export type ProgramaThreatModelingCreate = z.infer<typeof ProgramaThreatModelingCreateSchema>;
export type ProgramaThreatModelingUpdate = z.infer<typeof ProgramaThreatModelingUpdateSchema>;
