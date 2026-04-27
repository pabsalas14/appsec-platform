import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export type HierarchyFilters = {
  direccion_id?: string;
  subdireccion_id?: string;
  gerencia_id?: string;
  organizacion_id?: string;
  celula_id?: string;
  repositorio_id?: string;
};

/** Respuesta de `GET /dashboard/executive` (tablero ejecutivo unificado). */
export type ExecutiveDashboardResponse = {
  kpis: {
    programs_advancement: number;
    critical_vulns: number;
    active_releases: number;
    emerging_themes: number;
    audits: number;
  };
  kpi_sub?: {
    critical_by_fuente: Array<{ fuente: string; count: number }>;
    emerging_stale_7d: number;
    releases_sla_riesgo: number;
    releases_riesgo_pct?: number;
    audits_not_completed: number;
  };
  kpi_trends?: {
    avance_cierre_pp: number;
    volumen_severidad_delta: number;
  };
  risk_level: string;
  security_posture: number;
  trend_months: number;
  trend_mode?: 'sliding' | 'calendar';
  ref_month?: string | null;
  trend_data: Array<{
    name: string;
    criticas: number;
    altas: number;
    medias: number;
    bajas: number;
    volumen_total?: number;
    meta_plan?: number;
    avance_global_prom?: number;
    avance_cierre?: number;
    cerradas_en_periodo?: number;
    creadas_en_periodo?: number;
    kpi_activa_releases?: number;
    kpi_temas_inventario?: number;
    kpi_audits_inventario?: number;
    pct_sla_ok?: number;
    pct_sla_riesgo?: number;
    pct_sla_venc?: number;
  }>;
  sla_spark?: {
    a_tiempo_pct: number[];
    en_riesgo_pct: number[];
    vencido_pct: number[];
  };
  top_repos: Array<{ label: string; value: number; color: string }>;
  sla_status: Array<{
    status: 'ok' | 'warning' | 'critical';
    label: string;
    count: number;
    percentage: number;
  }>;
  audits: Array<{
    id: string;
    nombre: string;
    tipo: string;
    responsable: string;
    fecha: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    estado: string;
    hallazgos: number;
    pendientes?: number;
  }>;
  audits_total?: number;
  audits_offset?: number;
  audits_limit?: number;
  audits_solo_activas?: boolean;
  generated_at?: string;
  applied_filters?: Record<string, string | null | undefined>;
};

export type DashboardExecutiveData = {
  kpis: {
    total_vulnerabilities?: number;
    /** Legacy client key; API sends `critical_vulns`. */
    critical_count?: number;
    critical_vulns?: number;
    programs_advancement?: number;
    active_releases?: number;
    emerging_themes?: number;
    audits?: number;
    sla_compliance?: number;
  };
  by_severity?: Record<string, number>;
  trend?: { new_vulnerabilities_7d?: number };
  risk_level: string;
  applied_filters?: Record<string, string>;
};

export type DashboardVulnerabilitiesData = {
  total_vulnerabilities: number;
  by_severity: Record<string, number>;
  by_state: Record<string, number>;
  overdue_count: number;
  sla_status: { green: number; yellow: number; red: number };
  applied_filters?: Record<string, string>;
};

export type DashboardReleasesData = {
  total_releases: number;
  pending_approval: number;
  in_progress: number;
  completed: number;
  status_distribution: Record<string, number>;
  applied_filters?: Record<string, string>;
};

export type DashboardInitiativesData = {
  total_initiatives: number;
  in_progress: number;
  completed: number;
  completion_percentage: number;
  applied_filters?: Record<string, string>;
};

export type DashboardEmergingThemesData = {
  total_themes: number;
  unmoved_7_days: number;
  active: number;
  applied_filters?: Record<string, string>;
};

export type DashboardProgramsData = {
  total_programs: number;
  avg_completion: number;
  programs_at_risk?: number;
  program_breakdown?: Array<{
    program: string;
    total_findings: number;
    closed_findings: number;
    completion_percentage: number;
  }>;
  applied_filters?: Record<string, string>;
};

export type DashboardTeamData = {
  team_size: number;
  analysts: Array<{
    user_id: string;
    total_vulnerabilities: number;
    open_vulnerabilities: number;
    closed_vulnerabilities: number;
    closure_rate: number;
  }>;
  applied_filters?: Record<string, string>;
};

export type DashboardProgramDetailData = {
  program: string;
  source: string;
  total_findings: number;
  open_findings: number;
  closed_findings: number;
  overdue_findings: number;
  completion_percentage: number;
  applied_filters?: Record<string, string>;
};

export type DashboardReleasesTableData = {
  items: Array<{
    id: string;
    nombre: string;
    version: string;
    estado_actual: string;
    jira_referencia?: string | null;
    created_at?: string | null;
  }>;
  count: number;
  applied_filters?: Record<string, string>;
};

export type DashboardReleasesKanbanData = {
  columns: Record<string, Array<{ id: string; nombre: string; version: string }>>;
  total_cards: number;
  applied_filters?: Record<string, string>;
};

async function fetchDashboard<T>(path: string): Promise<T> {
  const res = await api.get<ApiResponse<T>>(path);
  return res.data.data;
}

function withHierarchy(path: string, filters?: HierarchyFilters): string {
  if (!filters) return path;
  const params = new URLSearchParams();
  if (filters.subdireccion_id) params.set('subdireccion_id', filters.subdireccion_id);
  if (filters.gerencia_id) params.set('gerencia_id', filters.gerencia_id);
  if (filters.organizacion_id) params.set('organizacion_id', filters.organizacion_id);
  if (filters.celula_id) params.set('celula_id', filters.celula_id);
  if (filters.direccion_id) params.set('direccion_id', filters.direccion_id);
  if (filters.repositorio_id) params.set('repositorio_id', filters.repositorio_id);
  const query = params.toString();
  return query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}

function withExecutiveOptions(
  path: string,
  opts: {
    trendMonths: number;
    refMonth?: string | null;
    auditsOffset?: number;
    auditsLimit?: number;
    auditsSoloActivas?: boolean;
  },
): string {
  const params = new URLSearchParams();
  params.set('trend_months', String(opts.trendMonths));
  if (opts.refMonth != null && opts.refMonth !== '') {
    params.set('ref_month', opts.refMonth);
  }
  if (opts.auditsOffset != null && opts.auditsOffset > 0) {
    params.set('audits_offset', String(opts.auditsOffset));
  }
  if (opts.auditsLimit != null) {
    params.set('audits_limit', String(opts.auditsLimit));
  }
  if (opts.auditsSoloActivas) {
    params.set('audits_solo_activas', 'true');
  }
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${params.toString()}`;
}

export function useDashboardExecutive(
  filters?: HierarchyFilters,
  options?: {
    trendMonths?: number;
    refMonth?: string | null;
    auditsOffset?: number;
    auditsLimit?: number;
    auditsSoloActivas?: boolean;
  },
) {
  const trendMonths = options?.trendMonths ?? 6;
  const refMonth = options?.refMonth ?? null;
  const auditsOffset = options?.auditsOffset ?? 0;
  const auditsLimit = options?.auditsLimit ?? 10;
  const auditsSoloActivas = options?.auditsSoloActivas ?? false;
  return useQuery({
    queryKey: [
      'dashboard',
      'executive',
      filters ?? {},
      trendMonths,
      refMonth,
      auditsOffset,
      auditsLimit,
      auditsSoloActivas,
    ],
    queryFn: () =>
      fetchDashboard<ExecutiveDashboardResponse>(
        withExecutiveOptions(withHierarchy('/dashboard/executive', filters), {
          trendMonths,
          refMonth,
          auditsOffset,
          auditsLimit,
          auditsSoloActivas,
        }),
      ),
    staleTime: 60_000,
  });
}

export function useDashboardVulnerabilities(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'vulnerabilities', filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardVulnerabilitiesData>(
        withHierarchy('/dashboard/vulnerabilities', filters)
      ),
    staleTime: 60_000,
  });
}

export function useDashboardReleases(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'releases', filters ?? {}],
    queryFn: () => fetchDashboard<DashboardReleasesData>(withHierarchy('/dashboard/releases', filters)),
    staleTime: 60_000,
  });
}

export function useDashboardInitiatives(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'initiatives', filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardInitiativesData>(withHierarchy('/dashboard/initiatives', filters)),
    staleTime: 60_000,
  });
}

export function useDashboardEmergingThemes(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'emerging-themes', filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardEmergingThemesData>(
        withHierarchy('/dashboard/emerging-themes', filters)
      ),
    staleTime: 60_000,
  });
}

export function useDashboardPrograms(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'programs', filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardProgramsData>(withHierarchy('/dashboard/programs', filters)),
    staleTime: 60_000,
  });
}

export function useDashboardTeam(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'team', filters ?? {}],
    queryFn: () => fetchDashboard<DashboardTeamData>(withHierarchy('/dashboard/team', filters)),
    staleTime: 60_000,
  });
}

export function useDashboardProgramDetail(program = 'sast', filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'program-detail', program, filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardProgramDetailData>(
        withHierarchy(`/dashboard/program-detail?program=${encodeURIComponent(program)}`, filters)
      ),
    staleTime: 60_000,
  });
}

export function useDashboardReleasesTable(limit = 50, filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'releases-table', limit, filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardReleasesTableData>(
        withHierarchy(`/dashboard/releases-table?limit=${limit}`, filters)
      ),
    staleTime: 60_000,
  });
}

export function useDashboardReleasesKanban(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'releases-kanban', filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardReleasesKanbanData>(
        withHierarchy('/dashboard/releases-kanban', filters)
      ),
    staleTime: 60_000,
  });
}
