import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Organizacion, OrganizacionCreate, OrganizacionUpdate } from '@/lib/schemas/organizacion.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['organizacions'] as const;

export function useOrganizacions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<Organizacion[]>>('/organizacions/');
      return data.data;
    },
  });
}

export function useCreateOrganizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrganizacionCreate) => {
      const { data } = await api.post<Envelope<Organizacion>>('/organizacions/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOrganizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: OrganizacionUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<Organizacion>>(`/organizacions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOrganizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/organizacions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
