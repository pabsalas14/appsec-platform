import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useCierreConclusiones, useCreateCierreConclusión } from './useCierreConclusiones';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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

describe('useCreateCierreConclusión', () => {
  it('creates a topic closure', async () => {
    const newCierre = { descripcion: 'Closure', tipo_cierre: 'resuelto' };
    const mockResponse = { id: '1', ...newCierre };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateCierreConclusión(), { wrapper: createWrapper() });
    result.current.mutate(newCierre);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
