import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { EvidenciaRemediacion, EvidenciaRemediacionCreate, EvidenciaRemediacionUpdate } from '@/lib/schemas/evidencia_remediacion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['evidencia_remediacions'] as const;

export function useEvidenciaRemediacions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<EvidenciaRemediacion[]>>('/evidencia_remediacions/');
      return data.data;
    },
  });
}

export function useCreateEvidenciaRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EvidenciaRemediacionCreate) => {
      const { data } = await api.post<Envelope<EvidenciaRemediacion>>('/evidencia_remediacions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEvidenciaRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EvidenciaRemediacionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<EvidenciaRemediacion>>(`/evidencia_remediacions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvidenciaRemediacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/evidencia_remediacions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
