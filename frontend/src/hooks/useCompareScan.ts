'use client';

import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface CompareScanRequest {
  review_id_1: string;
  review_id_2: string;
}

export interface CompareScanResult {
  added: Array<{ id: string; archivo: string; tipo_riesgo: string }>;
  removed: Array<{ id: string; archivo: string; tipo_riesgo: string }>;
  changed: Array<{
    id: string;
    archivo: string;
    old_severidad: string;
    new_severidad: string;
  }>;
  summary: {
    total_added: number;
    total_removed: number;
    total_changed: number;
  };
}

export function useCompareScan() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CompareScanRequest) => {
      const response = await api.post<CompareScanResult>(
        '/api/v1/code_security_reviews/compare',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Comparación completada',
        description: 'Análisis comparativo generado',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error en comparación',
        variant: 'destructive',
      });
    },
  });
}
