import { z } from 'zod';

export const moduleViewSchema = z.object({
  id: z.string().optional(),
  module_name: z.string().min(1, 'Nombre del módulo requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  tipo: z.enum(['table', 'kanban', 'calendar', 'cards']),
  columns_config: z.record(z.unknown()).optional(),
  filters: z.record(z.unknown()).optional(),
  deleted_at: z.string().nullable().optional(),
  deleted_by: z.string().nullable().optional(),
});

export type ModuleView = z.infer<typeof moduleViewSchema>;

export const customFieldSchema = z.object({
  id: z.string().optional(),
  entity_type: z.string().min(1, 'Tipo de entidad requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  tipo_campo: z.enum(['string', 'number', 'boolean', 'date', 'json', 'enum']),
  required: z.boolean().default(false),
  validacion: z.record(z.unknown()).optional(),
  deleted_at: z.string().nullable().optional(),
  deleted_by: z.string().nullable().optional(),
});

export type CustomField = z.infer<typeof customFieldSchema>;

export const validationRuleSchema = z.object({
  id: z.string().optional(),
  entity_type: z.string().min(1, 'Tipo de entidad requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  condition: z.record(z.unknown()).or(z.string()),
  rule_type: z.enum(['required', 'regex', 'range', 'custom']),
  enabled: z.boolean().default(true),
  deleted_at: z.string().nullable().optional(),
  deleted_by: z.string().nullable().optional(),
});

export type ValidationRule = z.infer<typeof validationRuleSchema>;

export const catalogSchema = z.object({
  id: z.string().optional(),
  tipo: z.string().min(1, 'Tipo de catálogo requerido'),
  key: z.string().min(1, 'Clave requerida'),
  values: z.array(z.any()).or(z.record(z.unknown())).optional(),
  activo: z.boolean().default(true),
  descripcion: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
  deleted_by: z.string().nullable().optional(),
});

export type Catalog = z.infer<typeof catalogSchema>;

export const navigationItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Etiqueta requerida'),
  icon: z.string().optional(),
  href: z.string().optional(),
  orden: z.number().default(0),
  visible: z.boolean().default(true),
  required_role: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
  deleted_by: z.string().nullable().optional(),
});

export type NavigationItem = z.infer<typeof navigationItemSchema>;

export const aiRuleSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  trigger_type: z.enum(['event', 'schedule', 'manual']),
  trigger_config: z.record(z.unknown()).optional(),
  action_type: z.enum(['create', 'update', 'notify', 'execute']),
  action_config: z.record(z.unknown()).optional(),
  enabled: z.boolean().default(true),
  deleted_at: z.string().nullable().optional(),
  deleted_by: z.string().nullable().optional(),
});

export type AIRule = z.infer<typeof aiRuleSchema>;
