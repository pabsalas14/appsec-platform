import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Vulnerabilidad, VulnerabilidadCreate, VulnerabilidadUpdate } from '@/lib/schemas/vulnerabilidad.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['vulnerabilidads'] as const;

export function useVulnerabilidads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Vulnerabilidad[]>>('/vulnerabilidads/');
      return data.data;
    },
  });
}

export function useCreateVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VulnerabilidadCreate) => {
      const { data } = await api.post<Envelope<Vulnerabilidad>>('/vulnerabilidads/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: VulnerabilidadUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Vulnerabilidad>>(`/vulnerabilidads/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/vulnerabilidads/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
