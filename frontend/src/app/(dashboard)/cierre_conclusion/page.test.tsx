import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CierreConclusionPage from '../cierre_conclusiones/page';
import * as hooks from '@/hooks/useCierreConclusiones';

vi.mock('@/hooks/useCierreConclusiones');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('CierreConclusionPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders closures list', () => {
    const mockClosures = [
      { id: '1', titulo: 'Closed', conclusion: 'Fixed issue', recomendaciones: null, fecha_cierre: new Date().toISOString(), tema_id: 'tema-1' },
    ];
    vi.mocked(hooks.useCierreConclusiones).mockReturnValue({ data: mockClosures, isLoading: false } as any);
    render(<CierreConclusionPage />, { wrapper });
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useCierreConclusiones).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<CierreConclusionPage />, { wrapper });
    expect(screen.getByText(/Cierres y Conclusiones/i)).toBeInTheDocument();
  });
});
