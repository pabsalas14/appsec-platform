import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export type DashboardExecutiveData = {
  kpis: {
    total_vulnerabilities: number;
    critical_count: number;
    sla_compliance: number;
  };
  risk_level: string;
};

export type DashboardVulnerabilitiesData = {
  total_vulnerabilities: number;
  by_severity: Record<string, number>;
  by_state: Record<string, number>;
  overdue_count: number;
  sla_status: { green: number; yellow: number; red: number };
};

export type DashboardReleasesData = {
  total_releases: number;
  pending_approval: number;
  in_progress: number;
  completed: number;
  status_distribution: Record<string, number>;
};

export type DashboardInitiativesData = {
  total_initiatives: number;
  in_progress: number;
  completed: number;
  completion_percentage: number;
};

export type DashboardEmergingThemesData = {
  total_themes: number;
  unmoved_7_days: number;
  active: number;
};

export type DashboardProgramsData = {
  total_programs: number;
  avg_completion: number;
  programs_at_risk?: number;
};

async function fetchDashboard<T>(path: string): Promise<T> {
  const res = await api.get<ApiResponse<T>>(path);
  return res.data.data;
}

export function useDashboardExecutive() {
  return useQuery({
    queryKey: ['dashboard', 'executive'],
    queryFn: () => fetchDashboard<DashboardExecutiveData>('/dashboard/executive'),
    staleTime: 60_000,
  });
}

export function useDashboardVulnerabilities() {
  return useQuery({
    queryKey: ['dashboard', 'vulnerabilities'],
    queryFn: () => fetchDashboard<DashboardVulnerabilitiesData>('/dashboard/vulnerabilities'),
    staleTime: 60_000,
  });
}

export function useDashboardReleases() {
  return useQuery({
    queryKey: ['dashboard', 'releases'],
    queryFn: () => fetchDashboard<DashboardReleasesData>('/dashboard/releases'),
    staleTime: 60_000,
  });
}

export function useDashboardInitiatives() {
  return useQuery({
    queryKey: ['dashboard', 'initiatives'],
    queryFn: () => fetchDashboard<DashboardInitiativesData>('/dashboard/initiatives'),
    staleTime: 60_000,
  });
}

export function useDashboardEmergingThemes() {
  return useQuery({
    queryKey: ['dashboard', 'emerging-themes'],
    queryFn: () => fetchDashboard<DashboardEmergingThemesData>('/dashboard/emerging-themes'),
    staleTime: 60_000,
  });
}

export function useDashboardPrograms() {
  return useQuery({
    queryKey: ['dashboard', 'programs'],
    queryFn: () => fetchDashboard<DashboardProgramsData>('/dashboard/programs'),
    staleTime: 60_000,
  });
}
