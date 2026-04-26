import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useHitoIniciativas, useCreateHitoIniciativa, useDeleteHitoIniciativa } from './useHitoIniciativas';
import api from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useHitoIniciativas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches initiative milestones', async () => {
    const mockData = [
      { id: '1', nombre: 'Phase 1 Completion', fecha_objetivo: '2024-06-30', estado: 'pendiente' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useHitoIniciativas(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreateHitoIniciativa', () => {
  it('creates a milestone', async () => {
    const newHito = { nombre: 'Milestone 1', fecha_objetivo: '2024-06-30', estado: 'pendiente' };
    const mockResponse = { id: '1', ...newHito };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateHitoIniciativa(), { wrapper: createWrapper() });

    result.current.mutate(newHito);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteHitoIniciativa', () => {
  it('deletes a milestone', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { status: 'success' } });

    const { result } = renderHook(() => useDeleteHitoIniciativa(), { wrapper: createWrapper() });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
