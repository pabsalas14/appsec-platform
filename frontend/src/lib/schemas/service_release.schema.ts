import { z } from 'zod';

/** Alineado al backend + BRD C1 (incl. columnas kanban y variantes de nombre). */
export const ESTADOS_SERVICE_RELEASE = [
  'Borrador',
  'En Revision de Diseno',
  'En Validacion de Seguridad',
  'Con Observaciones',
  'En Pruebas de Seguridad',
  'Pendiente de Aprobacion',
  'Pendiente Aprobación',
  'En QA',
  'En Produccion',
  'Rechazado',
  'Cancelado',
] as const;

const estadoEnum = z.enum(ESTADOS_SERVICE_RELEASE);

const contextoVal = z.record(z.string(), z.unknown()).nullable().optional();

export const ServiceReleaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  version: z.string(),
  descripcion: z.string().nullable().optional(),
  servicio_id: z.string().uuid(),
  estado_actual: z.string(),
  jira_referencia: z.string().nullable().optional(),
  contexto_liberacion: contextoVal,
  /** ISO-8601 desde la API */
  fecha_entrada: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ServiceReleaseCreateSchema = z.object({
  nombre: z.string().min(1).max(500),
  version: z.string().min(1).max(100),
  descripcion: z.string().nullable().optional(),
  servicio_id: z.string().uuid(),
  estado_actual: estadoEnum,
  jira_referencia: z.string().nullable().optional(),
  contexto_liberacion: contextoVal,
  /** ISO-8601; el form usa `datetime-local` y se convierte al enviar */
  fecha_entrada: z.string().nullable().optional(),
});

export const ServiceReleaseUpdateSchema = z.object({
  nombre: z.string().min(1).max(500).optional(),
  version: z.string().min(1).max(100).optional(),
  descripcion: z.string().nullable().optional(),
  estado_actual: estadoEnum.optional(),
  jira_referencia: z.string().nullable().optional(),
  contexto_liberacion: contextoVal,
  fecha_entrada: z.string().nullable().optional(),
});

export type ServiceRelease = z.infer<typeof ServiceReleaseSchema>;
export type ServiceReleaseCreate = z.infer<typeof ServiceReleaseCreateSchema>;
export type ServiceReleaseUpdate = z.infer<typeof ServiceReleaseUpdateSchema>;

/** Valores de formulario: contexto y fecha se envían vía `contexto_liberacion` / `fecha_entrada` al API. */
export const ServiceReleaseFormInputSchema = ServiceReleaseCreateSchema.omit({
  contexto_liberacion: true,
  fecha_entrada: true,
}).extend({
  contexto_liberacion_text: z.string().optional(),
  /** `datetime-local` o vacío */
  fecha_entrada_local: z.string().optional().nullable(),
});
export type ServiceReleaseFormInput = z.infer<typeof ServiceReleaseFormInputSchema>;
