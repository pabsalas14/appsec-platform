import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useActualizacionIniciativas, useCreateActualizacionIniciativa } from './useActualizacionIniciativas';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useActualizacionIniciativas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches initiative updates', async () => {
    const mockData = [
      { id: '1', descripcion: 'Phase 1 progress', tipo: 'progreso', porcentaje_avance: 25 },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useActualizacionIniciativas(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreateActualizacionIniciativa', () => {
  it('creates an initiative update', async () => {
    const newUpdate = { descripcion: 'Update', tipo: 'progreso', porcentaje_avance: 50 };
    const mockResponse = { id: '1', ...newUpdate };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateActualizacionIniciativa(), { wrapper: createWrapper() });
    result.current.mutate(newUpdate);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
