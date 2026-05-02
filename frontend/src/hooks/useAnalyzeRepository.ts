'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface AnalyzeRepositoryRequest {
  titulo: string;
  descripcion?: string;
  tipo_escaneo: 'PUBLICO' | 'REPOSITORIO' | 'RAMA' | 'ORGANIZACION';
  url_repositorio?: string;
  rama: string;
  repositorio_id?: string;
  github_token_id?: string;
  organizacion_id?: string;
  repository_ids?: string[];
  llm_provider: string;
  llm_model: string;
}

export interface AnalyzeRepositoryResponse {
  review_id: string;
  estado: string;
  progreso: number;
  task_id: string;
}

export function useAnalyzeRepository() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AnalyzeRepositoryRequest) => {
      const response = await api.post<AnalyzeRepositoryResponse>(
        '/api/v1/code_security_reviews',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Análisis iniciado',
        description: `Review #${data.review_id.slice(0, 8)} en proceso`,
      });
      queryClient.invalidateQueries({
        queryKey: ['code-security-reviews'],
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Error al crear análisis'),
        variant: 'destructive',
      });
    },
  });
}
