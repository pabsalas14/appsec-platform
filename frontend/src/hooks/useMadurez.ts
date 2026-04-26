import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';

type Envelope<T> = { status: 'success'; data: T };

export interface MadurezPayload {
  score: number;
  total: number;
  cerradas: number;
  activas: number;
  by_celula?: { celula: string; score: number; total: number }[];
  by_organizacion?: { organizacion: string; score: number; total: number }[];
}

interface MadurezFilters {
  subdireccion_id?: string;
  gerencia_id?: string;
  organizacion_id?: string;
  celula_id?: string;
}

export function useMadurez(filters: MadurezFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && v !== '')
  );
  return useQuery({
    queryKey: ['madurez', params],
    queryFn: async () => {
      const { data } = await api.get<Envelope<MadurezPayload>>('/madurez/summary', { params });
      return data.data;
    },
  });
}
