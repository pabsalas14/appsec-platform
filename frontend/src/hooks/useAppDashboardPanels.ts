import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export type HierarchyFilters = {
  subdireccion_id?: string;
  gerencia_id?: string;
  organizacion_id?: string;
  celula_id?: string;
};

export type DashboardExecutiveData = {
  kpis: {
    total_vulnerabilities: number;
    critical_count: number;
    sla_compliance: number;
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
  const query = params.toString();
  return query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}

export function useDashboardExecutive(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['dashboard', 'executive', filters ?? {}],
    queryFn: () =>
      fetchDashboard<DashboardExecutiveData>(withHierarchy('/dashboard/executive', filters)),
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
