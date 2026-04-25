/**
 * useQueryBuilder — state management for Query Builder (Fase 1)
 */

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface QueryConfig {
  base_table: string;
  joins?: Array<{ table: string; on_field: string; type: string }>;
  select_fields?: string[];
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  group_by?: string[];
  aggregations?: Array<{ field: string; alias?: string }>;
  order_by?: Array<{ field: string; direction: string }>;
  limit?: number;
};

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

  const [chartType, setChartType] = useState("data_table");
  const [previewData, setPreviewData] = useState<any>(null);

  // Fetch schema info (tables, columns, relationships)
  const { data: schema } = useQuery({
    queryKey: ["schema-info"],
    queryFn: () => apiClient.get("/admin/query-builder/schema-info"),
  });

  // Validate query
  const validateMutation = useMutation({
    mutationFn: (queryConfig: QueryConfig) =>
      apiClient.post("/admin/query-builder/validate", queryConfig),
  });

  // Execute query
  const executeMutation = useMutation({
    mutationFn: (queryConfig: QueryConfig) =>
      apiClient.post("/admin/query-builder/execute", queryConfig),
    onSuccess: (data) => {
      setPreviewData(data);
    },
  });

  // Save widget
  const saveMutation = useMutation({
    mutationFn: (widgetData: { nombre: string; query_config: QueryConfig; chart_type: string }) =>
      apiClient.post("/admin/query-builder/save", widgetData),
  });

  const updateConfig = useCallback((updates: Partial<QueryConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleValidate = useCallback(async () => {
    return validateMutation.mutateAsync(config);
  }, [config, validateMutation]);

  const handleExecute = useCallback(async () => {
    return executeMutation.mutateAsync(config);
  }, [config, executeMutation]);

  const handleSave = useCallback(
    (nombre: string) => {
      return saveMutation.mutateAsync({
        nombre,
        query_config: config,
        chart_type: chartType,
      });
    },
    [config, chartType, saveMutation]
  );

  return {
    config,
    chartType,
    previewData,
    schema,
    updateConfig,
    setChartType,
    validate: handleValidate,
    execute: handleExecute,
    save: handleSave,
    isValidating: validateMutation.isPending,
    isExecuting: executeMutation.isPending,
    isSaving: saveMutation.isPending,
    validationResult: validateMutation.data,
    error: executeMutation.error || saveMutation.error,
  };
};
