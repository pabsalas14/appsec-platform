'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface CodeSecurityReview {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  progreso: number;
  tipo_escaneo: string;
  url_repositorio?: string;
  rama_analizar: string;
  findings_count: number;
  events_count: number;
  risk_score?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  agente_actual?: string;
  actividad?: string;
}

export interface CodeSecurityReviewsResponse {
  reviews: CodeSecurityReview[];
  total: number;
  skip: number;
  limit: number;
}

interface UseCodeSecurityReviewsOptions {
  skip?: number;
  limit?: number;
  estado?: string;
  enabled?: boolean;
}

export function useCodeSecurityReviews(options: UseCodeSecurityReviewsOptions = {}) {
  const { skip = 0, limit = 20, estado, enabled = true } = options;

  return useQuery({
    queryKey: ['code-security-reviews', skip, limit, estado],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('skip', String(skip));
      params.append('limit', String(limit));
      if (estado) params.append('estado', estado);

      const response = await api.get<CodeSecurityReviewsResponse>(
        `/api/v1/code_security_reviews?${params.toString()}`
      );
      return response.data;
    },
    enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCodeSecurityReviewsInvalidate() {
  const queryClient = useQueryClient();
  return {
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: ['code-security-reviews'],
      }),
  };
}
