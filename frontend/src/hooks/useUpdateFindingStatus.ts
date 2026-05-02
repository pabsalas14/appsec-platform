'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface UpdateFindingStatusRequest {
  estado?: string;
  asignado_a_id?: string;
  notas?: string;
}

export function useUpdateFindingStatus(reviewId: string, findingId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateFindingStatusRequest) => {
      const response = await api.patch(
        `/api/v1/code_security_reviews/${reviewId}/findings/${findingId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Actualizado',
        description: 'Hallazgo actualizado correctamente',
      });
      queryClient.invalidateQueries({
        queryKey: ['code-security-finding', reviewId, findingId],
      });
      queryClient.invalidateQueries({
        queryKey: ['code-security-review', reviewId],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error al actualizar',
        variant: 'destructive',
      });
    },
  });
}
