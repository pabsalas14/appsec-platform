import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ExcepcionVulnerabilidad, ExcepcionVulnerabilidadCreate, ExcepcionVulnerabilidadUpdate } from '@/lib/schemas/excepcion_vulnerabilidad.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['excepcion_vulnerabilidads'] as const;

export function useExcepcionVulnerabilidads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ExcepcionVulnerabilidad[]>>('/excepcion_vulnerabilidads/');
      return data.data;
    },
  });
}

export function useCreateExcepcionVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ExcepcionVulnerabilidadCreate) => {
      const { data } = await api.post<Envelope<ExcepcionVulnerabilidad>>('/excepcion_vulnerabilidads/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateExcepcionVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ExcepcionVulnerabilidadUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ExcepcionVulnerabilidad>>(`/excepcion_vulnerabilidads/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteExcepcionVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/excepcion_vulnerabilidads/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAprobarExcepcionVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas?: string | null }) => {
      const { data } = await api.post<Envelope<ExcepcionVulnerabilidad>>(`/excepcion_vulnerabilidads/${id}/aprobar`, {
        notas: notas ?? null,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRechazarExcepcionVulnerabilidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas?: string | null }) => {
      const { data } = await api.post<Envelope<ExcepcionVulnerabilidad>>(`/excepcion_vulnerabilidads/${id}/rechazar`, {
        notas: notas ?? null,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReconciliarExcepcionesVencidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Envelope<{ vencidas: number }>>('/excepcion_vulnerabilidads/reconciliar-vencidas');
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
