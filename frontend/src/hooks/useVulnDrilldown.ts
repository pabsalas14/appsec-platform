import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface HierarchyLevel {
  id: string;
  name: string;
  type: 'global' | 'direccion' | 'subdireccion' | 'gerencia' | 'organizacion' | 'celula' | 'repositorio';
}

export interface EngineStat {
  motor: string;
  count: number;
  trend: number;
}

export interface SummaryData {
  total: number;
  by_engine: EngineStat[];
  by_severity: Record<string, number>;
  trend: Array<{ period: string; count: number }>;
  pipeline: Record<string, number>;
}

export interface ChildNode {
  id: string;
  name: string;
  count: number;
  trend?: number;
}

export interface DrilldownResponse {
  summary: SummaryData;
  children: ChildNode[];
  children_type: 'direccion' | 'subdireccion' | 'gerencia' | 'organizacion' | 'celula' | 'repositorio' | null;
}

interface DrilldownParams {
  direccion_id?: string | null;
  subdireccion_id?: string | null;
  gerencia_id?: string | null;
  organizacion_id?: string | null;
  celula_id?: string | null;
  repositorio_id?: string | null;
}

export function useVulnDrilldown(params: DrilldownParams) {
  return useQuery({
    queryKey: ['vuln-drilldown', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.direccion_id) queryParams.append('direccion_id', params.direccion_id);
      if (params.subdireccion_id) queryParams.append('subdireccion_id', params.subdireccion_id);
      if (params.gerencia_id) queryParams.append('gerencia_id', params.gerencia_id);
      if (params.organizacion_id) queryParams.append('organizacion_id', params.organizacion_id);
      if (params.celula_id) queryParams.append('celula_id', params.celula_id);
      if (params.repositorio_id) queryParams.append('repositorio_id', params.repositorio_id);

      const response = await apiClient.get<{ data: DrilldownResponse }>(
        `/api/v1/dashboard/vulnerabilities?${queryParams}`
      );
      return response.data.data;
    },
  });
}
