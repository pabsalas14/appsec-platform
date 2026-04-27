import { z } from 'zod';

/** Cuerpo mínimo alineado con FiltroGuardado en API (parametros es JSON libre en backend). */
export const FiltroGuardadoSchema = z.object({
  id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  nombre: z.string(),
  modulo: z.string(),
  parametros: z.record(z.string(), z.unknown()),
  compartido: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const FiltroGuardadoCreateSchema = z.object({
  nombre: z.string().min(1).max(255),
  modulo: z.string().min(1).max(100),
  parametros: z.record(z.string(), z.unknown()),
  compartido: z.boolean(),
});

export type FiltroGuardado = z.infer<typeof FiltroGuardadoSchema>;
export type FiltroGuardadoCreate = z.infer<typeof FiltroGuardadoCreateSchema>;
