import { z } from 'zod';

export const FlujoEstatusSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  entity_type: z.string(),
  from_status: z.string(),
  to_status: z.string(),
  allowed: z.boolean(),
  requires_justification: z.boolean(),
  requires_approval: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const FlujoEstatusCreateSchema = z.object({
  entity_type: z.string().min(1).max(100),
  from_status: z.string().min(1).max(100),
  to_status: z.string().min(1).max(100),
  allowed: z.boolean().default(true),
  requires_justification: z.boolean().default(false),
  requires_approval: z.boolean().default(false),
});

export const FlujoEstatusUpdateSchema = z.object({
  entity_type: z.string().min(1).max(100).optional(),
  from_status: z.string().min(1).max(100).optional(),
  to_status: z.string().min(1).max(100).optional(),
  allowed: z.boolean().optional(),
  requires_justification: z.boolean().optional(),
  requires_approval: z.boolean().optional(),
});

export type FlujoEstatus = z.infer<typeof FlujoEstatusSchema>;
export type FlujoEstatusCreate = z.infer<typeof FlujoEstatusCreateSchema>;
export type FlujoEstatusUpdate = z.infer<typeof FlujoEstatusUpdateSchema>;
