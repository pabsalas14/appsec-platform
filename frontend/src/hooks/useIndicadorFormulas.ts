import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { IndicadorFormula, IndicadorFormulaCreate, IndicadorFormulaUpdate } from '@/lib/schemas/indicador_formula.schema';

type Envelope<T> = { status: 'success'; data: T };

const KEY = ['indicadores_formulas'] as const;

export function useIndicadorFormulas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<IndicadorFormula[]>>('/indicadores_formulas/');
      return data.data;
    },
  });
}

export function useCreateIndicadorFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IndicadorFormulaCreate) => {
      const { data } = await api.post<Envelope<IndicadorFormula>>('/indicadores_formulas/', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateIndicadorFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: IndicadorFormulaUpdate & { id: string }) => {
      const { data } = await api.patch<Envelope<IndicadorFormula>>(`/indicadores_formulas/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteIndicadorFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/indicadores_formulas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
