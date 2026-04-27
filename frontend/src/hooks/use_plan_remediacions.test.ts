import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { usePlanRemediacions, useCreatePlanRemediacion, useDeletePlanRemediacion } from './usePlanRemediacions';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function QueryClientTestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  QueryClientTestWrapper.displayName = 'QueryClientTestWrapper';
  return QueryClientTestWrapper;
};

describe('usePlanRemediacions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches remediation plans', async () => {
    const mockData = [
      { id: '1', descripcion: 'Fix XSS vulnerability', estado: 'pendiente', responsable: 'team' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => usePlanRemediacions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreatePlanRemediacion', () => {
  it('creates a remediation plan', async () => {
    const newPlan = {
      descripcion: 'Fix vulnerability',
      acciones_recomendadas: 'Patch and verify',
      responsable: 'sec-team',
      fecha_limite: '2024-12-31',
      estado: 'pendiente',
      auditoria_id: '00000000-0000-0000-0000-000000000001',
    };
    const mockResponse = { id: '1', ...newPlan };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreatePlanRemediacion(), { wrapper: createWrapper() });

    result.current.mutate(newPlan);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });
});

describe('useDeletePlanRemediacion', () => {
  it('deletes a remediation plan', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { status: 'success' } });

    const { result } = renderHook(() => useDeletePlanRemediacion(), { wrapper: createWrapper() });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
