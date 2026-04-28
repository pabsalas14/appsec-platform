import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EvidenciaAuditoriaPage from '../evidencia_auditorias/page';
import * as hooks from '@/hooks/useEvidenciaAuditorias';

vi.mock('@/hooks/useEvidenciaAuditorias');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('EvidenciaAuditoriaPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders audit evidence list', () => {
    const mockEvidence = [
      { id: '1', nombre_archivo: 'Scan report', tipo_evidencia: 'reporte', url_archivo: 'https://example.com/scan.pdf', hash_sha256: 'abc', auditoria_id: 'aud-1', created_at: new Date().toISOString() },
    ];
    vi.mocked(hooks.useEvidenciaAuditorias).mockReturnValue({ data: mockEvidence, isLoading: false } as any);
    render(<EvidenciaAuditoriaPage />, { wrapper });
    expect(screen.getByText('Scan report')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useEvidenciaAuditorias).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<EvidenciaAuditoriaPage />, { wrapper });
    expect(screen.getByText(/Evidencias de Auditoría/i)).toBeInTheDocument();
  });
});
