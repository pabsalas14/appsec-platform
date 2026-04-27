import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  VulnGlobalData,
  VulnSubdireccionData,
  VulnCelulaData,
  VulnRepositorioTab,
  VulnHistorial,
  VulnConfig,
  VulnResumen,
} from '@/types/dashboard-vuln';
import { logger } from '@/lib/logger';

/**
 * Hook para obtener datos de vulnerabilidades a nivel global
 */
export function useVulnGlobal() {
  return useQuery({
    queryKey: ['vuln-global'],
    queryFn: async () => {
      logger.info('vuln.global.fetch');
      const response = await apiClient.get<{ data: VulnGlobalData }>(
        '/dashboard/vuln-global'
      );
      return response.data.data;
    },
  });
}

/**
 * Hook para obtener datos de vulnerabilidades a nivel subdirección
 */
export function useVulnSubdireccion(id: string | null) {
  return useQuery({
    queryKey: ['vuln-subdireccion', id],
    queryFn: async () => {
      if (!id) throw new Error('Subdirección ID requerida');
      logger.info('vuln.subdireccion.fetch', { subdir_id: id });
      const response = await apiClient.get<{ data: VulnSubdireccionData }>(
        `/dashboard/vuln-subdireccion/${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obtener datos de vulnerabilidades a nivel célula
 */
export function useVulnCelula(id: string | null) {
  return useQuery({
    queryKey: ['vuln-celula', id],
    queryFn: async () => {
      if (!id) throw new Error('Célula ID requerida');
      logger.info('vuln.celula.fetch', { celula_id: id });
      const response = await apiClient.get<{ data: VulnCelulaData }>(
        `/dashboard/vuln-celula/${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obtener vulnerabilidades por motor (SAST, DAST, SCA, etc.)
 */
export function useVulnRepositorioTab(
  repoId: string | null,
  motor: string,
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: ['vuln-repo', repoId, motor, page, pageSize],
    queryFn: async () => {
      if (!repoId) throw new Error('Repositorio ID requerida');
      logger.info('vuln.repo.tab.fetch', { repo_id: repoId, motor, page });
      const response = await apiClient.get<{ data: VulnRepositorioTab }>(
        `/dashboard/vuln-repositorio/${repoId}/${motor}`,
        {
          params: { page, page_size: pageSize },
        }
      );
      return response.data.data;
    },
    enabled: !!repoId,
  });
}

/**
 * Hook para obtener el historial de vulnerabilidades
 */
export function useVulnHistorial(repoId: string | null) {
  return useQuery({
    queryKey: ['vuln-historial', repoId],
    queryFn: async () => {
      if (!repoId) throw new Error('Repositorio ID requerida');
      logger.info('vuln.historial.fetch', { repo_id: repoId });
      const response = await apiClient.get<{ data: VulnHistorial }>(
        `/dashboard/vuln-repositorio/${repoId}/historial`
      );
      return response.data.data;
    },
    enabled: !!repoId,
  });
}

/**
 * Hook para obtener la configuración del repositorio
 */
export function useVulnConfig(repoId: string | null) {
  return useQuery({
    queryKey: ['vuln-config', repoId],
    queryFn: async () => {
      if (!repoId) throw new Error('Repositorio ID requerida');
      logger.info('vuln.config.fetch', { repo_id: repoId });
      const response = await apiClient.get<{ data: VulnConfig }>(
        `/dashboard/vuln-repositorio/${repoId}/config`
      );
      return response.data.data;
    },
    enabled: !!repoId,
  });
}

/**
 * Hook para obtener el resumen general del repositorio
 */
export function useVulnResumen(repoId: string | null) {
  return useQuery({
    queryKey: ['vuln-resumen', repoId],
    queryFn: async () => {
      if (!repoId) throw new Error('Repositorio ID requerida');
      logger.info('vuln.resumen.fetch', { repo_id: repoId });
      const response = await apiClient.get<{ data: VulnResumen }>(
        `/dashboard/vuln-repositorio/${repoId}/resumen`
      );
      return response.data.data;
    },
    enabled: !!repoId,
  });
}
