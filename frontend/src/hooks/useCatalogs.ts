'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { CatalogRead, CatalogCreate, CatalogUpdate } from '@/lib/schemas/catalog.schema';

const CATALOGS_KEY = ['catalogs'] as const;

export function useCatalogs(page = 1, pageSize = 50, isActive?: boolean, q?: string) {
  return useQuery({
    queryKey: [...CATALOGS_KEY, page, pageSize, isActive, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      if (isActive !== undefined) params.append('is_active', isActive.toString());
      if (q) params.append('q', q);

      const { data } = await api.get(`/admin/catalogs?${params}`);
      return data;
    },
  });
}

export function useCatalog(catalogId: string) {
  return useQuery({
    queryKey: [...CATALOGS_KEY, catalogId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/catalogs/${catalogId}`);
      return data;
    },
    enabled: !!catalogId,
  });
}

export function useGetCatalogByType(catalogType: string) {
  return useQuery({
    queryKey: [...CATALOGS_KEY, 'public', catalogType],
    queryFn: async () => {
      const { data } = await api.get(`/catalogs/${catalogType}`);
      return data;
    },
    enabled: !!catalogType,
  });
}

export function useCreateCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CatalogCreate) => {
      const { data } = await api.post('/admin/catalogs', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      toast.success('Catálogo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear catálogo');
    },
  });
}

export function useUpdateCatalog(catalogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CatalogUpdate) => {
      const { data } = await api.patch(`/admin/catalogs/${catalogId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      toast.success('Catálogo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar catálogo');
    },
  });
}

export function useDeleteCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (catalogId: string) => {
      const { data } = await api.delete(`/admin/catalogs/${catalogId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOGS_KEY });
      toast.success('Catálogo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar catálogo');
    },
  });
}
