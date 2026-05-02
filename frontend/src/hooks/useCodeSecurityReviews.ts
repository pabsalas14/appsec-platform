'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { CodeSecurityReview } from '@/types';
import { scrDashboardAPI } from '@/services/scr-api';

export {
  useCodeSecurityReview,
  useReviewEvents,
  useReviewFindings,
  useReviewProgress,
  useReviewReport,
} from '@/hooks/useCodeSecurityReview';

type Envelope<T> = { status: string; data: T };

export type { CodeSecurityReview };

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

      const { data } = await api.get<Envelope<CodeSecurityReview[]>>(
        `/code_security_reviews?${params.toString()}`
      );
      return data.data;
    },
    enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useSCRDashboard(days: number) {
  return useQuery({
    queryKey: ['scr-dashboard-kpis', days],
    queryFn: () => scrDashboardAPI.getKPIs(days),
  });
}

export function useSCRTrends(days: number) {
  return useQuery({
    queryKey: ['scr-dashboard-trends', days],
    queryFn: () => scrDashboardAPI.getTrends(days),
  });
}

export function useCreateCodeSecurityReview() {
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<Envelope<CodeSecurityReview>>('/code_security_reviews', body);
      return data.data;
    },
  });
}

export function useAnalyzeCodeSecurityReview() {
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data } = await api.post<Envelope<unknown>>(`/code_security_reviews/${reviewId}/analyze`);
      return data.data;
    },
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
