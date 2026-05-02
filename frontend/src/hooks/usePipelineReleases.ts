import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { PipelineRelease, PipelineReleaseCreate, PipelineReleaseUpdate } from '@/lib/schemas/pipeline_release.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['pipeline_releases'] as const;

export type PipelineReleasesListParams = {
  repositorio_id?: string;
  activo_web_id?: string;
  service_release_id?: string;
  scan_id?: string;
  tipo?: string;
  rama?: string;
  mes?: string | number;
};

function listParamsToQuery(p?: PipelineReleasesListParams): Record<string, string> | undefined {
  if (!p) return undefined;
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(p) as [keyof PipelineReleasesListParams, string | number | undefined][]) {
    if (v === undefined || v === '') continue;
    o[k] = String(v);
  }
  return Object.keys(o).length ? o : undefined;
}

export function usePipelineReleases(params?: PipelineReleasesListParams) {
  const q = listParamsToQuery(params);
  return useQuery({
    queryKey: [...KEY, q ?? {}] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<PipelineRelease[]>>('/pipeline_releases/', {
        params: q,
      });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline_releases'] }),
  });
}

export function useUpdatePipelineRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: PipelineReleaseUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<PipelineRelease>>(`/pipeline_releases/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline_releases'] }),
  });
}

export function useDeletePipelineRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pipeline_releases/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline_releases'] }),
  });
}
