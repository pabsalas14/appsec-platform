import { z } from 'zod';

// ─── User schemas ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(150),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  full_name: z.string().max(255).optional().default(''),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const editUserSchema = z.object({
  full_name: z.string().max(255).optional().default(''),
  email: z.string().email('Invalid email').optional(),
  role: z.string().optional(),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;

export const changePasswordSchema = z.object({
  password: z.string().min(8, 'Min 8 characters'),
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
