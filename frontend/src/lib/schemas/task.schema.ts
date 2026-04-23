import { z } from 'zod';

// ─── Task schemas ───────────────────────────────────────────────────────────
// NOTE: Do NOT use .default() or .optional() on create schema fields.
// zodResolver uses Zod's *input* type, where .default() makes fields optional,
// causing a type mismatch with useForm which expects the *output* type.
// Set defaults via useForm's defaultValues instead.

export const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Max 255 characters'),
  description: z.string().max(2000, 'Max 2000 characters'),
  completed: z.boolean(),
});

export type TaskCreateFormData = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().max(2000).optional(),
  completed: z.boolean().optional(),
});

export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;
