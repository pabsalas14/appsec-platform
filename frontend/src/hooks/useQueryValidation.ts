/**
 * useQueryValidation — Real-time validation for query configs (Fase 1)
 * Debounced validation on config changes
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const useQueryValidation = (config: object) => {
  const [result, setResult] = useState<ValidationResult>({ valid: true, errors: [], warnings: [] });
  const [isDebouncing, setIsDebouncing] = useState(false);

  const validateMutation = useMutation({
    mutationFn: async (queryConfig: object) => {
      try {
        const response = await apiClient.post(
          "/api/v1/admin/query-builder/validate",
          queryConfig as Record<string, unknown>
        );
        return response.data as ValidationResult;
      } catch (error: unknown) {
        const detail =
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "detail" in error.response.data &&
          typeof (error.response.data as { detail?: unknown }).detail === "string"
            ? (error.response.data as { detail: string }).detail
            : error instanceof Error
              ? error.message
              : "Validation failed";
        return {
          valid: false,
          errors: [detail],
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
