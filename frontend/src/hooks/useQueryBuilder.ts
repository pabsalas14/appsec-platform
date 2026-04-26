/**
 * useQueryBuilder — State management for Query Builder (Fase 1)
 * Handles: config, chart type, preview data, API calls
 */

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { logger } from "@/lib/logger";

export interface QueryConfig {
  base_table: string;
  joins?: Array<{ table: string; on_field: string; type: string }>;
  select_fields?: string[];
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  group_by?: string[];
  aggregations?: Array<{ field: string; alias?: string }>;
  order_by?: Array<{ field: string; direction: string }>;
  limit?: number;
}

interface PreviewData {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  row_count: number;
}

interface SavedWidget {
  id: string;
  nombre: string;
  query_config: QueryConfig;
  preview_data: PreviewData | null;
}

export const useQueryBuilder = () => {
  const [config, setConfig] = useState<QueryConfig>({
    base_table: "",
    joins: [],
    select_fields: [],
    filters: [],
    group_by: [],
    aggregations: [],
    order_by: [],
    limit: 1000,
  });

  const [chartType, setChartType] = useState<string>("data_table");

  // Fetch schema from backend
  const { data: schema = {} } = useQuery({
    queryKey: ["query-builder-schema"],
    queryFn: async () => {
      try {
        const response = await apiClient.post("/api/v1/admin/query-builder/schema-info", {});
        return response.data;
      } catch (error) {
        logger.error("query_builder.schema_fetch_failed", { error: String(error) });
        return {};
      }
    },
  });

  // Validate query
  const validateMutation = useMutation({
    mutationFn: async (queryConfig: QueryConfig) => {
      const response = await apiClient.post("/api/v1/admin/query-builder/validate", queryConfig);
      return response.data;
    },
  });

  // Execute query
  const executeMutation = useMutation({
    mutationFn: async (queryConfig: QueryConfig) => {
      const response = await apiClient.post("/api/v1/admin/query-builder/execute", {
        query_config: queryConfig,
        timeout_seconds: 30,
        max_rows: 1000,
      });
      return response.data as PreviewData;
    },
  });

  // Save widget
  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post("/api/v1/admin/query-builder/save", {
        nombre: name,
        descripcion: `Query Builder widget: ${name}`,
        query_config: config,
        chart_type: chartType,
      });
      return response.data as SavedWidget;
    },
  });

  const updateConfig = useCallback((updates: Partial<QueryConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const validate = useCallback(async () => {
    await validateMutation.mutateAsync(config);
  }, [config, validateMutation]);

  const execute = useCallback(async () => {
    await executeMutation.mutateAsync(config);
  }, [config, executeMutation]);

  const save = useCallback(
    async (name: string) => {
      return saveMutation.mutateAsync(name);
    },
    [saveMutation]
  );

  return {
    config,
    chartType,
    previewData: executeMutation.data,
    schema,
    isLoading: executeMutation.isPending,
    error: executeMutation.error?.message,
    updateConfig,
    setChartType,
    validate,
    execute,
    save,
    isSaving: saveMutation.isPending,
    validationResult: validateMutation.data,
    isValidating: validateMutation.isPending,
  };
};
