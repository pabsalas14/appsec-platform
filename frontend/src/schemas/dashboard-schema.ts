import { z } from 'zod';

export const WidgetLayoutSchema = z.object({
  x: z.number().int().min(0).max(11),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
  minW: z.number().int().min(1).max(12).optional(),
  minH: z.number().int().min(1).optional(),
  maxW: z.number().int().min(1).max(12).optional(),
  maxH: z.number().int().min(1).optional(),
});

export const GridConfigSchema = z.object({
  cols: z.number().int().min(1).max(24).default(12),
  rowHeight: z.number().int().min(20).max(200).default(80),
  compactType: z.enum(['vertical', 'horizontal', 'both']).default('vertical'),
});

export const WidgetConfigSchema = z.object({
  title: z.string().min(1).max(255),
  dataSource: z.string().min(1).max(100),
  metric: z.string().optional(),
  filters: z.record(z.any()).optional(),
  display: z.object({
    color: z.string().optional(),
    icon: z.string().optional(),
    showTrend: z.boolean().optional(),
    chartType: z.string().optional(),
  }).optional(),
});

export const WidgetSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'kpi_card',
    'bar_chart',
    'line_chart',
    'donut_gauge',
    'data_table',
    'heatmap',
    'alert_list',
    'pie_chart',
    'gauge_chart',
    'semaforo_sla',
    'historic_grid',
    'ranking_bar',
    'kanban',
    'timeline',
  ]),
  layout: WidgetLayoutSchema,
  config: WidgetConfigSchema,
  visible: z.boolean().default(true),
});

export const DashboardLayoutSchema = z.object({
  version: z.number().int().default(1),
  grid: GridConfigSchema,
  widgets: z.array(WidgetSchema),
});

export const DashboardBaseSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1).max(255),
  descripcion: z.string().max(1000).optional().nullable(),
  layout_json: DashboardLayoutSchema,
  is_system: z.boolean().default(false),
  is_template: z.boolean().default(false),
  orden: z.number().int().min(0).optional(),
  icono: z.string().max(64).optional().nullable(),
  activo: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().optional().nullable(),
});

export const DashboardCreateSchema = DashboardBaseSchema.omit({
  id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export const DashboardUpdateSchema = DashboardBaseSchema.partial().omit({
  id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;
export type GridConfig = z.infer<typeof GridConfigSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;
export type Dashboard = z.infer<typeof DashboardBaseSchema>;
export type DashboardCreate = z.infer<typeof DashboardCreateSchema>;
export type DashboardUpdate = z.infer<typeof DashboardUpdateSchema>;
