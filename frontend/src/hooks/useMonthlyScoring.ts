import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['admin', 'scoring-mensual'] as const;

export type HistoricoScoringRow = {
  id: string;
  anio: number;
  mes: number;
  scope_kind: string;
  scope_id: string;
  score_total: number;
  score_vulnerabilidades: number;
  score_programas: number;
  score_iniciativas: number;
  score_okrs: number;
  pesos_json: Record<string, number>;
  computed_at: string | null;
};

export function useHistoricoScoringMensual(params: { anio?: number; mes?: number } = {}) {
  const sp = new URLSearchParams();
  if (params.anio != null) sp.set('anio', String(params.anio));
  if (params.mes != null) sp.set('mes', String(params.mes));
  const qs = sp.toString();
  return useQuery({
    queryKey: [...KEY, 'historico', qs] as const,
    queryFn: async () => {
      const { data } = await api.get<Envelope<HistoricoScoringRow[]>>(
        `/admin/scoring-mensual/historico${qs ? `?${qs}` : ''}`,
      );
      return data.data;
    },
  });
}

export function useEjecutarScoringMensual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { anio: number; mes: number }) => {
      const { data } = await api.post<Envelope<{ celulas_computadas: number }>>(
        '/admin/scoring-mensual/ejecutar',
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
