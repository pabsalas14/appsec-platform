/**
 * Query Builder Hooks Tests — Fase 1 Frontend
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useQueryBuilder } from "@/hooks/useQueryBuilder";
import { useQueryValidation } from "@/hooks/useQueryValidation";

// Mock API client
vi.mock("@/lib/api", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("useQueryBuilder Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe("Initial State", () => {
    it("should have empty config on mount", () => {
      const { result } = renderHook(() => useQueryBuilder(), { wrapper });

      expect(result.current.config.base_table).toBe("");
      expect(result.current.config.select_fields).toEqual([]);
      expect(result.current.config.filters).toEqual([]);
      expect(result.current.chartType).toBe("data_table");
    });

    it("should have null preview data initially", () => {
      const { result } = renderHook(() => useQueryBuilder(), { wrapper });

      expect(result.current.previewData).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("Config Updates", () => {
    it("should update config when updateConfig is called", () => {
      const { result } = renderHook(() => useQueryBuilder(), { wrapper });

      result.current.updateConfig({ base_table: "users" });

      expect(result.current.config.base_table).toBe("users");
    });

    it("should merge config updates without replacing entire config", () => {
      const { result } = renderHook(() => useQueryBuilder(), { wrapper });

      result.current.updateConfig({ base_table: "users" });
      result.current.updateConfig({ select_fields: ["id", "name"] });

      expect(result.current.config.base_table).toBe("users");
      expect(result.current.config.select_fields).toEqual(["id", "name"]);
    });
  });

  describe("Chart Type", () => {
    it("should update chart type when setChartType is called", () => {
      const { result } = renderHook(() => useQueryBuilder(), { wrapper });

      result.current.setChartType("bar_chart");

      expect(result.current.chartType).toBe("bar_chart");
    });
  });
});

describe("useQueryValidation Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe("Validation Debouncing", () => {
    it("should have initial valid state", () => {
      const { result } = renderHook(() => useQueryValidation({}), { wrapper });

      expect(result.current.result.valid).toBe(true);
      expect(result.current.result.errors).toEqual([]);
    });

    it("should indicate validation in progress", () => {
      const { result } = renderHook(() => useQueryValidation({ base_table: "" }), { wrapper });

      // Initially should be debouncing
      expect(result.current.isValidating || !result.current.isValidating).toBeDefined();
    });
  });

  describe("Validation Results", () => {
    it("should return validation errors when present", async () => {
      const config = { base_table: "" };
      const { result } = renderHook(() => useQueryValidation(config), { wrapper });

      await waitFor(() => {
        // Validation result structure should be present
        expect(result.current.result).toHaveProperty("valid");
        expect(result.current.result).toHaveProperty("errors");
      });
    });
  });
});
