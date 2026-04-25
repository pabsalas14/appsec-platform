/**
 * useQueryValidation — real-time validation for query configs (Fase 1)
 */

import { useEffect, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const useQueryValidation = (config: any) => {
  const [result, setResult] = useState<ValidationResult>({ valid: true, errors: [], warnings: [] });
  const [isDebouncing, setIsDebouncing] = useState(false);

  const validateMutation = useMutation({
    mutationFn: (queryConfig: any) =>
      apiClient.post("/admin/query-builder/validate", queryConfig),
  });

  const validate = useCallback(async (cfg: any) => {
    setIsDebouncing(true);
    try {
      const response = await validateMutation.mutateAsync(cfg);
      setResult(response || { valid: true, errors: [], warnings: [] });
    } finally {
      setIsDebouncing(false);
    }
  }, [validateMutation]);

  // Debounced validation on config change
  useEffect(() => {
    const timer = setTimeout(() => {
      validate(config);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [config, validate]);

  return {
    ...result,
    isValidating: validateMutation.isPending || isDebouncing,
    hasErrors: result.errors.length > 0,
    hasWarnings: result.warnings.length > 0,
  };
};
