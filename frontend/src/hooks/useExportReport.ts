'use client';

import { useMutation } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface ExportReportRequest {
  reviewId: string;
  format: 'pdf' | 'json' | 'csv';
}

export function useExportReport() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ExportReportRequest) => {
      const response = await api.get(
        `/api/v1/code_security_reviews/${data.reviewId}/export?format=${data.format}`,
        {
          responseType: 'blob',
        }
      );

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scr-report-${data.reviewId}.${data.format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Descarga completada',
        description: 'Reporte descargado correctamente',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Error en exportación'),
        variant: 'destructive',
      });
    },
  });
}
