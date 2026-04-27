import { z } from 'zod';

export const IndicadorFormulaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  code: z.string(),
  nombre: z.string(),
  motor: z.string(),
  formula: z.record(z.string(), z.unknown()),
  sla_config: z.record(z.string(), z.number()).nullable().optional(),
  threshold_green: z.number().nullable().optional(),
  threshold_yellow: z.number().nullable().optional(),
  threshold_red: z.number().nullable().optional(),
  periodicidad: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const IndicadorFormulaCreateSchema = z.object({
  code: z.string().min(1).max(50),
  nombre: z.string().min(1).max(255),
  motor: z.string().min(1).max(100),
  formula: z.record(z.string(), z.unknown()),
  sla_config: z.record(z.string(), z.number()).nullable().optional(),
  threshold_green: z.number().nullable().optional(),
  threshold_yellow: z.number().nullable().optional(),
  threshold_red: z.number().nullable().optional(),
  periodicidad: z.string().min(1).max(50),
});

export const IndicadorFormulaUpdateSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  nombre: z.string().min(1).max(255).optional(),
  motor: z.string().min(1).max(100).optional(),
  formula: z.record(z.string(), z.unknown()).optional(),
  sla_config: z.record(z.string(), z.number()).nullable().optional(),
  threshold_green: z.number().nullable().optional(),
  threshold_yellow: z.number().nullable().optional(),
  threshold_red: z.number().nullable().optional(),
  periodicidad: z.string().min(1).max(50).optional(),
});

export type IndicadorFormula = z.infer<typeof IndicadorFormulaSchema>;
export type IndicadorFormulaCreate = z.infer<typeof IndicadorFormulaCreateSchema>;
export type IndicadorFormulaUpdate = z.infer<typeof IndicadorFormulaUpdateSchema>;
