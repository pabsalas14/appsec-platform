import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Auditoria, AuditoriaCreate, AuditoriaUpdate } from '@/lib/schemas/auditoria.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['auditorias'] as const;

export function useAuditorias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Auditoria[]>>('/auditorias/');
      return data.data;
    },
  });
}

export function useCreateAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AuditoriaCreate) => {
      const { data } = await api.post<Envelope<Auditoria>>('/auditorias/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AuditoriaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Auditoria>>(`/auditorias/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/auditorias/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
