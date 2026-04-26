import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrEvidencia, OkrEvidenciaCreate, OkrEvidenciaUpdate } from '@/lib/schemas/okr_evidencia.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['okr_evidencias'] as const;

export function useOkrEvidencias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<OkrEvidencia[]>>('/okr_evidencias/');
      return data.data;
    },
  });
}

export function useCreateOkrEvidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OkrEvidenciaCreate) => {
      const { data } = await api.post<Envelope<OkrEvidencia>>('/okr_evidencias/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOkrEvidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrEvidenciaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrEvidencia>>(`/okr_evidencias/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOkrEvidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/okr_evidencias/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
