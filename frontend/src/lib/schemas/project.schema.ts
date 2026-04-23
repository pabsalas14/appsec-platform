import { z } from 'zod';

export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Max 255 characters'),
  description: z.string().max(2000, 'Max 2000 characters'),
  status: z.enum(PROJECT_STATUSES),
  color: z.string().max(16),
});

export type ProjectCreateFormData = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  color: z.string().max(16).optional(),
});

export type ProjectUpdateFormData = z.infer<typeof projectUpdateSchema>;
