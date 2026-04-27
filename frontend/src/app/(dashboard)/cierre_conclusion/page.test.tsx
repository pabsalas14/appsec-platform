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
      { id: '1', descripcion: 'Closed', tipo_cierre: 'resuelto', conclusiones: 'Fixed issue' },
    ];
    vi.mocked(hooks.useCierreConclusiones).mockReturnValueOnce({ data: mockClosures, isLoading: false } as any);
    render(<CierreConclusionPage />, { wrapper });
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(hooks.useCierreConclusiones).mockReturnValueOnce({ data: undefined, isLoading: true } as any);
    render(<CierreConclusionPage />, { wrapper });
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
