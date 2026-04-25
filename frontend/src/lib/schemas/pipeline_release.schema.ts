import { z } from 'zod';

export const TIPOS_PIPELINE = ['SAST', 'DAST', 'SCA'] as const;
export const RESULTADOS_PIPELINE = [
  'Pendiente',
  'En Progreso',
  'Exitoso',
  'Fallido',
  'Cancelado',
] as const;

const tipoE = z.enum(TIPOS_PIPELINE);
const resE = z.enum(RESULTADOS_PIPELINE);

const uuidOrEmpty = z.union([z.string().uuid(), z.literal('')]);

export const PipelineReleaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  service_release_id: z.string().uuid().nullable().optional(),
  repositorio_id: z.string().uuid().nullable().optional(),
  rama: z.string(),
  scan_id: z.string().nullable().optional(),
  mes: z.number().int().nullable().optional(),
  activo_web_id: z.string().uuid().nullable().optional(),
  commit_sha: z.string().nullable().optional(),
  tipo: z.string(),
  resultado: z.string(),
  herramienta: z.string().nullable().optional(),
  liberado_con_vulns_criticas_o_altas: z.boolean().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Valores de `<select>` para mes; se convierten a `number | null` al enviar. */
export const PipelineMesOptions = [
  { value: '', label: '—' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

const formBase = {
  service_release_id: uuidOrEmpty.optional(),
  repositorio_id: uuidOrEmpty.optional(),
  rama: z.string().min(1).max(255),
  commit_sha: z.string().max(64).nullable().optional(),
  scan_id: z.string().max(255).nullable().optional(),
  mes: z
    .string()
    .optional()
    .refine((s) => s === undefined || s === '' || /^([1-9]|1[0-2])$/.test(s), { message: 'Mes entre 1 y 12' }),
  activo_web_id: uuidOrEmpty.optional(),
  tipo: tipoE,
  resultado: resE,
  herramienta: z.string().max(200).nullable().optional(),
  liberado_con_vulns_criticas_o_altas: z.boolean().nullable().optional(),
};

export const PipelineReleaseFormCreateSchema = z
  .object(formBase)
  .superRefine((data, ctx) => {
    const hasRepo = Boolean(data.repositorio_id && data.repositorio_id.length > 0);
    const hasActivo = Boolean(data.activo_web_id && data.activo_web_id.length > 0);
    if (data.tipo === 'DAST') {
      if (!hasRepo && !hasActivo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DAST: indique repositorio y/o activo web (BRD §10.2).',
          path: ['activo_web_id'],
        });
      }
    } else if (!hasRepo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SAST/SCA: repositorio obligatorio.',
        path: ['repositorio_id'],
      });
    }
  });

export const PipelineReleaseCreateSchema = z
  .object({
    service_release_id: z.union([z.string().uuid(), z.null()]).optional(),
    repositorio_id: z.union([z.string().uuid(), z.null()]).optional(),
    rama: z.string().min(1).max(255),
    commit_sha: z.string().max(64).nullable().optional(),
    scan_id: z.string().max(255).nullable().optional(),
    mes: z.number().int().min(1).max(12).nullable().optional(),
    activo_web_id: z.union([z.string().uuid(), z.null()]).optional(),
    tipo: tipoE,
    resultado: resE,
    herramienta: z.string().max(200).nullable().optional(),
    liberado_con_vulns_criticas_o_altas: z.boolean().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasRepo = Boolean(data.repositorio_id);
    const hasActivo = Boolean(data.activo_web_id);
    if (data.tipo === 'DAST') {
      if (!hasRepo && !hasActivo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'DAST: repositorio y/o activo web requerido.', path: ['activo_web_id'] });
      }
    } else if (!hasRepo) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SAST/SCA: repositorio obligatorio.', path: ['repositorio_id'] });
    }
  });

export const PipelineReleaseUpdateSchema = z.object({
  repositorio_id: z.string().uuid().nullable().optional(),
  rama: z.string().min(1).max(255).optional(),
  commit_sha: z.string().max(64).nullable().optional(),
  scan_id: z.string().max(255).nullable().optional(),
  mes: z.number().int().min(1).max(12).nullable().optional(),
  activo_web_id: z.string().uuid().nullable().optional(),
  resultado: resE.optional(),
  herramienta: z.string().max(200).nullable().optional(),
  liberado_con_vulns_criticas_o_altas: z.boolean().nullable().optional(),
});

export type PipelineRelease = z.infer<typeof PipelineReleaseSchema>;
export type PipelineReleaseCreate = z.infer<typeof PipelineReleaseCreateSchema>;
export type PipelineReleaseUpdate = z.infer<typeof PipelineReleaseUpdateSchema>;
