import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useTemaEmergentes, useCreateTemaEmergente, useDeleteTemaEmergente } from './useTemaEmergentes';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function QueryClientTestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  QueryClientTestWrapper.displayName = 'QueryClientTestWrapper';
  return QueryClientTestWrapper;
};

describe('useTemaEmergentes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches emerging topics', async () => {
    const mockData = [
      { id: '1', titulo: 'CVE-2024-001', descripcion: 'Critical vulnerability' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useTemaEmergentes(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('handles error states', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTemaEmergentes(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateTemaEmergente', () => {
  it('creates a new emerging topic', async () => {
    const newTema = {
      titulo: 'New CVE',
      descripcion: 'New vulnerability',
      tipo: 'tecnologico',
      impacto: 'alto',
      estado: 'nuevo',
      fuente: 'nvd',
    };
    const mockResponse = { id: '1', ...newTema };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateTemaEmergente(), { wrapper: createWrapper() });

    result.current.mutate(newTema);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
  });
});

describe('useDeleteTemaEmergente', () => {
  it('deletes an emerging topic', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { status: 'success' } });

    const { result } = renderHook(() => useDeleteTemaEmergente(), { wrapper: createWrapper() });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
