import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';

type Envelope<T> = { status: 'success'; data: T };

export type ActividadProgreso = {
  id: string;
  titulo: string;
  peso_pct: number;
  estado: string;
  aporte_simulado_pct: number;
};

export type ProgresoMesData = {
  anio: number;
  mes: number;
  progreso_total_pct: number;
  actividades: ActividadProgreso[];
};

export function useIniciativaProgresoMes(iniciativaId: string | null, anio?: number, mes?: number) {
  return useQuery({
    queryKey: ['iniciativa', iniciativaId, 'progreso-mes', anio, mes],
    queryFn: async () => {
      if (!iniciativaId) return null;
      const { data } = await api.get<Envelope<ProgresoMesData>>(
        `/iniciativas/${iniciativaId}/progreso-mes`,
        { params: { anio, mes } },
      );
      return data.data;
    },
    enabled: Boolean(iniciativaId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
