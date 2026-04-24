import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { EvidenciaRegulacion, EvidenciaRegulacionCreate, EvidenciaRegulacionUpdate } from '@/lib/schemas/evidencia_regulacion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['evidencia_regulacions'] as const;

export function useEvidenciaRegulacions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<EvidenciaRegulacion[]>>('/evidencia_regulacions/');
      return data.data;
    },
  });
}

export function useCreateEvidenciaRegulacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EvidenciaRegulacionCreate) => {
      const { data } = await api.post<Envelope<EvidenciaRegulacion>>('/evidencia_regulacions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEvidenciaRegulacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EvidenciaRegulacionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<EvidenciaRegulacion>>(`/evidencia_regulacions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvidenciaRegulacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/evidencia_regulacions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
