import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { PipelineRelease, PipelineReleaseCreate, PipelineReleaseUpdate } from '@/lib/schemas/pipeline_release.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['pipeline_releases'] as const;

export function usePipelineReleases() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<PipelineRelease[]>>('/pipeline_releases/');
      return data.data;
    },
  });
}

export function useCreatePipelineRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PipelineReleaseCreate) => {
      const { data } = await api.post<Envelope<PipelineRelease>>('/pipeline_releases/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePipelineRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: PipelineReleaseUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<PipelineRelease>>(`/pipeline_releases/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePipelineRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pipeline_releases/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
