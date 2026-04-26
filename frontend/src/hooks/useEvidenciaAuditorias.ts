import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { EvidenciaAuditoria, EvidenciaAuditoriaCreate, EvidenciaAuditoriaUpdate } from '@/lib/schemas/evidencia_auditoria.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['evidencia_auditorias'] as const;

export function useEvidenciaAuditorias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<EvidenciaAuditoria[]>>('/evidencia_auditorias/');
      return data.data;
    },
  });
}

export function useCreateEvidenciaAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EvidenciaAuditoriaCreate) => {
      const { data } = await api.post<Envelope<EvidenciaAuditoria>>('/evidencia_auditorias/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEvidenciaAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EvidenciaAuditoriaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<EvidenciaAuditoria>>(`/evidencia_auditorias/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvidenciaAuditoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/evidencia_auditorias/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
