import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCierreConclusiones, useCreateCierreConclusion } from './useCierreConclusiones';
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

describe('useCierreConclusiones', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches topic closures', async () => {
    const mockData = [
      { id: '1', descripcion: 'Resolved', tipo_cierre: 'resuelto', conclusiones: 'Fixed issue' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useCierreConclusiones(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreateCierreConclusion', () => {
  it('creates a topic closure', async () => {
    const newCierre = {
      titulo: 'Cierre T1',
      conclusion: 'Closure',
      fecha_cierre: '2024-06-30',
      tema_id: '00000000-0000-0000-0000-000000000001',
    };
    const mockResponse = { id: '1', ...newCierre };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateCierreConclusion(), { wrapper: createWrapper() });
    result.current.mutate(newCierre);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
