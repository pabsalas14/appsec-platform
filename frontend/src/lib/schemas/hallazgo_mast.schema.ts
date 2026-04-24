import { z } from 'zod';

export const HallazgoMASTSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
ejecucion_mast_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
nombre: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
cwe: z.string().nullable().optional(),
owasp_categoria: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const HallazgoMASTCreateSchema = z.object({
ejecucion_mast_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
nombre: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
cwe: z.string().nullable().optional(),
owasp_categoria: z.string().nullable().optional(),
});

export const HallazgoMASTUpdateSchema = HallazgoMASTCreateSchema.partial();

export type HallazgoMAST = z.infer<typeof HallazgoMASTSchema>;
export type HallazgoMASTCreate = z.infer<typeof HallazgoMASTCreateSchema>;
export type HallazgoMASTUpdate = z.infer<typeof HallazgoMASTUpdateSchema>;
