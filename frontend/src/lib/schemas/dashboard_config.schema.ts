import { z } from 'zod';

export const DashboardConfigSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
dashboard_id: z.string(),
widget_id: z.string(),
role_id: z.string().uuid(),
visible: z.boolean(),
editable_by_role: z.boolean(),
created_at: z.string(),
  updated_at: z.string(),
});

export const DashboardConfigCreateSchema = z.object({
dashboard_id: z.string(),
widget_id: z.string(),
role_id: z.string().uuid(),
visible: z.boolean(),
editable_by_role: z.boolean(),
});

export const DashboardConfigUpdateSchema = DashboardConfigCreateSchema.partial();

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type DashboardConfigCreate = z.infer<typeof DashboardConfigCreateSchema>;
export type DashboardConfigUpdate = z.infer<typeof DashboardConfigUpdateSchema>;
