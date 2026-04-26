import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CustomField, CustomFieldValue } from '@/lib/schemas/admin';

interface PaginatedResponse<T> {
  status: string;
  data: T[];
  meta?: Record<string, any>;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Fetch custom fields with pagination
 */
export function useCustomFields(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  entityType?: string,
) {
  return useQuery({
    queryKey: ['custom-fields', page, pageSize, search, entityType],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CustomField>>(
        '/api/v1/admin/custom-fields',
        {
          params: {
            page,
            page_size: pageSize,
            ...(search && { search }),
            ...(entityType && { entity_type: entityType }),
          },
        },
      );
      return data;
    },
  });
}

/**
 * Create a new custom field
 */
export function useCreateCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (field: Omit<CustomField, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
      const { data } = await api.post('/api/v1/admin/custom-fields', field);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });
}

/**
 * Update an existing custom field
 */
export function useUpdateCustomField(fieldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (field: Partial<CustomField>) => {
      const { data } = await api.patch(`/api/v1/admin/custom-fields/${fieldId}`, field);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });
}

/**
 * Reorder fields by updating their order value
 */
export function useReorderCustomFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; order: number }>) => {
      // Update each field with its new order
      await Promise.all(
        updates.map((update) =>
          api.patch(`/api/v1/admin/custom-fields/${update.id}`, {
            order: update.order,
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });
}

/**
 * Delete (soft-delete) a custom field
 */
export function useDeleteCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldId: string) => {
      await api.delete(`/api/v1/admin/custom-fields/${fieldId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });
}

/**
 * Fetch custom field values for a specific entity instance
 */
export function useCustomFieldValues(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['custom-field-values', entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/${entityType}/${entityId}`, {});
      return data;
    },
    enabled: !!entityType && !!entityId,
  });
}

/**
 * Set a value for a custom field on an entity
 */
export function useSetCustomFieldValue(entityType: string, entityId: string, fieldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: string | null) => {
      const { data } = await api.patch(
        `/api/v1/admin/${entityType}/${entityId}/${fieldId}`,
        { value },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['custom-field-values', entityType, entityId],
      });
    },
  });
}
