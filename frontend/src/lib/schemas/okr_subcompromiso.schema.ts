import { z } from 'zod';

export const OkrSubcompromisoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
compromiso_id: z.string().uuid(),
nombre_sub_item: z.string(),
resultado_esperado: z.string().nullable().optional(),
peso_interno: z.number(),
evidencia_requerida: z.boolean(),
created_at: z.string(),
  updated_at: z.string(),
});

export const OkrSubcompromisoCreateSchema = z.object({
compromiso_id: z.string().uuid(),
nombre_sub_item: z.string(),
resultado_esperado: z.string().nullable().optional(),
peso_interno: z.number(),
evidencia_requerida: z.boolean(),
});

export const OkrSubcompromisoUpdateSchema = OkrSubcompromisoCreateSchema.partial();

export type OkrSubcompromiso = z.infer<typeof OkrSubcompromisoSchema>;
export type OkrSubcompromisoCreate = z.infer<typeof OkrSubcompromisoCreateSchema>;
export type OkrSubcompromisoUpdate = z.infer<typeof OkrSubcompromisoUpdateSchema>;
