import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ServicioReguladoRegistro, ServicioReguladoRegistroCreate, ServicioReguladoRegistroUpdate } from '@/lib/schemas/servicio_regulado_registro.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['servicio_regulado_registros'] as const;

export function useServicioReguladoRegistros() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<ServicioReguladoRegistro[]>>('/servicio_regulado_registros/');
      return data.data;
    },
  });
}

export function useCreateServicioReguladoRegistro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServicioReguladoRegistroCreate) => {
      const { data } = await api.post<Envelope<ServicioReguladoRegistro>>('/servicio_regulado_registros/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateServicioReguladoRegistro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ServicioReguladoRegistroUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<ServicioReguladoRegistro>>(`/servicio_regulado_registros/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteServicioReguladoRegistro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/servicio_regulado_registros/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
