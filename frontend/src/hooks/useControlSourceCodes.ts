import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ControlSourceCode, ControlSourceCodeCreate, ControlSourceCodeUpdate } from '@/lib/schemas/control_source_code.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['control_source_codes'] as const;

export function useControlSourceCodes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ControlSourceCode[]>>('/control_source_codes/');
      return data.data;
    },
  });
}

export function useCreateControlSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ControlSourceCodeCreate) => {
      const { data } = await api.post<Envelope<ControlSourceCode>>('/control_source_codes/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateControlSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ControlSourceCodeUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ControlSourceCode>>(`/control_source_codes/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteControlSourceCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/control_source_codes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
