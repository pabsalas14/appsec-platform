import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HallazgoPipeline, HallazgoPipelineCreate, HallazgoPipelineUpdate } from '@/lib/schemas/hallazgo_pipeline.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['hallazgo_pipelines'] as const;

export function useHallazgoPipelines() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HallazgoPipeline[]>>('/hallazgo_pipelines/');
      return data.data;
    },
  });
}

export function useCreateHallazgoPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HallazgoPipelineCreate) => {
      const { data } = await api.post<Envelope<HallazgoPipeline>>('/hallazgo_pipelines/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHallazgoPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HallazgoPipelineUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HallazgoPipeline>>(`/hallazgo_pipelines/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHallazgoPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hallazgo_pipelines/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
