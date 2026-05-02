'use client';

import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';

type Envelope<T> = { status: 'success'; data: T };

/** Mapa celula_id → score 0–100 (`GET /madurez/node-scores`). */
export function useMadurezCelulaScores() {
  return useQuery({
    queryKey: ['madurez', 'node-scores'],
    queryFn: async () => {
      const { data } = await api.get<Envelope<{ celula: Record<string, number> }>>('/madurez/node-scores');
      return data.data.celula ?? {};
    },
  });
}
