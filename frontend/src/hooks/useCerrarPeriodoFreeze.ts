import { useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';

type Envelope<T> = { status: 'success'; data: T };

export type CerrarPeriodoFreezeResult = {
  entrada: Record<string, unknown>;
  total_periodos_cerrados: number;
};

export function useCerrarPeriodoFreeze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { anio: number; mes: number }) => {
      const { data } = await api.post<Envelope<CerrarPeriodoFreezeResult>>(
        '/admin/operacion/freeze/cerrar-periodo',
        payload,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}
