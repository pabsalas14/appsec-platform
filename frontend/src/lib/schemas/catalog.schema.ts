import { z } from 'zod';

export const catalogValueSchema = z.object({
  label: z.string(),
  value: z.string(),
  color: z.string().optional(),
  order: z.number().optional(),
  description: z.string().optional(),
});

export const catalogReadSchema = z.object({
  id: z.string(),
  type: z.string(),
  display_name: z.string(),
  description: z.string().nullable().optional(),
  values: z.array(z.record(z.string(), z.unknown())),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const catalogCreateSchema = z.object({
  type: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  values: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const catalogUpdateSchema = z.object({
  display_name: z.string().optional(),
  description: z.string().optional(),
  values: z.array(z.record(z.string(), z.unknown())).optional(),
  is_active: z.boolean().optional(),
});

export type CatalogValue = z.infer<typeof catalogValueSchema>;
export type CatalogRead = z.infer<typeof catalogReadSchema>;
export type CatalogCreate = z.infer<typeof catalogCreateSchema>;
export type CatalogUpdate = z.infer<typeof catalogUpdateSchema>;
