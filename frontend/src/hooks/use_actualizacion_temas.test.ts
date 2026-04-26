import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useActualizacionTemas, useCreateActualizacionTema } from './useActualizacionTemas';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useActualizacionTemas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches topic updates', async () => {
    const mockData = [
      { id: '1', descripcion: 'New CVE info', fuente: 'external', impacto_cambio: 'alto' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useActualizacionTemas(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreateActualizacionTema', () => {
  it('creates a topic update', async () => {
    const newUpdate = { descripcion: 'Update', fuente: 'external' };
    const mockResponse = { id: '1', ...newUpdate };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateActualizacionTema(), { wrapper: createWrapper() });
    result.current.mutate(newUpdate);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
