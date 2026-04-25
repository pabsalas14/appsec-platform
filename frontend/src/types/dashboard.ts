export interface KPIData {
  title: string;
  value: number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
  color?: string;
  icon?: string;
}

export interface DrillDownContext {
  level: number;
  label: string;
  id?: string;
  filters: Record<string, unknown>;
}

export interface DashboardData {
  kpis?: KPIData[];
  charts?: Record<string, unknown>[];
  tables?: Array<{
    headers: string[];
    rows: Record<string, unknown>[];
    total?: number;
  }>;
  metadata?: Record<string, unknown>;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  columns?: string[];
}
