/**
 * useQueryValidation — Real-time validation for query configs (Fase 1)
 * Debounced validation on config changes
 */

import { useEffect, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const useQueryValidation = (config: Record<string, unknown>) => {
  const [result, setResult] = useState<ValidationResult>({ valid: true, errors: [], warnings: [] });
  const [isDebouncing, setIsDebouncing] = useState(false);

  const validateMutation = useMutation({
    mutationFn: async (queryConfig: Record<string, unknown>) => {
      try {
        const response = await apiClient.post("/api/v1/admin/query-builder/validate", queryConfig);
        return response.data as ValidationResult;
      } catch (error: any) {
        return {
          valid: false,
          errors: [error.response?.data?.detail || error.message || "Validation failed"],
          warnings: [],
        };
      }
    },
  });

  // Debounce validation
  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(async () => {
      const validationResult = await validateMutation.mutateAsync(config);
      setResult(validationResult);
      setIsDebouncing(false);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timer);
    };
  }, [config, validateMutation]);

  return {
    result,
    isValidating: validateMutation.isPending || isDebouncing,
  };
};
