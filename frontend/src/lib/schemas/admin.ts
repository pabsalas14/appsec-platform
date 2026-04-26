import { z } from 'zod';

// FASE 4 - Custom Fields

export const FIELD_TYPES = ['text', 'number', 'date', 'select', 'boolean', 'url', 'user_ref'] as const;

export const ENTITY_TYPES = [
  'vulnerabilidad',
  'iniciativa',
  'auditoria',
  'tema_emergente',
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

