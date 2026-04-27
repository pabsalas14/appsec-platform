import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useIndicadorFormulas, useCreateIndicadorFormula, useUpdateIndicadorFormula } from './useIndicadorFormulas';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function QueryClientTestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  QueryClientTestWrapper.displayName = 'QueryClientTestWrapper';
  return QueryClientTestWrapper;
};

describe('useIndicadorFormulas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches KPI formulas', async () => {
    const mockData = [
      { id: '1', code: 'VULN_RATE', nombre: 'Vulnerability Rate', motor: 'sql', formula: {} },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useIndicadorFormulas(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreateIndicadorFormula', () => {
  it('creates a KPI formula', async () => {
    const newFormula = {
      code: 'NEW_KPI',
      nombre: 'New KPI',
      motor: 'sql',
      formula: {},
      periodicidad: 'semanal',
    };
    const mockResponse = { id: '1', ...newFormula };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateIndicadorFormula(), { wrapper: createWrapper() });
    result.current.mutate(newFormula);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useUpdateIndicadorFormula', () => {
  it('updates a KPI formula', async () => {
    const updateData = { threshold_green: 85 };
    const mockResponse = { id: '1', threshold_green: 85 };
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useUpdateIndicadorFormula(), { wrapper: createWrapper() });
    result.current.mutate({ id: '1', ...updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
