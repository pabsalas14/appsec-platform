import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { CierreConclusion, CierreConclusionCreate, CierreConclusionUpdate } from '@/lib/schemas/cierre_conclusion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['cierre_conclusiones'] as const;

export function useCierreConclusiones() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<CierreConclusion[]>>('/cierre_conclusiones/');
      return data.data;
    },
  });
}

export function useCreateCierreConclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CierreConclusionCreate) => {
      const { data } = await api.post<Envelope<CierreConclusion>>('/cierre_conclusiones/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCierreConclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: CierreConclusionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<CierreConclusion>>(`/cierre_conclusiones/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCierreConclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cierre_conclusiones/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
