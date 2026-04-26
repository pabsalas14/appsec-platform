import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMadurez } from './useMadurez';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMadurez', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches maturity score without filters', async () => {
    const mockData = {
      score: 75,
      total: 100,
      cerradas: 75,
      activas: 25,
      by_celula: [],
      by_organizacion: [],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useMadurez(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });

  it('fetches maturity score with filters', async () => {
    const mockData = {
      score: 80,
      total: 50,
      cerradas: 40,
      activas: 10,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(
      () => useMadurez({ organizacion_id: 'org-1', celula_id: 'cel-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.score).toBe(80);
  });

  it('includes breakdown data when available', async () => {
    const mockData = {
      score: 75,
      total: 100,
      cerradas: 75,
      activas: 25,
      by_celula: [{ celula: 'Security Team', score: 85, total: 30 }],
      by_organizacion: [{ organizacion: 'Engineering', score: 70, total: 100 }],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useMadurez(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.by_celula).toBeDefined();
    expect(result.current.data?.by_organizacion).toBeDefined();
  });

  it('handles filter parameters correctly', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: { score: 75 } } });

    renderHook(() => useMadurez({ subdireccion_id: 'sub-1', gerencia_id: 'ger-1' }), {
      wrapper: createWrapper(),
    });

    expect(api.get).toHaveBeenCalledWith('/madurez/summary', expect.objectContaining({
      params: expect.objectContaining({
        subdireccion_id: 'sub-1',
        gerencia_id: 'ger-1',
      }),
    }));
  });

  it('handles loading and error states', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMadurez(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
