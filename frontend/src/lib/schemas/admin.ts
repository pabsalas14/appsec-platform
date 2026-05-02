import { z } from 'zod';

// FASE 4 - Custom Fields

export const FIELD_TYPES = ['text', 'number', 'date', 'select', 'boolean', 'url', 'user_ref'] as const;

/** Alineado a ADR-0016 (P04) + proyecto (legacy demo). */
export const ENTITY_TYPES = [
  'vulnerabilidad',
  'repositorio',
  'activo_web',
  'service_release',
  'plan_remediacion',
  'iniciativa',
  'auditoria',
  'tema_emergente',
  'hallazgo_pipeline',
  'proyecto',
] as const;

export const customFieldSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nombre requerido').max(255),
  field_type: z.enum(FIELD_TYPES),
  entity_type: z.enum(ENTITY_TYPES),
  label: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  is_required: z.boolean().default(false),
  is_searchable: z.boolean().default(false),
  order: z.number().int().default(0),
  config: z.string().optional().nullable(),  // JSON serializado
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().optional().nullable(),
});

export type CustomField = z.infer<typeof customFieldSchema>;

export const customFieldValueSchema = z.object({
  id: z.string().uuid().optional(),
  field_id: z.string().uuid(),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  value: z.string().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().optional().nullable(),
});

export type CustomFieldValue = z.infer<typeof customFieldValueSchema>;

// Config helpers for select fields
export const selectFieldConfigSchema = z.object({
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  default_value: z.string().optional().nullable(),
});

export type SelectFieldConfig = z.infer<typeof selectFieldConfigSchema>;

/** Reglas de visibilidad opcionales (spec 19.1): el UI consume `config` JSON completo. */
export const visibilityRulesSchema = z
  .object({
    show_when: z
      .object({
        field: z.string(),
        equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
        in: z.array(z.union([z.string(), z.number()])).optional(),
      })
      .optional(),
    hide_when: z
      .object({
        field: z.string(),
        equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
      })
      .optional(),
  })
  .optional();

export const customFieldConfigEnvelopeSchema = z
  .object({
    options: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
    default_value: z.string().optional().nullable(),
    visibility: visibilityRulesSchema,
  })
  .passthrough();

export type CustomFieldConfigEnvelope = z.infer<typeof customFieldConfigEnvelopeSchema>;

