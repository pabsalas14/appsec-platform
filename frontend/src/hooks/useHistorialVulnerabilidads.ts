import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HistorialVulnerabilidad, HistorialVulnerabilidadCreate, HistorialVulnerabilidadUpdate } from '@/lib/schemas/historial_vulnerabilidad.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['historial_vulnerabilidads'] as const;

export function useHistorialVulnerabilidads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HistorialVulnerabilidad[]>>('/historial_vulnerabilidads/');
      return data.data;
    },
  });
}

export function useCreateHistorialVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HistorialVulnerabilidadCreate) => {
      const { data } = await api.post<Envelope<HistorialVulnerabilidad>>('/historial_vulnerabilidads/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHistorialVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HistorialVulnerabilidadUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HistorialVulnerabilidad>>(`/historial_vulnerabilidads/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHistorialVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/historial_vulnerabilidads/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
