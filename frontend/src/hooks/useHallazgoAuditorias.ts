import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { HallazgoAuditoria, HallazgoAuditoriaCreate, HallazgoAuditoriaUpdate } from '@/lib/schemas/hallazgo_auditoria.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['hallazgo_auditorias'] as const;

export function useHallazgoAuditorias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HallazgoAuditoria[]>>('/hallazgo_auditorias/');
      return data.data;
    },
  });
}

export function useCreateHallazgoAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HallazgoAuditoriaCreate) => {
      const { data } = await api.post<Envelope<HallazgoAuditoria>>('/hallazgo_auditorias/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHallazgoAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: HallazgoAuditoriaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<HallazgoAuditoria>>(`/hallazgo_auditorias/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHallazgoAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hallazgo_auditorias/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
