import { z } from 'zod';

export const ServicioReguladoRegistroSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
servicio_id: z.string().uuid(),
nombre_regulacion: z.string(),
ciclo: z.string(),
ano: z.number().int(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ServicioReguladoRegistroCreateSchema = z.object({
servicio_id: z.string().uuid(),
nombre_regulacion: z.string(),
ciclo: z.string(),
ano: z.number().int(),
estado: z.string(),
});

export const ServicioReguladoRegistroUpdateSchema = ServicioReguladoRegistroCreateSchema.partial();

export type ServicioReguladoRegistro = z.infer<typeof ServicioReguladoRegistroSchema>;
export type ServicioReguladoRegistroCreate = z.infer<typeof ServicioReguladoRegistroCreateSchema>;
export type ServicioReguladoRegistroUpdate = z.infer<typeof ServicioReguladoRegistroUpdateSchema>;
