'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface EntityCustomFieldDef {
  id: string;
  name: string;
  field_type: string;
  entity_type: string;
  label: string | null;
  description?: string | null;
  is_required?: boolean;
  config?: string | null;
}

export interface EntityCustomFieldsBundle {
  entity_type: string;
  entity_id: string;
  fields: EntityCustomFieldDef[];
  values: Record<string, string | null>;
}

export function useEntityCustomFields(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['entity-custom-fields', entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get<{ status: string; data: EntityCustomFieldsBundle }>(
        `/entity-custom-fields/${entityType}/${entityId}`,
      );
      return data.data;
    },
    enabled: Boolean(entityType && entityId),
  });
}

export function usePatchEntityCustomField(entityType: string, entityId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fieldId, value }: { fieldId: string; value: string | null }) => {
      const { data } = await api.patch<{ status: string; data: { field_id: string; value: unknown } }>(
        `/entity-custom-fields/${entityType}/${entityId}/${fieldId}`,
        { value },
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-custom-fields', entityType, entityId] });
    },
  });
}
