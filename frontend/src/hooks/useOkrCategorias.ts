import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { OkrCategoria, OkrCategoriaCreate, OkrCategoriaUpdate } from '@/lib/schemas/okr_categoria.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['okr_categorias'] as const;

export function useOkrCategorias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<OkrCategoria[]>>('/okr_categorias/');
      return data.data;
    },
  });
}

export function useCreateOkrCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OkrCategoriaCreate) => {
      const { data } = await api.post<Envelope<OkrCategoria>>('/okr_categorias/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOkrCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OkrCategoriaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<OkrCategoria>>(`/okr_categorias/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOkrCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/okr_categorias/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
