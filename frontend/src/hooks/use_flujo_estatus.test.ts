import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useFlujoEstatus, useCreateFlujoEstatus } from './useFlujoEstatus';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFlujoEstatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches status flow rules', async () => {
    const mockData = [
      { id: '1', entity_type: 'vulnerabilidad', from_status: 'abierta', to_status: 'cerrada' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useFlujoEstatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreateFlujoEstatus', () => {
  it('creates a status flow rule', async () => {
    const newFlujo = { entity_type: 'vulnerabilidad', from_status: 'abierta', to_status: 'cerrada' };
    const mockResponse = { id: '1', ...newFlujo };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateFlujoEstatus(), { wrapper: createWrapper() });
    result.current.mutate(newFlujo);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
