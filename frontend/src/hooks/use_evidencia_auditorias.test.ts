import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useEvidenciaAuditorias, useCreateEvidenciaAuditoria } from './useEvidenciaAuditorias';
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

describe('useEvidenciaAuditorias', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches audit evidence', async () => {
    const mockData = [
      { id: '1', descripcion: 'Scan report', tipo: 'reporte', archivo_nombre: 'scan.pdf' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'success', data: mockData } });

    const { result } = renderHook(() => useEvidenciaAuditorias(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCreateEvidenciaAuditoria', () => {
  it('creates audit evidence', async () => {
    const newEvidence = {
      nombre_archivo: 'file.pdf',
      tipo_evidencia: 'reporte',
      url_archivo: 'https://example.com/file.pdf',
      hash_sha256: '0'.repeat(64),
      auditoria_id: '00000000-0000-0000-0000-000000000001',
    };
    const mockResponse = { id: '1', ...newEvidence };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { status: 'success', data: mockResponse } });

    const { result } = renderHook(() => useCreateEvidenciaAuditoria(), { wrapper: createWrapper() });
    result.current.mutate(newEvidence);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
