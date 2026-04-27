import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface WidgetDataParams {
  dataSource: string;
  metric?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

interface WidgetDataResponse {
  data: Record<string, unknown>[];
  total: number;
  summary?: Record<string, unknown>;
}

export function useWidgetData(
  params: WidgetDataParams,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['widget-data', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('data_source', params.dataSource);
      
      if (params.metric) queryParams.append('metric', params.metric);
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.offset) queryParams.append('offset', String(params.offset));
      
      if (params.filters) {
        queryParams.append('filters', JSON.stringify(params.filters));
      }

      const response = await apiClient.get(
        `/widget-data?${queryParams.toString()}`
      );
      return response.data.data as WidgetDataResponse;
    },
    enabled,
    staleTime: 30000, // 30 segundos
  });
}
